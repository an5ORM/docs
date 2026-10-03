# Workspace review and remediation: ORM, queries and adapters

Completed: 2026-10-03 (Asia/Ho_Chi_Minh).

All four follow-up items from the initial review were addressed in the workspace:
cross-language query semantics, runtime test coverage, live database verification,
and the missing .NET SDK. Dependency remediation reduced the npm audit from 74
entries (19 high, 55 moderate) to six high entries arising from one upstream braces
advisory. A tested workspace backport protects those installed copies; the registry
still reports their original version. This is not a claim of zero audit alerts.

## Query and adapter changes

- Shared SQL filtering now gives empty OR arrays a false predicate, preserves true
  empty OR branches, and treats NOT arrays as exclusion of each branch. NOT of an
  empty object is false; an empty NOT array adds no restriction.
- A shared fixture with 12 cases runs on TypeScript, Python, Go, Rust and .NET SQL
  builders, plus the Google Sheets matcher. It covers nested logical filters,
  compound keys, empty branches and nested scalar NOT.
- TypeScript SQL and Sheets omit optional undefined filters. Sheets supports
  object-form AND, nested scalar NOT, falsy operands on underscored fields, and
  empty string pattern filters.
- Relation parameters are isolated by relation name and quantifier, including two
  relations targeting the same model. Underscored relation names are preserved.
  To-one is null checks absence; isNot null checks presence.
- Real relation tests cover combined some/none, every, two relations to the same
  model, nullable to-one relationships, and rollback on SQLite, PostgreSQL,
  SQL Server and MySQL.
- Python and Rust adapters and generated Go clients normalize the SQL Server dbo
  prefix when running on SQLite. Rust table parsing preserves dots inside quoted
  identifiers and escaped identifier delimiters. Other SQLite schemas remain intact.
- TypeScript detects :memory: and sqlite: connection strings correctly. Go clients
  also recognize the explicit sqlite provider used by the runnable example.
- Go fixes were applied to the generator and regenerated client artifacts.

These are observable corrections. Queries relying on the former NOT-array
behavior or OR: [] returning every row will now return different results.

## Runtime coverage and build fixes

Python gates now run SQLite behavior after compilation. Go's client gate exercises
CRUD, empty logical filters and transaction rollback on SQLite in a separate test
module, keeping the shipped runtime driver-neutral. Go adapter query tests execute
SQL via Python's standard-library SQLite, without adding a production Go driver.

The Rust adapter gate runs cargo test, including SQLite integration and the shared
query contract. The generated Rust client has its own SQLite runtime test module.
A test-only mutex removes races between Rust unit tests that modify global metadata.

The .NET adapter executes the shared query contract on SQLite. The example build
now declares SQLite and PostgreSQL provider references required by its generated
source. The example uses DLL execution rather than a native app host, so it also
runs from the mounted workspace. The Agent explicitly includes Node typings.

Genkit task execution and offline embedding have dedicated runtime tests. These
caught an incompatible partial OpenTelemetry upgrade; the SDK packages were then
upgraded together and both execution paths passed.

## Dependency remediation

Compatible dependency updates were applied, Google APIs moved to 183.x, and Genkit
and the local vector store moved to 1.42.x. Explicit workspace overrides select
patched UUID and a coherent OpenTelemetry SDK family. The root package lock is now
tracked, and CI uses npm ci to reproduce that dependency graph. MySQL's optional
adapter peer is declared, its test driver is installed in the workspace, and CI
now provisions MySQL 8.4 alongside PostgreSQL and SQL Server.

The remaining six audit entries are inherited from
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), which has
no upstream patched braces release at review time. The workspace postinstall
backport bounds parser nesting and validates AST depth/size before recursive
compile, expand and stringify operations. Unsupported upstream source/version
changes fail explicitly instead of silently applying an uncertain patch.

The security gate verifies normal expansion and deeply nested string/AST inputs
in child processes. It rejects every other advisory and verifies that each flagged
installed braces copy has the backport. It does not hide npm's remaining alerts.

See [security backport details](security-backports.md), the
[initial audit](dependency-audit-2026-10-03.json), and the
[remediated audit](dependency-audit-remediated-2026-10-03.json).

The overrides and backport apply to this root workspace. Published packages
installed in another application's dependency graph do not inherit root overrides
or this root postinstall hook. This review does not certify that separate graph;
no package release was performed.

## Verified results

| Gate | Result |
| --- | --- |
| Full root test:full: all builds, workspace tests, generator, independent package installs and language gates | Passed, exit 0 |
| Shared query fixtures: TypeScript, Sheets, Python, Go, Rust and .NET | Passed |
| Generated Python, Go, Rust and .NET client SQLite runtime | Passed |
| Rust adapter unit, SQLite and documentation tests | Passed |
| Genkit task execution and offline embedding | Passed |
| Adapter live CRUD/filter/update/aggregate/groupBy/transaction/vector fallback on PostgreSQL 16, SQL Server 2022, MySQL 8.4 | Passed |
| Relation contract on SQLite, PostgreSQL, SQL Server and MySQL | Passed |
| ORM live relations, transactions and migration apply/rollback on SQL Server | Passed |
| Live generated migrations with mapped unique/index names, covering include and filtered index metadata | Passed |
| .NET runnable example CRUD against isolated SQL Server | Passed |
| Security backport regression tests and advisory gate | Passed |
| Documentation grammar/SVG checks and English-only guard | Passed |

The default offline example matrix still intentionally skips external Python/.NET
connections when URLs are absent. This is separate from the verified generated
client SQLite runtime gates and the explicitly executed .NET live example.

Validation used Node.js 22.23.3, .NET SDK 8.0.425 installed in a temporary directory,
and isolated Docker databases bound to localhost. Mounted dependency executables
were launched through temporary wrappers; TypeScript/esbuild and Rust outputs were
placed outside the mount. Thus the reported test:full pass used those local launch
environment adjustments. CI uses the normal npm commands on its Linux filesystem.

Existing user edits were preserved. The user's .env/database was not used for live
verification. Temporary database containers were removed after verification. No
commit, push, release, or user-database migration was performed.
