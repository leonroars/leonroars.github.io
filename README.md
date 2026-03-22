# Portfolio — 채호연 / HoYeon "Julian" Chae

## Quick Start

```bash
# 1. Clone your GitHub Pages repo
git clone https://github.com/leonroars/leonroars.github.io.git
cd leonroars.github.io

# 2. Copy all these files into the repo root
#    index.html, style.css, script.js, projects/, assets/

# 3. Add your images to assets/
#    Search for "<!-- IMAGE:" in the HTML files to find all placeholders

# 4. Local preview
npx serve .
# Open http://localhost:3000

# 5. Deploy
git add .
git commit -m "initial portfolio"
git push origin main
# Live at https://leonroars.github.io in ~2 minutes
```

## File Structure

```
leonroars.github.io/
├── index.html              ← Main page (intro + projects + experience)
├── style.css               ← Shared design system (theme colors, typography)
├── script.js               ← Theme toggle + language toggle
├── projects/
│   └── slam.html           ← SLAM project detail (copy as template)
├── assets/
│   ├── architecture-diagram.png   ← Your architecture diagram
│   ├── bottleneck-chart.png       ← Fig 1.1 bottleneck chart
│   └── idempotency-flow.png       ← Fig 2. idempotency flow diagram
└── README.md
```

## Adding a New Project

1. Copy `projects/slam.html` → `projects/new-project.html`
2. Replace content (keep the `lang-ko` / `lang-en` pattern)
3. Add a card in `index.html` under the `project-grid` div
4. No changes needed to `style.css` or `script.js`

## Image Placeholders

Search for `<!-- IMAGE:` in the HTML files to find all spots where images should go.
Replace the placeholder `<div>` with an `<img>` tag:

```html
<!-- Before -->
<div class="arch-image-placeholder">
  <p class="placeholder-text">...</p>
</div>

<!-- After -->
<div class="arch-image-placeholder">
  <img src="../assets/architecture-diagram.png" alt="SLAM Architecture Diagram">
</div>
```

## Bilingual Content Pattern

Every text element has paired elements:
```html
<span class="lang-ko">한국어 텍스트</span>
<span class="lang-en">English text</span>
```

The JS toggle switches `data-lang` on `<html>`, and CSS hides the inactive language.

## Theme System

- Light: organic sage green accent (#4E7A3E)
- Dark: cyan/teal accent (#4ECDC4)
- All colors use CSS variables — edit `:root` in `style.css` to customize
