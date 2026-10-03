#!/usr/bin/env node
/**
 * The inline diagrams in the docs must be well-formed.
 *
 * The architecture diagram is hand-written SVG inside Markdown, which a browser
 * recovers from happily: an attribute quoted with `'JetBrains Mono'` swallows the
 * rest of the line, and a bare `&` is read as text. The page still renders, so
 * nothing reports it — the markup is just quietly wrong, and any tool that reads it
 * as XML (an editor, a linter, an SVG pipeline) rejects the file outright.
 *
 * So it is checked as XML here, where a mistake is a failure with a line number.
 *
 * Run with `npm run test:docs:svg`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');

/** The Markdown sources, and the built pages that have to agree with them. */
const TARGETS = [
  'docs/ARCHITECTURE.md',
  'docs/guides/architecture.md',
  '_site/architecture/index.html',
  '_site/guides/architecture/index.html',
];

function svgsIn(source) {
  return source.match(/<svg\b[\s\S]*?<\/svg>/g) ?? [];
}

let checked = 0;
let mermaid = 0;
const problems = [];

for (const relative of TARGETS) {
  const file = path.join(ROOT, relative);
  if (!fs.existsSync(file)) {
    // The built pages only exist once Jekyll has run; that is not a failure here.
    console.log(`  – ${relative} (not built yet)`);
    continue;
  }

  const source = fs.readFileSync(file, 'utf8');
  const diagrams = svgsIn(source);
  if (diagrams.length === 0) {
    // Mermaid blocks appear differently in each kind of file: a ```mermaid fence in
    // the Markdown source, and the class Rouge puts on the rendered element
    // (`language-mermaid`) in a built page — which carries no backtick fence.
    const hasMermaid = source.includes('```mermaid') || source.includes('language-mermaid');
    if (hasMermaid) {
      mermaid += 1;
      console.log(`  ✓ ${relative} (Mermaid diagram)`);
      continue;
    }
    problems.push(`${relative}: expected an inline diagram or Mermaid block, found none`);
    continue;
  }

  for (const [index, svg] of diagrams.entries()) {
    checked += 1;
    // A single-quoted attribute value terminates at the first inner quote, and a
    // bare `&` is an unterminated entity. Both are reported here with a position
    // rather than left to a browser to guess at.
    const singleQuoted = svg.match(/font-family="'[^"]*"/g);
    if (singleQuoted) {
      problems.push(`${relative} diagram ${index + 1}: font-family quoted with ' inside its own value`);
    }
    const bareAmpersand = svg.match(/&(?!#?\w+;)/);
    if (bareAmpersand) {
      problems.push(`${relative} diagram ${index + 1}: bare "&" in text, which is not valid XML`);
    }
    // Not a full XML parser: `fast-xml-parser`'s validator in the tree accepts both
    // of the above, and `sax` is only a transitive dependency. These two checks are
    // exact for the mistakes hand-written SVG actually makes, and adding a parser
    // for the rest would mean a dependency the docs checks do not otherwise need.
  }
  console.log(`  ✓ ${relative} (${diagrams.length} diagram(s))`);
}

if (problems.length > 0) {
  console.error(`\n✗ ${problems.length} problem(s):`);
  for (const problem of problems) console.error(`   ${problem}`);
  process.exit(1);
}

// Both counts are reported: with the diagrams migrated to Mermaid this reports 0
// inline SVG, and printing only that reads as though the check found nothing.
console.log(
  `\ndiagrams verified: ${checked} inline SVG, ${mermaid} migrated to Mermaid Markdown`,
);