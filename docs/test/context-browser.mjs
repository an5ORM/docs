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
  const chooser = fs.readFileSync('docs/assets/js/docs-context.js', 'utf8').replace('window.location.assign(', 'window.captureRoute(');
  const css = fs.readFileSync('docs/assets/css/style.css', 'utf8');
  for (const guide of ['vector-search', 'queries']) {
  for (const width of [390, 1280]) {
    const file = path.join(dir, `${guide}-${width}.html`);
    const section = (guide === 'queries' ? queryPage : python).match(/<section class="docs-context"[\s\S]*?<\/section>/)[0];
    const checks = `
      try {
        const check = (ok, message) => {if (!ok) throw Error(message)};
        check(document.getElementById('docsCode').value === 'python', 'Language must come from the route');
        check(document.getElementById('docsProvider').value === 'postgresql', 'Provider must come from the route');
        document.getElementById('docsCode').value = 'rust';
        document.getElementById('docsProvider').value = 'sqlite';
        document.getElementById('docsContextForm').dispatchEvent(new Event('submit', {cancelable:true}));
        check(window.targetRoute === '/docs/rust/sqlite/guides/${guide}/', 'Chooser must navigate to the selected route');
        check(document.documentElement.scrollWidth <= innerWidth + 1, 'Controls must fit on mobile');
        document.body.dataset.result = 'passed';
      } catch (e) {document.body.dataset.result = e.message;}`;
    fs.writeFileSync(file, `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div class="docs-body">${section}</div><script>window.captureRoute = route => window.targetRoute = route;${chooser}${checks}</script>`);
    const result = spawnSync(process.env.CHROME_BIN || '/usr/bin/google-chrome', ['--headless', '--no-sandbox', '--disable-gpu', `--user-data-dir=${dir}/chrome-${guide}-${width}`, `--window-size=${width},844`, '--dump-dom', `file://${file}`], {encoding:'utf8', timeout:30000, maxBuffer:4*1024*1024});
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /data-result="passed"/, result.stdout.match(/data-result="[^"]*"/)?.[0]);
    console.log(`${guide} chooser ${width}px: selection, routes and layout passed`);
  }
  }
} finally {
  fs.rmSync(dir, {recursive:true, force:true});
}
