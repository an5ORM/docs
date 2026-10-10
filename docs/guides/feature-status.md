---
layout: page
title: Feature Status
description: Current implementation status and maturity of the an5 ORM ecosystem
---

# Feature Status

This page summarizes what is currently implemented, published, and still maturing in the an5 ORM ecosystem.

## Published Packages

| Package | Registry | Latest | Status | Notes |
|---|---|---|---|---|
| `@an5/orm` | npm | `1.3.0` | Published | Core ORM runtime, schema parser, multi-language generator, migrations |
| `@an5/adapters` | npm | `0.2.13` | Published | Runtime database adapters for TypeScript plus packaged Python/.NET/Go/Rust/Java/Kotlin/Swift sources |
| `@an5/agent` | npm | `0.3.0` | Published | AI database agent with 8 consolidated schema, query, database, retrieval and code-generation tools |
| `an5-orm-vscode` | VS Code Marketplace | `1.3.1` | Published | Syntax, formatter, snippets, and native Model Context Protocol (MCP) server |
| `an5-cli` | npm | `0.2.0` | Published | Workspace automation, changelog generation, and local management UI |
| `an5-tasks` | npm | `1.0.0` | Published | Genkit v1.42+ task workflows for schema issues and review generation |
| `an5-client` | npm | `0.1.5` | Published | Generated multi-language clients and the harness that compiles and runs them |
| `an5-adapters` | PyPI | `0.2.13` | Published | Python runtime wheel/sdist; `pip install an5-adapters` |
| `an5-orm` | PyPI | `1.3.0` | Published | Python core ORM wheel/sdist; `pip install an5-orm` |
| `an5-client` | PyPI | `0.1.5` | Published | Python generated-client runtime wheel/sdist |
| `an5-adapters` | crates.io | `0.1.0` | Published | Rust adapter runtime; `cargo add an5-adapters`, docs on [docs.rs](https://docs.rs/an5-adapters) |
| `an5-adapters-java` | Maven Central | `0.2.13` | Published | JDBC runtime under `io.github.an5orm`, with sources, javadoc and GPG signatures |
| `an5-adapters-kotlin` | Maven Central | `0.2.13` | Published | Kotlin runtime over the Java adapter, published beside the Java artifact as `io.github.an5orm:an5-adapters-kotlin` |

PyPI does not use npm-style scopes like `@an5/orm`. The Python package names are `an5-adapters`, `an5-orm` and `an5-client`. crates.io shares the `an5-adapters` name with PyPI, which is intended: they are the adapter runtime for different language toolchains. Maven needs no account to build: `mvn -f an5Adapters/java/pom.xml install` puts the Java runtime in `~/.m2`, where `build.gradle.kts` resolves it through `mavenLocal()`; only the upload needs the Central Portal token and GPG secrets. The generated clients for Java, Kotlin and Swift are not published as standalone packages — they are generated into your project (see [Generated Clients](#generated-clients)).

## Core ORM

| Area                | Status                             | Details                                                                                                                                                                                                                                                                                                                     |
| ------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Proxy model client  | Implemented                        | `db.user.findMany()`, `db.user.create()`, dynamic model access                                                                                                                                                                                                                                                              |
| CRUD operations     | Implemented                        | `findMany`, `findFirst`, `findUnique`, `count`, `create`, `createMany`, `update`, `updateMany`, `delete`, `deleteMany`, `upsert`                                                                                                                                                                                            |
| Query filters       | Implemented                        | Equality, null, `in`, `notIn`, string filters, comparison filters, nested `not`, `AND`, `OR`, `NOT`, and aggregate `having` filters for `groupBy`                                                                                                                                                                           |
| Relations           | Implemented                        | Relation includes with nested `where`/`orderBy` and per-parent `skip`/`take`, multi-level relation selects, `_count`, and common nested writes exist in every runtime; relation filters (`some`/`none`/`every` for to-many, `is`/`isNot` for to-one) are TypeScript-only and compile to `EXISTS`/`NOT EXISTS` subqueries — the other runtimes filter from the related side instead. Deeper DB integration coverage is still expanding |
| Transactions        | Implemented                        | Callback-based in every runtime: `$transaction` (TypeScript), `transaction(fn)` (Python/Rust), `Transaction(ctx, fn)` (Go), `BeginTransaction`/`Commit`/`Rollback` (.NET), `transaction { }` (Java/Kotlin/Swift), with automatic commit/rollback. Interactive `$begin()` with `tx.$commit()`/`tx.$rollback()` is TypeScript-only; Python, Java, Kotlin and Swift reject a nested transaction instead of flattening it |
| Raw SQL             | Implemented                        | `$queryRaw`/`$executeRaw` (TypeScript), `QueryRaw`/`ExecuteRaw` (Go), `query_raw`/`execute_raw` (Python/Rust), `QueryRaw`/`ExecuteRaw` (.NET), `queryRaw`/`executeRaw` (Java/Kotlin), `query(_:parameters:)`/`execute(_:parameters:)` (Swift). The `*Unsafe` parameterless variants are TypeScript-only |
| Vector search       | Implemented, environment-dependent | SQL Server vector support when available, SQLite ranked in-database (sqlite-vec, the runtime's `an5_vec_*` functions or `json_each`), in-memory fallback for development                                                                                                                                                                |
| Middleware          | Implemented                        | `$use` pipeline for cross-cutting behavior                                                                                                                                                                                                                                                                                  |
| Error normalization | Implemented                        | Standardized error code mapping for common failures                                                                                                                                                                                                                                                                         |

## Schema Workflow

Schema/database commands run as npm scripts from the `an5Orm/` repository directory (no standalone `an5` CLI binary is shipped).

| Command                       | Status                   | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run generate`            | Implemented              | Generate TypeScript, Python, .NET (C#), Golang, Rust, Java, Kotlin, and Swift client artifacts from `an5Schema/`                                                                                                                                                                                                                                                                                                                                                                             |
| `npm run db:push`             | Implemented              | Safe additive push: create tables and add missing columns from schema                                                                                                                                                                                                                                                                                                                                                                                             |
| `npm run db:pull`             | Implemented              | Introspect database tables into `.an5` files                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `npm run db:migrate diff`     | Implemented, evolving    | Compare schema with database for tables, columns, indexes, field-level unique constraints, and compound unique constraints; mapped `@unique`/`@@unique`/`@@index` artifact names plus `@@index(..., include: [...], filter: "...", options: "...")` covering/filtered/options metadata are honored; `dbo.`-qualified schema tables match unqualified SQL Server introspection names; stale an5-managed indexes/unique constraints are reported as commented drops |
| `npm run db:migrate:generate` | Implemented, evolving    | Generate SQL migration file with `-- migrate:up` plus generated rollback SQL for additive operations                                                                                                                                                                                                                                                                                                                                                              |
| `npm run db:migrate:apply`    | Implemented, evolving    | Apply pending SQL files, record checksums in `_an5_migrations`, or preview with `--preview`                                                                                                                                                                                                                                                                                                                                                                       |
| `npm run db:migrate:rollback` | Implemented, evolving    | Roll back latest, N steps, or through a named applied migration; supports `--preview` SQL preview                                                                                                                                                                                                                                                                                                                                                                 |
| `npm run db:migrate:status`   | Implemented              | Show schema/database/migration status with the same default `dbo.` table-name normalization used by migration diff                                                                                                                                                                                                                                                                                                                                                |
| `npm run db:seed`             | Implemented              | Seed default app/config data                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `npm run db:cleanup`          | Implemented, destructive | Detect/drop tables not represented in schema                                                                                                                                                                                                                                                                                                                                                                                                                      |

These commands run from the `an5Orm/` repository root, so use `npm run <command>` there instead of calling files inside `node_modules/@an5/orm`.

## Adapters

| Adapter        | Status                       | Notes                                                                                                                                        |
| -------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| SQL Server     | Implemented                  | Primary target, connection pooling and raw execution                                                                                         |
| PostgreSQL     | Implemented                  | Dialect-aware quoting and SQL helpers                                                                                                        |
| MySQL          | Implemented                  | Dialect engine exists in TypeScript adapter package                                                                                          |
| SQLite         | Implemented                  | Dialect engine exists in TypeScript adapter package                                                                                          |
| Google Sheets  | Implemented                  | Spreadsheet-backed CRUD API with sheet auto-create and retry helpers; auto-detected via `googlesheets://` connection strings                 |
| NBase          | Implemented                  | Neural Vector Database used as a `vectorSearch` backend: `nbase://` connection string, HNSW/LSH/KNN search, rows hydrated from the table by the id in vector metadata |
| Python adapter | Implemented, packaged source | Source included in `@an5/adapters`; `npm run test:python -w an5Adapters` compile-checks it                                                   |
| .NET adapter   | Implemented, packaged source | C# source included for SQL Server, Postgres and SQLite (`Microsoft.Data.SqlClient`/Npgsql/`Microsoft.Data.Sqlite`); `npm run test:dotnet -w an5Adapters` compile-checks the providers and runs a CRUD test against a real SQLite database |
| Go adapter     | Implemented, packaged source | Go source included under `golang/`; `npm run test:go -w an5Adapters` runs `go test ./...`                                                    |
| Rust adapter   | Published                   | [`an5-adapters`](https://crates.io/crates/an5-adapters) `0.1.0` on crates.io: `An5Adapter` (sqlx pool + dialect detection) and `TableClient` with `find_many`/`find_first`/`find_unique`/`count`/`create`/`create_many`/`update`/`update_many`/`delete_many`/`upsert`/`aggregate`/`group_by`/`vector_search`, plus a `base` module (where/order-by builders, metadata, vector math); the app picks the driver via `sqlx`'s `any` feature. Source under `rust/`; `npm run test:rust -w an5Adapters` runs `cargo test` (skips if toolchain missing) |
| Java adapter   | Published                   | JDBC runtime over SQL Server, PostgreSQL and SQLite, published to Maven Central as [`io.github.an5orm:an5-adapters-java`](https://central.sonatype.com/artifact/io.github.an5orm/an5-adapters-java) `0.2.13` with sources, javadoc and GPG signatures. `An5Adapter` opens connections from a connection string, exposes `queryRaw`/`executeRaw`, `vectorSearch` (with the same `VECTOR(n)` float32 little-endian encoding) and a callback `transaction`; typed handles obtained inside the callback share that transaction, and a nested `transaction` is rejected. Source under `java/`; `npm run test:java -w an5Adapters` compile-checks it |
| Kotlin adapter | Published                   | Kotlin wrapper over the Java runtime, published beside it as [`io.github.an5orm:an5-adapters-kotlin`](https://central.sonatype.com/artifact/io.github.an5orm/an5-adapters-kotlin) `0.2.13`. Exposes `An5 : AutoCloseable` with the same `queryRaw`/`executeRaw`/`vectorSearch`/`transaction` surface. Source under `kotlin/`; `npm run test:kotlin -w an5Adapters` compile-checks it |
| Swift adapter  | Packaged source             | SQLite driver written directly against the system `sqlite3` (no external dependency), with `An5Adapter` exposing `table`/`view`/`queryColumnType`/`query`/`execute`/`transaction` plus the vector strategies. Source under `swift/` as a SwiftPM package; `npm run test:swift -w an5Adapters` builds it with `swift build` (skips if the toolchain is missing) |

The `@an5/adapters` package exposes the full public API from the package root (`createAn5Adapter`, `An5SheetsAdapter`, `SheetsTableClient`, `createAn5SheetsAdapter`, `parseSheetsConnectionString`) as well as through subpaths (`/browser`, `/googlesheets`, `/config`, `/mssql`, `/postgres`, `/mysql`, `/sqlite`, `/base`, `/python`, `/dotnet`, `/golang`). The runtime config API (`getLlmConfig`/`setLlmConfig`, `getEmbeddingConfig`/`setEmbeddingConfig`, `resetAdapter`) is also exported from the package root.

## Generated Clients

| Language   | Status      | Output                                                                                                                                                                                                                 |
| ---------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript | Implemented | Model files, metadata, base types, flexible model property casing (`db.User`, `db.user`, `db.Users`, `db.users`)                                                                                                       |
| Python     | Implemented | Per-model `@dataclass` entities (`<Model>.py`, re-exported via `an5_models.py`), typed `An5Client` (`an5_client.py`)                                                                                                   |
| .NET (C#)  | Implemented | Entity classes, config, `An5DbContext` with complete CRUD (`Count`, `CreateMany`, `UpdateMany`, `DeleteMany`, `Upsert`, `ExecuteRaw`, `QueryRaw`) against SQL Server, Postgres or SQLite, chosen from the connection string; `npm run test:dotnet -w an5Client` compile-checks the generated sources and runs them against a real SQLite database |
| Golang     | Implemented | Per-model files with struct + tags and typed `WhereInput`/`OrderBy`/`FindManyArgs` (`<Model>.go`), generic `TableClient[T]` and `An5DbContext` (`client.go`); `npm run test:go -w an5Client` compile-checks generated sources |
| Rust       | Implemented | Serde structs + typed `WhereInput`/`OrderBy`/`Create`/`Update`/`FindManyArgs`/`VectorSearchArgs` (`models.rs`), `StringFilter`/`IntFilter`/`NumberFilter`/`BoolFilter`/`DateTimeFilter` and typed `BindValue` params (`filters.rs`), `An5Client` backed by the `an5-adapters` runtime with typed per-model handles (`db.user().find_many(..)`, `db.user().vector_search(..)`) plus dynamic `db.table("User")` and vector math (`client.rs`); `npm run test:rust -w an5Client` runs `cargo check` |
| Java       | Implemented | Per-model entity classes with typed setters plus shared `An5Config`, `An5Metadata`, `An5Values` and `An5OrmTypes` (with `Filters`, per-model where builders and `StringFilter`/`IntFilter`/…), and a generic `ModelClient<T>`/`An5DbContext` covering the full CRUD surface plus `aggregate`, `groupBy` and `vectorSearch`; `npm run test:java -w an5Client` compile-checks the generated sources, and `npm run test:java -w an5example` builds and runs the runnable example |
| Kotlin     | Implemented | Per-model data classes plus `An5Config`, `An5Metadata` and `An5OrmTypes` (`An5Orm.UserWhere(..).build()`, `StringFilter.is(..)`, …), and an `An5Db` context with the same CRUD surface plus `aggregate`, `groupBy`, `vectorSearch`, `view`, and raw `query`/`execute`; `npm run test:kotlin -w an5example` builds and runs the runnable example with `kotlinc` |
| Swift      | Implemented | Per-model structs plus `An5Config`, `An5Metadata` and `An5OrmTypes` (`An5Orm.UserWhere`, …), and an `An5Db` context with the same CRUD surface plus `aggregate`, `groupBy`, `vectorSearch`, `table` and `view`, emitted as a SwiftPM package (`Package.swift`); `npm run test:swift -w an5example` builds and runs the runnable example with `swift build` (skips if the toolchain is missing). Consume the runtime dependency by path — see [Known Gaps](#known-gaps) |

## VS Code Extension

| Area | Status | Notes |
| ---- | ------ | ----- |
| Syntax and formatting | Implemented | Grammar, snippets, alignment formatter, `an5Orm.config.js` hover |
| Commands | Implemented | `generate`, `db:push`, `db:pull`, open config, status bar menu |
| MCP server | Implemented | 13 tools over stdio, registered with `vscode.lm.registerMcpServerDefinitionProvider`; read-only tools carry `readOnlyHint` and every mutating tool also requires `confirm: true`. Registers on startup, and `AN5: Install MCP Server` writes the config file for builds without the API. Requires VS Code 1.101+; `npm test -w an5OrmVScode` covers the protocol, the tools and the config merge |

## Shared Schema Parsing

`@an5/orm` owns `.an5` syntax and exposes `SchemaParser` from
`@an5/orm/generator`. The agent tools, the RAG indexer and the MCP server all
read schemas through it, so a description or attribute added to the schema is
reported identically everywhere instead of drifting between private parsers.

## Example Repository

The [`an5example`](https://github.com/an5ORM/an5example) repository demonstrates the whole ecosystem with a single schema:

| Area              | Covers                                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared CRUD suite | Dialect-parameterized `crud-suite.js` exercised on SQLite, the browser (sql.js), and live databases via `AN5_DATABASE_URL`                                |
| Browser support   | In-memory `sql.js` CRUD suite plus an esbuild bundle check that `@an5/adapters/browser` has no Node built-ins                                             |
| Generated clients | Runnable examples for TypeScript (SQLite), Go (SQLite via `modernc.org/sqlite`), Rust (SQLite via the adapter runtime and sqlx), .NET (SQL Server), Python (postgres/mssql), Java (SQLite via JDBC, built with Maven), Kotlin (SQLite via `kotlinc`), and Swift (SQLite via the runtime's own driver, built with SwiftPM) |
| Verification      | `npm test` runs the full offline matrix (`test:suite`, `test:browser`, `test:example:ts`, `test:go`, `test:dotnet`, `test:example:dotnet`, `test:python`, `test:rust`, `test:java`, `test:kotlin`, `test:swift`) |

See the [Examples]({{ '/guides/examples/' | relative_url }}) guide for how to run it.

## AI Agent

| Tool                 | Actions                              | Status                                           |
| -------------------- | ------------------------------------ | ------------------------------------------------ |
| `schema`             | `list`, `describe`, `relations`      | Implemented                                      |
| `query`              | `generate`, `explain`, `validate`    | Implemented                                      |
| `database`           | `execute`, `describe`, `health`      | Implemented                                      |
| `retrieve`           | `schema`, `queries`                  | Implemented; depends on indexed vector store     |
| `task`               | `create`, `list`, `update`, `delete` | Implemented; depends on `an5Tasks` build/runtime |
| `generateClientCode` | -                                    | Implemented                                      |
| `generateCode` | - | Implemented; code output requires an application model callback, otherwise returns schema/API context |
| `analyzeSchema`      | -                                    | Implemented                                      |

## Release and Versioning

| Workflow               | Status      | Command                                       |
| ---------------------- | ----------- | --------------------------------------------- |
| Auto bump npm versions | Implemented | `node scripts/auto-bump-version.js`           |
| Workspace preview      | Implemented | `npm run preview`                              |
| Workspace release      | Implemented | `npm run release` / `npx an5-cli ws . --push` |
| GitHub Pages deploy    | Implemented | `.github/workflows/pages.yml`                 |

The default auto-bump package set is `@an5/adapters` and `@an5/orm`. The script reads npm latest versions and bumps local versions only when needed.

## Known Gaps

| Area                   | Current Gap                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Recommended Next Step                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| PyPI organization      | PyPI orgs are managed through PyPI web UI, not CLI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Create `an5` organization manually and add package owner/manager                                              |
| Migration workflow     | Diff/generate/apply/rollback tracking exists for SQL files; SQL previews and generated preflight checks are available for risky column changes, required additive columns, field-level unique constraints, new unique columns, and compound unique constraints; mapped index/unique artifact names, index include/filter/options metadata, and default `dbo.` schema table names are normalized during diff/status; stale an5-managed indexes/unique constraints are surfaced as commented drops; generated rollback covers additive operations and column type/nullability reversal           | Add live generated migration apply/rollback scenarios for mapped and advanced index metadata                  |
| Test coverage          | Smoke/unit/compile/package-smoke tests exist; `an5example` adds a shared multi-dialect CRUD + relations suite (SQLite + sql.js browser + live `AN5_DATABASE_URL` harness) and per-language example checks (Go build/vet, Rust build + SQLite CRUD run, .NET compile, Python SQLite CRUD + vector round trip); unit coverage includes generated diff SQL for mapped advanced index metadata; live DB integration covers adapter Postgres/SQL Server CRUD/filter/update/groupBy/transaction/vector fallback plus ORM SQL Server nested relation/select/include/count/aggregate/groupBy/transaction/vector fallback and migration apply/rollback flows in CI | Add broader live generated migration apply/rollback scenarios                                                 |
| Relation edge cases    | Common relation flows, multi-level relation selects, and nested writes exist in every runtime; relation filters (`some`/`none`/`every`/`is`/`isNot`) are implemented only in TypeScript, and the other runtimes silently ignore a relation filter key rather than raising — filter from the related side there instead                                                                                                                                                                                                                                              | Implement relation filters in the remaining runtimes and reject unsupported filter keys instead of ignoring them   |
| Python query keys     | The Python `where`/`order_by` dictionaries are read by quoting each key verbatim, so keys must be the schema field names (`createdAt`, `authorId`) even though the generated dataclasses spell them snake_case. A key the parser does not recognize — a relation filter such as `some`/`every`/`none` — produces an empty `WHERE` rather than an error                                                                                                                                                     | Resolve keys through the generated metadata so `created_at` maps to `createdAt`, and reject unknown keys instead of dropping them                                                  |
| Python typed filters  | `an5_orm_types.py` emits `*WhereInput`/`*OrderByInput`/`*Filter` dataclasses that describe the accepted filter shapes, but the Python adapter takes plain dictionaries and has no dataclass support, so passing one fails                                                                                                                                                                                  | Accept the emitted dataclasses in the Python adapter and convert them to the filter dictionaries the SQL builder already parses                                           |
| SwiftPM packaging      | The generated Swift client declares its runtime as `.package(url: "https://github.com/an5ORM/an5Adapters.git", from: "0.2.11")`, but the runtime's `Package.swift` lives in `swift/` inside that repository rather than at its root and the repository carries no matching tag, so the URL dependency does not resolve. Depend on the runtime by path in the meantime. The Java and Kotlin runtimes are unaffected — they resolve from Maven Central                             | Publish the Swift runtime as a root SwiftPM package (`Package.swift` at the repository root) with version tags, and point the generator's emitted dependency at it          |
| Package build pipeline | Published packages include build artifacts and language sources; `npm run test:full` runs cross-language compile/package-smoke gates, and CI also runs containerized live DB integration                                                                                                                                                                                                                                                                                                                                                                                                           | Extend publish gates if live DB checks are desired before release                                             |

## Recommended Install

For a normal application project:

```bash
npm install @an5/orm
npm run generate   # from an5Orm/
npm run db:push    # from an5Orm/
```

For adapter-only TypeScript usage:

```bash
npm install @an5/adapters
```

For Python usage:

```bash
pip install an5-orm an5-adapters
```
