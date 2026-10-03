# Workspace security backport

The workspace currently installs braces 3.0.3 through transitive dependencies.
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) describes
stack exhaustion from deeply nested brace patterns and lists no patched upstream
version as of 2026-10-03. The root backport keeps the original package/version
visible to npm audit.

`npm install` or `npm ci` runs `scripts/apply-security-backports.mjs` in postinstall.
It patches every installed braces copy listed in the root lockfile:

- Parser stack depth is limited to 64 before nested AST processing.
- Compile, expand and stringify validate ASTs iteratively before their recursive
  walks, rejecting excessive depth, cycles/shared nodes, or over 65,536 nodes.
- The patch is idempotent and restricted to the reviewed 3.0.3 source shape.
  Unexpected versions or source changes fail so the backport can be reviewed.

`npm run test:security` executes ordinary expansion and malicious deeply nested
string/AST cases in child processes with timeouts. Its audit gate permits only
this exact advisory and its inherited dependency entries, verifies the mitigation
on the installed copies, and fails on new advisories or audit-service errors.

An install with `--ignore-scripts` does not apply this protection. After such an
install, run:

```sh
node scripts/apply-security-backports.mjs
npm run test:security
```

The mitigation covers this installed workspace, not arbitrary consumers of a
published AN5 package. It specifically addresses the reported recursion flaw;
it is not a general guarantee for every possible glob input or dependency defect.
When upstream publishes a fix, replace the backport with the patched dependency,
retain regression tests, and remove the advisory allowance once npm audit agrees.
