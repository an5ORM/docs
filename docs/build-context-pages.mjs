import fs from 'node:fs';

export const languages = {typescript: 'TypeScript', python: 'Python', dotnet: '.NET (C#)', golang: 'Go', rust: 'Rust', java: 'Java', kotlin: 'Kotlin', swift: 'Swift'};
export const providers = {sqlserver: 'SQL Server', postgresql: 'PostgreSQL', mysql: 'MySQL', sqlite: 'SQLite', googlesheets: 'Google Sheets', nbase: 'NBase'};

// Generate ordinary Jekyll pages so shared links and refreshes work on Pages.
const output = 'docs/context-pages';
fs.mkdirSync(output, {recursive: true});
const allGuides = fs.readdirSync('docs/guides')
  .filter(f => f.endsWith('.md'))
  .map(f => f.replace('.md', ''));

for (const name of fs.readdirSync(output)) {
  fs.unlinkSync(`${output}/${name}`);
}

for (const guide of allGuides) {
  const source = fs.readFileSync(`docs/guides/${guide}.md`, 'utf8');
  for (const code of Object.keys(languages)) {
    for (const provider of Object.keys(providers)) {
      const page = source.replace(/^---\n/, `---\ndocs_variant: true\ndocs_code: ${code}\ndocs_provider: ${provider}\npermalink: /${code}/${provider}/guides/${guide}/\n`);
      fs.writeFileSync(`${output}/${guide}-${code}-${provider}.md`, page);
    }
  }
  fs.writeFileSync(`${output}/${guide}-choose.md`, source.replace(/^---\n/, `---\ndocs_variant: true\nsitemap: false\npermalink: /{code}/{provider}/guides/${guide}/\n`));
}

// Generate root index variants for /{code}/{provider}/
const indexSource = fs.readFileSync('docs/index.md', 'utf8');
for (const code of Object.keys(languages)) {
  for (const provider of Object.keys(providers)) {
    const page = indexSource.replace(/^---\n/, `---\ndocs_variant: true\ndocs_code: ${code}\ndocs_provider: ${provider}\npermalink: /${code}/${provider}/\n`);
    fs.writeFileSync(`${output}/index-${code}-${provider}.md`, page);
  }
}
fs.writeFileSync(`${output}/index-choose.md`, indexSource.replace(/^---\n/, `---\ndocs_variant: true\nsitemap: false\npermalink: /{code}/{provider}/\n`));

// Counted from the maps rather than hardcoded: with three more languages the constant would
// silently under-report, and a count that disagrees with the files on disk is worse than none.
const variants = Object.keys(languages).length * Object.keys(providers).length;
console.log(`Generated ${(allGuides.length + 1) * variants} language/provider pages and ${allGuides.length + 1} chooser routes.`);
