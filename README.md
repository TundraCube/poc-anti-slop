# Anti-Slop Scanner

Scan GitHub repositories for AI-generated slop patterns — generic UI, filler copy, and code noise.

**Live demo**: https://srv1304246.tail364e73.ts.net:8443

## What it does

Paste any public GitHub repo URL, click Scan, and get:
- Overall slop score (0–100, lower = cleaner)
- File-by-file breakdown of violations
- Category visualization (UI / Copy / Code)
- 23 detection rules across three categories

## Setup

```bash
npm install && npm start
```

Open http://localhost:3100.

## Architecture

| Layer | Stack |
|-------|-------|
| Server | Node.js + Express |
| Frontend | Vanilla HTML/CSS (dark theme) |
| Scanning | git clone + regex rules (23 patterns) |
| Dependencies | express only |

No database, no API keys, no external services post-install.

## Part of the Star → POC Pipeline

This POC was autonomously built as Stage 3 of an automated pipeline:

1. **Analyze** — LLM generates 3 experiment ideas from a starred repo
2. **Vote** — Human picks the best idea via Telegram
3. **Build** — Hermes subagent scaffolds the code (← this step)
4. **Deploy** — Tailscale demo + GitHub publish
5. **Memo** — Styled PDF executive summary

## Requirements

- Node.js 18+
- `git` available on PATH

## License

MIT