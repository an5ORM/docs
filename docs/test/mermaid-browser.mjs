import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

// Run after docs:build. CHROME_BIN can select a locally installed Chromium.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'an5-diagram-browser-'));
try {
  const response = await fetch('https://cdn.jsdelivr.net/npm/mermaid@10.9.5/dist/mermaid.min.js');
  assert.ok(response.ok, 'Could not load pinned Mermaid release');
  const library = await response.text();
  const css = fs.readFileSync('docs/assets/css/style.css', 'utf8');
  const renderer = fs.readFileSync('docs/assets/js/mermaid-diagrams.js', 'utf8');
  const page = fs.readFileSync('_site/guides/architecture/index.html', 'utf8');
  const blocks = page.match(/<pre><code class="language-mermaid">[\s\S]*?<\/code><\/pre>/g);
  assert.equal(blocks.length, 3);
  for (const width of [390, 1280]) {
    const checks = `setTimeout(() => {try {
      const check = (value, message) => {if (!value) throw Error(message)};
      const cards = [...document.querySelectorAll('.diagram-viewer')];
      check(cards.length === 3 && cards.every(c => c.querySelector('svg')), 'All diagrams must render');
      check(document.documentElement.scrollWidth <= innerWidth + 1, 'Page must not overflow');
      const card = cards[1], diagram = card.querySelector('.mermaid');
      const controls = [...card.querySelectorAll('button')];
      controls[2].click();
      check(card.classList.contains('diagram-expanded') && diagram.style.width, 'Zoom must change width');
      controls[0].click();
      check(card.classList.contains('diagram-fit') && !diagram.style.width, 'Fit must reset zoom');
      let exported;
      URL.createObjectURL = blob => {exported = blob; return 'blob:test'};
      HTMLAnchorElement.prototype.click = function() {};
      controls[3].click();
      check(exported && exported.type.startsWith('image/svg+xml'), 'Download must produce SVG');
      exported.text().then(text => {
        check(new DOMParser().parseFromString(text, 'image/svg+xml').querySelector('parsererror') === null, 'Export must be valid XML');
        check(text.includes('viewBox'), 'Export must preserve diagram bounds');
        document.body.dataset.result = 'passed';
      }).catch(e => document.body.dataset.result = e.message);
    } catch (e) {document.body.dataset.result = e.message}}, 2500);`;
    const file = path.join(dir, `${width}.html`);
    fs.writeFileSync(file, `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}.docs-body{padding:12px;min-width:0}${css}</style><div class="docs-body">${blocks.join('')}</div><script>${library}</script><script>${renderer}</script><script>${checks}</script>`);
    const result = spawnSync(process.env.CHROME_BIN || '/usr/bin/google-chrome', ['--headless', '--no-sandbox', '--disable-gpu', `--user-data-dir=${dir}/chrome-${width}`, `--window-size=${width},844`, '--virtual-time-budget=5000', '--dump-dom', `file://${file}`], {encoding:'utf8', timeout:30000, maxBuffer:8*1024*1024});
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /data-result="passed"/, result.stdout.match(/data-result="[^"]*"/)?.[0]);
    console.log(`Mermaid ${width}px: render, layout, zoom, fit and SVG export passed`);
  }
} finally {fs.rmSync(dir, {recursive:true, force:true});}
