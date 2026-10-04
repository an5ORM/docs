import fs from 'node:fs';
import path from 'node:path';

const guidesDir = 'docs/guides';
const files = fs.readdirSync(guidesDir).filter(f => f.endsWith('.md'));

console.log('Total guides to audit:', files.length);

const results = [];
let totalErrors = 0;
let totalWarnings = 0;

for (const file of files) {
  const filePath = path.join(guidesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  // 1. Front Matter Check
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) {
    issues.push({ type: 'ERROR', msg: 'Missing YAML Front Matter' });
  } else {
    const fm = fmMatch[1];
    const hasLayout = /layout:\s*\S+/.test(fm);
    const hasTitle = /title:\s*\S+/.test(fm);
    const hasDesc = /description:\s*\S+/.test(fm);
    if (!hasLayout) issues.push({ type: 'ERROR', msg: 'Missing layout in front matter' });
    if (!hasTitle) issues.push({ type: 'ERROR', msg: 'Missing title in front matter' });
    if (!hasDesc) issues.push({ type: 'ERROR', msg: 'Missing description in front matter' });
  }

  // 2. Heading Check (strip fenced code blocks first so bash comments aren't treated as H1)
  const body = fmMatch ? content.slice(fmMatch[0].length) : content;
  const bodyWithoutCode = body.replace(/```[\s\S]*?```/g, '');
  const headings = [...bodyWithoutCode.matchAll(/^(#{1,6})\s+(.*)$/gm)];
  const h1s = headings.filter(h => h[1] === '#');
  if (h1s.length === 0) {
    issues.push({ type: 'ERROR', msg: 'No H1 heading (# Title) found' });
  } else if (h1s.length > 1) {
    issues.push({ type: 'WARNING', msg: `Multiple H1 headings found (${h1s.length}): ${h1s.map(h => h[2]).join(' | ')}` });
  }

  // Heading hierarchy check
  let prevLevel = 1;
  for (const h of headings) {
    const level = h[1].length;
    if (level > prevLevel + 1 && prevLevel !== 0) {
      issues.push({ type: 'WARNING', msg: `Heading skipped level: H${prevLevel} -> H${level} ("${h[2]}")` });
    }
    prevLevel = level;
  }

  // 3. Fenced Code Blocks Check
  const fenceMatches = [...body.matchAll(/^```([a-zA-Z0-9_-]*)/gm)];
  if (fenceMatches.length % 2 !== 0) {
    issues.push({ type: 'ERROR', msg: `Unbalanced code fences (odd count: ${fenceMatches.length})` });
  } else {
    // Check languages on opening fences
    for (let i = 0; i < fenceMatches.length; i += 2) {
      const lang = fenceMatches[i][1];
      if (!lang) {
        issues.push({ type: 'WARNING', msg: `Code block missing language declaration (block #${i / 2 + 1})` });
      }
    }
  }

  // 4. Liquid Syntax Check
  const ifCount = (body.match(/\{%\s*if\b/g) || []).length;
  const endifCount = (body.match(/\{%\s*endif\b/g) || []).length;
  if (ifCount !== endifCount) {
    issues.push({ type: 'ERROR', msg: `Mismatched Liquid if/endif: ${ifCount} vs ${endifCount}` });
  }

  const caseCount = (body.match(/\{%\s*case\b/g) || []).length;
  const endcaseCount = (body.match(/\{%\s*endcase\b/g) || []).length;
  if (caseCount !== endcaseCount) {
    issues.push({ type: 'ERROR', msg: `Mismatched Liquid case/endcase: ${caseCount} vs ${endcaseCount}` });
  }

  const unlessCount = (body.match(/\{%\s*unless\b/g) || []).length;
  const endunlessCount = (body.match(/\{%\s*endunless\b/g) || []).length;
  if (unlessCount !== endunlessCount) {
    issues.push({ type: 'ERROR', msg: `Mismatched Liquid unless/endunless: ${unlessCount} vs ${endunlessCount}` });
  }

  // 5. Internal link check
  const links = [...body.matchAll(/\[[^\]]+\]\((?!https?:|mailto:|#)([^)]+)\)/g)];
  for (const l of links) {
    const target = l[1];
    if (!target.includes('{{') && !target.startsWith('/') && !target.startsWith('#')) {
      issues.push({ type: 'WARNING', msg: `Relative link without leading slash or relative_url: ${target}` });
    }
  }

  const errs = issues.filter(i => i.type === 'ERROR').length;
  const warns = issues.filter(i => i.type === 'WARNING').length;
  totalErrors += errs;
  totalWarnings += warns;

  results.push({ file, issues, errs, warns });
}

console.log('='.repeat(65));
console.log(`SUMMARY: ${files.length} guides audited | ${totalErrors} Errors | ${totalWarnings} Warnings`);
console.log('='.repeat(65));

for (const r of results) {
  if (r.issues.length === 0) {
    console.log(`✓ ${r.file} [PERFECT]`);
  } else {
    console.log(`! ${r.file} (${r.errs} err, ${r.warns} warn):`);
    for (const iss of r.issues) {
      console.log(`    - [${iss.type}] ${iss.msg}`);
    }
  }
}
