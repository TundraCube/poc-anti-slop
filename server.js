const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// --- Rule definitions ---
const UI_PATTERNS = [
  { id: 'ui-sparkle', label: 'Sparkle/star/magic/AI icons', fileTypes: ['.jsx','.tsx','.js','.ts','.html','.vue','.svelte','.css'],
    regex: /\bsparkles?\b|\bmagicWand\b|\bwand-?\b|sparkle|star\b(?!t|s\b)|✨|⚡|🔮|🤖|robot\b|ai.?orb|diamond\b(?!\s*(:|size|shape|inheritance|problem|pattern|dependency))/gi },
  { id: 'ui-beta-pill', label: 'Beta/New/AI-powered badges', fileTypes: ['.jsx','.tsx','.js','.ts','.html','.vue','.svelte'],
    regex: /(beta|alpha|new)\s*(badge|pill|tag|label)|ai.?powered|powered by ai|<Badge[^>]*>.*?(beta|ai|new)/gi },
  { id: 'ui-fake-terminal', label: 'Fake terminal screenshots', fileTypes: ['.jsx','.tsx','.js','.ts','.html'],
    regex: /terminal\s*window|fake.?terminal|terminal.?component|<Terminal|terminal-wrapper|hero.?terminal|npx\s+create|npm\s+install\s+[\w-]+/gi },
  { id: 'ui-purple-gradient', label: 'Gradient purple/blue/pink backgrounds', fileTypes: ['.css','.scss','.less','.jsx','.tsx','.vue','.html'],
    regex: /(blue|purple|violet).*(gradient|to-)|(gradient|to-).*(blue|purple|violet)|linear-gradient\(.*(?:#[78][0-9a-f]{5}|rgb\(\s*(?:1[2-9]\d|[78]\d))|from-purple|to-purple|via-purple|bg-gradient-to-r\s+from-blue\s+to-purple/gi },
  { id: 'ui-buzzwords', label: 'Revolutionary/game-changing language', fileTypes: ['.jsx','.tsx','.js','.ts','.html','.md','.txt'],
    regex: /\brevolutionary\b|\bgame.?changing\b|\bnext.?gen(eration)?\b|\bcutting.?edge\b|\bseamless\b/i },
  { id: 'ui-generic-icons', label: 'Lucide/thin-stroke generic icons', fileTypes: ['.jsx','.tsx','.js','.ts','.html'],
    regex: /lucide-react|lucide-vue|@tabler\/icons|react-icons\/(fa|md|io|fi)/gi },
  { id: 'ui-glassmorphism', label: 'Glassmorphism overuse', fileTypes: ['.css','.scss','.less','.jsx','.tsx'],
    regex: /backdrop-filter:\s*blur|backdrop-blur|glassmorph|bg-glass|glass\s*panel/gi },
  { id: 'ui-bento-grid', label: 'Bento grid layout', fileTypes: ['.css','.scss','.jsx','.tsx','.html','.vue'],
    regex: /bento[\s-]*(grid|box|layout)|grid-cols-.*grid-rows|bentoBox|bento-component/gi },
  { id: 'ui-status-dot', label: 'Decorative status dot', fileTypes: ['.jsx','.tsx','.html','.css'],
    regex: /puls(e|ing)\s*(dot|circle|indicator)|status.?dot|online.?dot|<Dot|dot-outline|glowing.?dot/gi }
];

const COPY_PATTERNS = [
  { id: 'copy-emoji-bullets', label: 'Emoji bullet lists', fileTypes: ['.md','.txt','.html','.jsx','.tsx','.vue'],
    regex: /^[\s-]*[🚀✨✅🔥💡🤖🔒🎯💪📈🔧🌟]/m },
  { id: 'copy-allcaps', label: 'ALL CAPS hype phrases', fileTypes: ['.md','.txt','.html'],
    regex: /\b[A-Z]{4,}\b.*\b[A-Z]{4,}\b.*\b[A-Z]{4,}\b/ },
  { id: 'copy-buzzwords', label: 'Leverage/synergy/robust buzzwords', fileTypes: ['.md','.html','.jsx','.tsx','.vue'],
    regex: /\bleverage\b|\bsynerg(y|ies|istic)\b|\brobust\b(?!\s*(?:data|error|solution|retry|handling|mode|approach|way|method|system|architecture|design|framework))/gi },
  { id: 'copy-fake-testimonials', label: 'Fake testimonials/avatars', fileTypes: ['.jsx','.tsx','.html','.md'],
    regex: /testimonial|\"says?\s+\w|avatar.*ai|fake.?avatar|[A-Z][a-z]+\s+Chen|VP\s+(of|Engineering)/gi },
  { id: 'copy-em-dash', label: 'Em dash (—) usage', fileTypes: ['.md','.html','.txt','.jsx','.tsx'],
    regex: /—|&mdash;/g },
  { id: 'copy-false-ranges', label: 'False ranges "from X to Y"', fileTypes: ['.md','.html','.txt'],
    regex: /from\s+\w+\s+to\s+\w+,\s+and\s+everything\s+in\s+between/i },
  { id: 'copy-filler', label: 'Filler phrases', fileTypes: ['.md','.html','.txt'],
    regex: /\bin order to\b|\bdue to the fact that\b|\bat this point in time\b|\bit is important to note that\b/i },
  { id: 'copy-weasel', label: 'Weasel attributions', fileTypes: ['.md','.html','.txt'],
    regex: /experts\s+say|industry\s+(observers|analysts|leaders)\s+(say|report|believe)/i }
];

const CODE_PATTERNS = [
  { id: 'code-banners', label: 'Box-drawing comment banners', fileTypes: ['.js','.ts','.py','.java','.go','.rs','.c','.cpp','.rb','.php'],
    regex: /^[ \t]*(\/\/|#|\/\*)\s*[=#*-]{5,}/m },
  { id: 'code-emoji-comments', label: 'Emoji in comments', fileTypes: ['.js','.ts','.py','.rs','.go','.java','.c','.cpp','.rb','.php'],
    regex: /(\/\/|#)\s*[🚀✨✅🔥💡🤖🔒🎯💪📈🔧🌟🧵📦🔨💬🎨]/ },
  { id: 'code-obvious-comments', label: 'Comments restating the obvious', fileTypes: ['.js','.ts','.py','.java','.go','.rust','.rb','.php'],
    regex: /\/\/\s*(initialize|set|get|create)\s+(the|a|an)\s+\w+|#\s*(initialize|set|get|create)\s+(the|a|an)\s+\w+/gi },
  { id: 'code-step-narration', label: 'Step-by-step narration comments', fileTypes: ['.js','.ts','.py','.java','.go','.rs','.rb','.php'],
    regex: /^\s*(\/\/|#)\s*(Step|First|Next|Finally|Then)\s*\d*\s*:/m },
  { id: 'code-empty-labels', label: 'Empty label comments', fileTypes: ['.js','.ts','.py','.java','.go','.rs','.rb','.php'],
    regex: /^\s*(\/\/|#)\s*(Main|Core|Helper|Entry)\s*(logic|point|function)?\s*$/m },
  { id: 'code-end-markers', label: 'End-of-block markers', fileTypes: ['.js','.ts','.py','.java','.go','.rs','.rb','.php'],
    regex: /(\/\/|#)\s*end\s*(if|for|while|function|class|of)/i }
];

const ALL_PATTERNS = [...UI_PATTERNS, ...COPY_PATTERNS, ...CODE_PATTERNS];

function countFiles(dir) {
  let count = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        count += countFiles(full);
      } else {
        count += 1;
      }
    }
  } catch (_) {}
  return count;
}

function scanFile(filePath, content) {
  const ext = path.extname(filePath).toLowerCase();
  const violations = [];
  for (const rule of ALL_PATTERNS) {
    if (!rule.fileTypes.includes(ext)) continue;
    const matches = content.match(rule.regex);
    if (matches) {
      violations.push({ ruleId: rule.id, label: rule.label, count: matches.length, lines: matches.slice(0, 3) });
    }
  }
  return violations;
}

function getCategory(ruleId) {
  if (ruleId.startsWith('ui-')) return 'UI';
  if (ruleId.startsWith('copy-')) return 'Copy';
  if (ruleId.startsWith('code-')) return 'Code';
  return 'Other';
}

app.post('/scan', async (req, res) => {
  const { url } = req.body;
  if (!url || !url.includes('github.com')) {
    return res.status(400).json({ error: 'Valid GitHub URL required' });
  }

  const scanId = Date.now().toString(36);
  const tmpDir = path.join(os.tmpdir(), `anti-slop-${scanId}`);

  try {
    // Clone repo
    execSync(`git clone --depth 1 ${url} ${tmpDir}`, { timeout: 30000, stdio: 'pipe' });

    // Walk files
    const results = [];
    const walkDir = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          walkDir(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          const relevant = ALL_PATTERNS.some(r => r.fileTypes.includes(ext));
          if (!relevant) continue;
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const violations = scanFile(entry.name, content);
            if (violations.length > 0) {
              results.push({ file: fullPath.replace(tmpDir + '/', ''), violations });
            }
          } catch (e) {
            // Skip binary/unreadable
          }
        }
      }
    };
    walkDir(tmpDir);

    // Calculate scores
    let totalViolations = 0;
    const catCounts = { UI: 0, Copy: 0, Code: 0 };
    for (const r of results) {
      for (const v of r.violations) {
        totalViolations += v.count;
        catCounts[getCategory(v.ruleId)] += v.count;
      }
    }

    // Score: 0 = clean, 100 = maximum slop. Weighted by violations per file.
    const filesScanned = results.length || 0;
    const fileCount = filesScanned || 1;
    const score = Math.min(100, Math.round((totalViolations / fileCount) * 5));

    // If no files were even checked, score is meaningless — report it
    const filesChecked = results.length > 0 ? results.length : 0;
    const totalFilesInRepo = countFiles(tmpDir);

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });

    res.json({
      score,
      totalViolations,
      categories: catCounts,
      filesScanned: filesChecked,
      totalFilesInRepo,
      results
    });
  } catch (e) {
    // Cleanup on error
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
    res.status(500).json({ error: `Scan failed: ${e.message}` });
  }
});

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => {
  console.log(`Anti-Slop Scanner running at http://localhost:${PORT}`);
});