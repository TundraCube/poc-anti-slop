# Anti-Slop Scanner

Scan GitHub repositories for AI-generated slop patterns: generic UI, copywriting tells, and code comment noise.

## Setup

```bash
npm install && npm start
```

Open [http://localhost:3000](http://localhost:3000), paste a GitHub repo URL, and click **Scan Repository**.

## How it works

- Clones the target repo with `git clone --depth 1` into a temp directory
- Scans files for 23 slop patterns across three categories:
  - **UI**: sparkle icons, beta pills, fake terminals, purple gradients, buzzwords, glassmorphism, bento grids, status dots
  - **Copy**: emoji bullets, ALL CAPS hype, leverage/synergy/robust, fake testimonials, em dashes, filler phrases, weasel attributions
  - **Code**: box-drawing comment banners, emoji in comments, obvious restatements, step narration, empty labels, end markers
- Returns a score (0-100, lower is cleaner) with file-by-file breakdown and category bars
- Repos are deleted immediately after scanning

## Requirements

- Node.js 18+
- `git` available on PATH

## Air-gapped safe

No external API calls. Everything runs locally once `npm install` finishes.