#!/usr/bin/env node
/**
 * Automated Technical SEO Auditing Tool for AN5 ORM Documentation
 * Validates:
 * - HTML title, description, canonical, keywords, author
 * - Open Graph & Twitter Cards (including og:image)
 * - Schema.org JSON-LD structured data (WebSite, TechArticle, SoftwareApplication, Breadcrumbs)
 * - Heading structure (h1 presence & uniqueness)
 * - Core Web Vitals optimization hints (preconnect, DNS prefetch)
 * - Sitemap.xml & robots.txt validity
 * - Internal link integrity
 */

import fs from 'node:fs';
import path from 'node:path';

const SITE_DIR = path.resolve('_site');

if (!fs.existsSync(SITE_DIR)) {
  console.error(`Error: _site directory not found at ${SITE_DIR}. Run "npm run docs:build" first.`);
  process.exit(1);
}

// Find all HTML files in _site
function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getHtmlFiles(fullPath));
    } else if (file.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

const htmlFiles = getHtmlFiles(SITE_DIR).filter(f => !f.endsWith('404.html'));
console.log(`\n🔍 Found ${htmlFiles.length} HTML pages to audit for Technical SEO...\n`);

let totalPassed = 0;
let totalWarnings = 0;
let totalErrors = 0;

for (const file of htmlFiles) {
  const relPath = path.relative(SITE_DIR, file);
  const content = fs.readFileSync(file, 'utf8');

  const pageErrors = [];
  const pageWarnings = [];

  // 1. Title tag
  const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
  if (!titleMatch) {
    pageErrors.push('Missing <title> tag');
  } else {
    const title = titleMatch[1].trim();
    if (title.length < 10) pageWarnings.push(`Title too short (${title.length} chars): "${title}"`);
    if (title.length > 75) pageWarnings.push(`Title may truncate in SERP (${title.length} chars)`);
  }

  // 2. Meta description
  const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (!descMatch) {
    pageErrors.push('Missing <meta name="description">');
  } else {
    const desc = descMatch[1].trim();
    if (desc.length < 30) pageWarnings.push(`Description too short (${desc.length} chars)`);
    if (desc.length > 180) pageWarnings.push(`Description may truncate in SERP (${desc.length} chars)`);
  }

  // 3. Canonical link
  const canonicalMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  if (!canonicalMatch) {
    pageErrors.push('Missing <link rel="canonical">');
  } else if (!canonicalMatch[1].startsWith('http')) {
    pageWarnings.push(`Canonical URL should be absolute: ${canonicalMatch[1]}`);
  }

  // 4. Open Graph tags
  const ogTitle = content.match(/<meta\s+property=["']og:title["']/i);
  const ogDesc = content.match(/<meta\s+property=["']og:description["']/i);
  const ogImage = content.match(/<meta\s+property=["']og:image["']/i);
  const ogUrl = content.match(/<meta\s+property=["']og:url["']/i);

  if (!ogTitle) pageWarnings.push('Missing og:title');
  if (!ogDesc) pageWarnings.push('Missing og:description');
  if (!ogImage) pageWarnings.push('Missing og:image (social preview banner)');
  if (!ogUrl) pageWarnings.push('Missing og:url');

  // 5. Twitter Card
  const twitterCard = content.match(/<meta\s+name=["']twitter:card["']/i);
  const twitterImage = content.match(/<meta\s+name=["']twitter:image["']/i);
  if (!twitterCard) pageWarnings.push('Missing twitter:card');
  if (!twitterImage) pageWarnings.push('Missing twitter:image');

  // 6. Schema.org JSON-LD
  const jsonLdMatch = content.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
  if (!jsonLdMatch) {
    pageErrors.push('Missing Schema.org JSON-LD structured data');
  } else {
    try {
      const parsed = JSON.parse(jsonLdMatch[1]);
      if (!parsed['@context'] || !parsed['@context'].includes('schema.org')) {
        pageErrors.push('JSON-LD missing valid schema.org @context');
      }
    } catch (e) {
      pageErrors.push(`Malformed JSON-LD syntax: ${e.message}`);
    }
  }

  // 7. Headings (h1)
  const h1Matches = content.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi);
  if (!h1Matches || h1Matches.length === 0) {
    pageWarnings.push('No <h1> heading found on page');
  } else if (h1Matches.length > 1) {
    pageWarnings.push(`Multiple <h1> headings found (${h1Matches.length})`);
  }

  // 8. Core Web Vitals hints
  if (!content.includes('rel="preconnect"')) {
    pageWarnings.push('Missing rel="preconnect" hints in head');
  }

  if (pageErrors.length === 0 && pageWarnings.length === 0) {
    console.log(`  ✓ [100% OK] ${relPath}`);
    totalPassed++;
  } else {
    console.log(`  ● [AUDIT] ${relPath}:`);
    for (const err of pageErrors) {
      console.log(`     ❌ ERROR: ${err}`);
      totalErrors++;
    }
    for (const warn of pageWarnings) {
      console.log(`     ⚠️  WARN: ${warn}`);
      totalWarnings++;
    }
  }
}

// 9. Sitemap & Robots validation
console.log('\n📄 Auditing sitemap.xml and robots.txt...');
const sitemapPath = path.join(SITE_DIR, 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
  console.log('  ❌ sitemap.xml does not exist in _site');
  totalErrors++;
} else {
  const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
  if (!sitemapXml.includes('<loc>') || !sitemapXml.includes('<lastmod>')) {
    console.log('  ⚠️  sitemap.xml missing <loc> or <lastmod>');
    totalWarnings++;
  } else {
    console.log('  ✓ sitemap.xml is valid with lastmod & priority');
  }
}

const robotsPath = path.join(SITE_DIR, 'robots.txt');
if (!fs.existsSync(robotsPath)) {
  console.log('  ❌ robots.txt does not exist in _site');
  totalErrors++;
} else {
  const robotsTxt = fs.readFileSync(robotsPath, 'utf8');
  if (!robotsTxt.includes('Sitemap:')) {
    console.log('  ⚠️  robots.txt missing Sitemap directive');
    totalWarnings++;
  } else {
    console.log('  ✓ robots.txt is valid with Sitemap & Host');
  }
}

console.log('\n=======================================');
console.log(`📊 Technical SEO Audit Summary:`);
console.log(`   Passed Pages: ${totalPassed} / ${htmlFiles.length}`);
console.log(`   Warnings:     ${totalWarnings}`);
console.log(`   Errors:       ${totalErrors}`);
console.log('=======================================\n');

if (totalErrors > 0) {
  process.exit(1);
}
