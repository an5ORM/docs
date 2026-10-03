# AN5 ORM documentation

Source and GitHub Pages hosting for https://an5orm.github.io/docs/.

Edit the Jekyll source in `docs/`. Changes pushed to `main` build, validate and deploy automatically. This repository builds independently of `an5ORM/an5`.

## Local preview

Install Node.js and Jekyll, then run `npm run docs`. Build with `npm run docs:build`.

Validation: `npm run test:docs`, `npm run test:docs:browser`, `npm run test:seo`, and `python3 docs/test/check-links.py _site`.
