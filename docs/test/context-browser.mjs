import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

// Validate static deep links and the actual chooser script without external CDNs.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'an5-context-'));
try {
  const read = (code, provider) => fs.readFileSync(`_site/${code}/${provider}/guides/vector-search/index.html`, 'utf8');
  const python = read('python', 'postgresql');
  assert.match(python, /language-python/);
  assert.doesNotMatch(python, /language-typescript/);
  assert.match(python, /Enable pgvector/);
  assert.match(read('rust', 'mysql'), /verified vector-search example.*not available/);
  assert.match(read('typescript', 'nbase'), /nbase:\/\/localhost:1307/);
  assert.ok(fs.existsSync('_site/{code}/{provider}/guides/vector-search/index.html'));
  JSON.parse(fs.readFileSync('_site/search.json', 'utf8'));
  const queryPage = fs.readFileSync('_site/python/postgresql/guides/queries/index.html', 'utf8');
  assert.match(queryPage, /language-python/);
  assert.doesNotMatch(queryPage, /language-typescript|language-csharp|language-go|language-rust/);
  const dotnetSqlite = fs.readFileSync('_site/dotnet/sqlite/guides/queries/index.html', 'utf8');
  assert.match(dotnetSqlite, /LIMIT 10 OFFSET 20/);
  assert.doesNotMatch(dotnetSqlite, /FETCH NEXT 10 ROWS ONLY/);
  const goPostgres = fs.readFileSync('_site/golang/postgresql/guides/queries/index.html', 'utf8');
  assert.match(goPostgres.replace(/<[^>]+>/g, ''), /sql.Open\("postgres"/);
  assert.ok(fs.existsSync('_site/{code}/{provider}/guides/queries/index.html'));

  // Every guide renders the reader's language and nobody else's — the eight language
  // branches of a `{% case code %}` are what keep a page from showing a runtime the
  // reader never chose.
  const fences = {
    typescript: 'typescript',
    python: 'python',
    dotnet: 'csharp',
    golang: 'go',
    rust: 'rust',
    java: 'java',
    kotlin: 'kotlin',
    swift: 'swift',
  };
  for (const guide of ['crud', 'getting-started', 'configuration', 'queries', 'relations', 'transactions']) {
    for (const [code, fence] of Object.entries(fences)) {
      const page = fs.readFileSync(`_site/${code}/sqlite/guides/${guide}/index.html`, 'utf8');
      const foreign = Object.entries(fences)
        .filter(([other]) => other !== code)
        .map(([, otherFence]) => otherFence);
      assert.match(
        page,
        new RegExp(`language-${fence}\\b`),
        `${guide}/${code} has no ${fence} example`,
      );
      assert.doesNotMatch(
        page,
        new RegExp(`language-(?:${foreign.join('|')})\\b`),
        `${guide}/${code} carries another language's example`,
      );
    }
  }
  const chooser = fs.readFileSync('docs/assets/js/docs-context.js', 'utf8').replaceAll('window.location.assign(', 'window.captureRoute(');
  const css = fs.readFileSync('docs/assets/css/style.css', 'utf8');
  for (const guide of ['vector-search', 'queries']) {
    for (const width of [390, 1280]) {
      const guideDir = path.join(dir, 'python', 'postgresql', 'guides', guide);
      fs.mkdirSync(guideDir, {recursive: true});
      const file = path.join(guideDir, `${width}.html`);
      const pageHtml = (guide === 'queries' ? queryPage : python);
      const checks = `
        try {
          const check = (ok, message) => {if (!ok) throw Error(message)};
          check(document.getElementById('headerDocsCode').value === 'python', 'Language must come from the route');
          check(document.getElementById('headerDocsProvider').value === 'postgresql', 'Provider must come from the route');
          document.getElementById('headerDocsCode').value = 'rust';
          document.getElementById('headerDocsProvider').value = 'sqlite';
          document.getElementById('headerDocsProvider').dispatchEvent(new Event('change', {bubbles:true}));
          check(window.targetRoute === '/docs/rust/sqlite/guides/${guide}/', 'Chooser must navigate to the selected route');
          const bar = document.querySelector('.docs-header-bar');
          check(bar.scrollWidth <= innerWidth + 1, 'Controls must fit on mobile');
          document.body.dataset.result = 'passed';
        } catch (e) {document.body.dataset.result = e.message;}`;
      const testDoc = pageHtml
        .replace('</head>', `<style>${css}</style></head>`)
        .replace(/<script[^>]*docs-context\.js[^>]*><\/script>/, `<script>window.captureRoute = route => window.targetRoute = route;${chooser}${checks}</script>`);
      fs.writeFileSync(file, testDoc);
      const result = spawnSync(process.env.CHROME_BIN || '/usr/bin/google-chrome', ['--headless', '--no-sandbox', '--disable-gpu', `--user-data-dir=${dir}/chrome-${guide}-${width}`, `--window-size=${width},844`, '--dump-dom', `file://${file}`], {encoding:'utf8', timeout:30000, maxBuffer:4*1024*1024});
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /data-result="passed"/, result.stdout.match(/data-result="[^"]*"/)?.[0]);
      console.log(`${guide} chooser ${width}px: selection, routes and layout passed`);
    }
  }
} finally {
  fs.rmSync(dir, {recursive:true, force:true});
}
