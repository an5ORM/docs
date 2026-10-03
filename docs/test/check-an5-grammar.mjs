#!/usr/bin/env node
/**
 * Checks the .an5 Prism grammar against the schemas in the repository.
 *
 * The grammar is hand-written, so the failure mode is silent: a pattern that
 * stops matching leaves plain text in the code blocks and nothing reports it.
 * Two properties are asserted for every schema file:
 *
 *   1. highlighting loses no text (the rendered HTML strips back to the source)
 *   2. every field line produces a `field` token, so names and types are
 *      actually separated instead of the whole line staying unstyled
 *
 * Run with `npm run test:docs`.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const PRISM_URL = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
const GRAMMAR = path.join(HERE, '..', 'assets', 'js', 'prism-an5.js');

// The same pinned build the site loads, so the grammar is checked against the
// Prism it actually runs on rather than a lookalike.
async function loadPrism() {
  const response = await fetch(PRISM_URL);
  if (!response.ok) throw new Error(`Prism CDN returned HTTP ${response.status}`);
  return response.text();
}

// Prism is browser-first: give it a global object and no document, which is
// what the grammar's own guard is written against. The grammar has to be
// evaluated in the same context as Prism, or it registers itself elsewhere.
function createSandbox() {
  const sandbox = { console, setTimeout, clearTimeout };
  sandbox.global = sandbox;
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  return sandbox;
}

function findSchemas(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findSchemas(full, found);
    else if (entry.name.endsWith('.an5')) found.push(full);
  }
  return found;
}

// Strip the highlighting back to plain text to compare against the source.
function toText(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function extractFences(markdown) {
  const blocks = [];
  const re = /^```an5\s*\n([\s\S]*?)^```/gm;
  let match;
  while ((match = re.exec(markdown)) !== null) blocks.push(match[1]);
  return blocks;
}

async function main() {
  let prismSource;
  try {
    prismSource = await loadPrism();
  } catch (error) {
    // A network hiccup should not masquerade as a grammar failure.
    console.error(`skip: could not fetch Prism (${error.message})`);
    process.exit(0);
  }

  const sandbox = createSandbox();
  vm.runInContext(prismSource, sandbox, { filename: 'prism.min.js' });
  vm.runInContext(fs.readFileSync(GRAMMAR, 'utf8'), sandbox, { filename: 'prism-an5.js' });
  const Prism = sandbox.Prism;

  if (!Prism || !Prism.languages.an5) {
    console.error('FAIL: the grammar did not register Prism.languages.an5');
    process.exit(1);
  }

  const failures = [];
  let checked = 0;

  const examine = (label, code) => {
    checked += 1;
    const html = Prism.highlight(code, Prism.languages.an5, 'an5');

    if (toText(html) !== code.replace(/\n+$/, '\n')) {
      failures.push(`${label}: highlighting changed the text`);
      return;
    }

    for (const line of code.split('\n')) {
      // A field is an indented `name Type` ending at an attribute or EOL.
      if (!/^\s+[A-Za-z_]\w*\s+[A-Za-z_]/.test(line)) continue;
      const name = line.trim().split(/\s+/)[0];
      // Match the emitted span, not the text: a field named `model` also
      // appears on the `model User {` line, which is not the one to check.
      const span = new RegExp(
        `<span class="token field-name property">${name}</span>`,
      );
      if (!span.test(html)) {
        failures.push(`${label}: no field token for "${line.trim().slice(0, 48)}"`);
      }
    }
  };

  for (const file of findSchemas(ROOT)) {
    examine(path.relative(ROOT, file), fs.readFileSync(file, 'utf8'));
  }

  for (const file of findSchemas(path.join(ROOT, 'docs')).concat(
    fs.readdirSync(path.join(ROOT, 'docs', 'guides'))
      .filter((n) => n.endsWith('.md'))
      .map((n) => path.join(ROOT, 'docs', 'guides', n))
  )) {
    if (file.endsWith('.an5')) continue;
    extractFences(fs.readFileSync(file, 'utf8')).forEach((code, i) => {
      examine(`${path.relative(ROOT, file)}#an5[${i}]`, code);
    });
  }

  console.log(`an5 grammar: ${checked} schema(s) and fenced block(s) checked`);
  if (failures.length) {
    failures.forEach((f) => console.error(`  FAIL ${f}`));
    process.exit(1);
  }
  console.log('  all round-trip clean, every field tokenised');
}

main();
