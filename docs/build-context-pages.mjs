import fs from 'node:fs';

export const languages = {typescript: 'TypeScript', python: 'Python', dotnet: '.NET (C#)', golang: 'Go', rust: 'Rust'};
export const providers = {sqlserver: 'SQL Server', postgresql: 'PostgreSQL', mysql: 'MySQL', sqlite: 'SQLite', googlesheets: 'Google Sheets', nbase: 'NBase'};

// Generate ordinary Jekyll pages so shared links and refreshes work on Pages.
const output = 'docs/context-pages';
fs.mkdirSync(output, {recursive: true});
for (const guide of ['vector-search', 'queries']) {
  const source = fs.readFileSync(`docs/guides/${guide}.md`, 'utf8');
  for (const code of Object.keys(languages)) {
    for (const provider of Object.keys(providers)) {
      const page = source.replace(/^---\n/, `---\ndocs_variant: true\ndocs_code: ${code}\ndocs_provider: ${provider}\npermalink: /${code}/${provider}/guides/${guide}/\n`);
      fs.writeFileSync(`${output}/${guide}-${code}-${provider}.md`, page);
    }
  }
  fs.writeFileSync(`${output}/${guide}-choose.md`, source.replace(/^---\n/, `---\ndocs_variant: true\nsitemap: false\npermalink: /{code}/{provider}/guides/${guide}/\n`));
}
// Remove names emitted by the older vector-only generator.
for (const name of fs.readdirSync(output)) {
  if (!name.startsWith('vector-search-') && !name.startsWith('queries-')) fs.unlinkSync(`${output}/${name}`);
}
console.log('Generated 60 language/provider guide pages and two chooser routes.');
