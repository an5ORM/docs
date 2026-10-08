---
layout: page
title: Examples
description: Run the an5example repository across all languages, dialects, and the browser
---

# Examples

{% assign code = page.docs_code | default: 'typescript' %}
{% assign provider = page.docs_provider | default: 'sqlite' %}

<p class="guide-note">
  <strong>Selected Stack:</strong> Run example for <strong>{{ code | capitalize }}</strong> on <strong>{{ provider | capitalize }}</strong>:<br>
  Command: <code>{% case code %}{% when 'typescript' %}npm run test:example:ts{% when 'python' %}npm run test:python{% when 'dotnet' %}npm run test:example:dotnet{% when 'golang' %}npm run test:go{% when 'rust' %}npm run test:rust{% when 'java' %}npm run test:java{% when 'kotlin' %}npm run test:kotlin{% when 'swift' %}npm run test:swift{% endcase %}</code><br>
  Test against live {{ provider | capitalize }}: <code>AN5_DATABASE_URL="{% case provider %}{% when 'postgresql' %}postgres://user:pass@localhost:5432/db{% when 'mysql' %}mysql://user:pass@localhost:3306/db{% when 'sqlite' %}sqlite://./test.db{% when 'googlesheets' %}googlesheets://spreadsheetId;clientEmail=...;privateKey=...{% when 'nbase' %}nbase://localhost:1307{% else %}sqlserver://localhost:1433;database=mydb;user=sa;password=pass{% endcase %}" npm run test:live</code>
</p>

The [`an5example`](https://github.com/an5ORM/an5example) repository is the reference
example for the an5 ORM ecosystem. It contains the full CRUD + relations integration
suite, runnable examples for every generated client language, browser support, and a
live database harness.

```text
an5example/
├── schema/                  # .an5 model definitions
├── generated/               # Generated clients: typescript/ python/ golang/ dotnet/ rust/ java/ kotlin/ swift/
├── scripts/                 # SQLite setup + per-dialect DDL for the live harness
├── test/
│   ├── crud-suite.js        # Shared, dialect-parameterized CRUD + relations suite
│   ├── crud.sqlite.test.js  # Suite against SQLite (better-sqlite3)
│   ├── crud.live.test.js    # Suite against a live DB via AN5_DATABASE_URL
│   ├── crud.browser.test.js # Suite against in-browser SQLite (sql.js WASM)
│   ├── browser-bundle.test.js # esbuild verify @an5/adapters/browser is bundler-safe
│   ├── go-example-build.js  # go build + vet of the generated Go client
│   ├── rust-example-build.js # cargo build + run of the generated Rust client
│   ├── dotnet-compile-check.js # dotnet build of the generated C# client
│   ├── java-example-build.js # mvn compile + run of the Java example
│   ├── kotlin-example-build.js # kotlinc build + run of the Kotlin example
│   └── swift-example-build.js # swift build + run of the Swift example
└── examples/
    ├── typescript/crud.ts   # TS runtime example (SQLite, offline-runnable)
    ├── golang/               # Generated Go client CRUD against SQLite
    ├── rust/                 # Generated Rust client CRUD against SQLite
    ├── dotnet/               # Generated C# client against SQL Server
    ├── python/crud.py        # Generated Python client: SQLite CRUD + VECTOR(n), live server smoke
    ├── java/                 # Maven build of the generated Java client + JDBC adapter
    ├── kotlin/               # Generated Kotlin client + adapter against SQLite
    └── swift/                # SwiftPM package: generated Swift client + SQLite driver
```

## Running the Full Test Matrix

```bash
cd an5example
npm install
npm test
```

`npm test` runs the complete offline matrix:

| Script | Covers |
|--------|--------|
| `test:suite` | Shared CRUD + relations suite on SQLite (better-sqlite3) |
| `test:browser` | CRUD suite on `sql.js` in-memory SQLite + esbuild bundle check |
| `test:example:ts` | TypeScript runtime example |
| `test:go` | `go build` + `go vet` of the generated Go client |
| `test:dotnet` | `dotnet build` of the generated C# client |
| `test:example:dotnet` | .NET example run (skips gracefully when SQL Server is unreachable) |
| `test:python` | Python example: import check, then a SQLite CRUD + `VECTOR(n)` round trip and ranking |
| `test:rust` | `cargo build` of the generated Rust client + run the Rust SQLite CRUD example |
| `test:java` | `mvn compile` of the generated Java client + JDBC adapter, then the Java example |
| `test:kotlin` | `kotlinc` build of the generated Kotlin client + adapter, then the Kotlin example |
| `test:swift` | `swift build` + `swift run` of the SwiftPM example over the generated Swift client |

## Live Database Harness

The same suite runs against any database supported by `@an5/adapters` (SQL Server,
PostgreSQL, MySQL, SQLite) by pointing `AN5_DATABASE_URL` at a reachable instance.
Tables are created automatically from `scripts/ddl.cjs` and removed afterwards.

```bash
AN5_DATABASE_URL="postgres://user:pass@localhost:5432/db" npm run test:live
```

The harness skips gracefully when the database is unreachable, so `npm test` stays green offline.

## Browser Support

`@an5/adapters/browser` is a Node-builtin-free entrypoint. The example proves it in
two ways: the CRUD suite runs against `sql.js` (WASM) in memory, and an esbuild
bundle check verifies the browser build contains no Node built-ins and exposes
`createBrowserSqliteAdapter`, `SqliteBrowserEngine`, and the sheets adapters.

## Language Examples

Each `examples/` language mirrors the generated client for that language:

- **TypeScript** (`examples/typescript/crud.ts`) — uses `@an5/adapters` with generated
  types against an in-memory SQLite database. Offline-runnable after `npm run build`.
- **Go** (`examples/golang/`) — standalone Go module that runs the generated
  `an5client` against SQLite via `modernc.org/sqlite`. First run needs
  `go mod download` (network).
- **.NET** (`examples/dotnet/`) — console app using the generated `An5DbContext`
  against SQL Server. Builds offline; skips the live run when no SQL Server is reachable.
- **Rust** (`examples/rust/`) — binary crate that drives the generated
  `an5-client` model handles against SQLite through the adapter runtime and
  `sqlx`, so all DML goes through the ORM. Demonstrates `StringFilter` /
  `IntFilter` / `BoolFilter`, nested `AND`/`OR` composition, `orderBy` + `take`,
  relation filtering, `count`, `update`, `delete` and the vector helpers. First
  run downloads crates.
- **Python** (`examples/python/crud.py`) — generated Python client; builds a temporary
  SQLite database and asserts a `VECTOR(n)` column comes back as floats, is stored as a
  float32 BLOB and ranks correctly, then runs a live CRUD smoke when `AN5_DATABASE_URL`
  points at a postgres/mssql database.
- **Java** (`examples/java/`) — Maven project that compiles the generated Java client
  together with the JDBC adapter source and runs the CRUD example against SQLite.
  First run downloads the SQLite driver and Maven plugins.
- **Kotlin** (`examples/kotlin/`) — generated Kotlin client and adapter compiled with
  `kotlinc`, then the same CRUD example against SQLite. No Gradle build is shipped
  because no environment in CI runs one.
- **Swift** (`examples/swift/An5Example/`) — SwiftPM package that builds the generated
  Swift client over the runtime's own SQLite driver and runs the CRUD example. The
  package sits a directory below `examples/swift` because SwiftPM identifies a package
  by its directory name, which would otherwise collide with `generated/swift`.

## VS Code MCP Server

The [an5OrmVScode](https://github.com/an5ORM/an5OrmVScode) extension ships a
[Model Context Protocol](https://modelcontextprotocol.io) server, so GitHub
Copilot and other MCP clients can work with the schema directly instead of
guessing at it from the file tree.

Install it from the Extensions view, or:

```bash
code --install-extension an5orm.an5-orm-vscode
```

The extension id is the same on the
[VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=an5orm.an5-orm-vscode)
and on [Open VSX](https://open-vsx.org/extension/an5orm/an5-orm-vscode), so the
command works in VSCodium and other VS Code-compatible editors too.

On VS Code 1.101 or newer the server registers itself: open `MCP: List Servers`
and start **AN5 ORM**.

If it does not appear — an older build, or an editor such as Cursor or VSCodium
that predates the API — run **AN5: Install MCP Server**. It writes the entry into
the open workspace with the extension path already resolved, choosing between
`.mcp.json` (portable) and `.vscode/mcp.json`. Your other servers are preserved,
and a config file it cannot parse is reported rather than overwritten.

```json
{
  "mcpServers": {
    "an5-orm": {
      "type": "stdio",
      "command": "/path/to/node",
      "args": ["/path/to/an5orm.an5-orm-vscode/dist/mcp/server.js"],
      "cwd": "/path/to/project"
    }
  }
}
```

**AN5: Show MCP Server Configuration** prints that configuration without writing
it, which is what another MCP client needs.

The server discovers the project from its working directory: `an5Orm.config.js`,
the `.an5` files, the installed `@an5/orm` and `DATABASE_URL`.

| Tools | Behaviour |
|-------|-----------|
| `an5_list_models`, `an5_describe_model`, `an5_get_relations`, `an5_analyze_schema`, `an5_read_schema_file` | Read-only, marked `readOnlyHint` so no confirmation is asked |
| `an5_query_database` | `SELECT` only; any other statement is rejected |
| `an5_describe_table`, `an5_database_health` | Read-only |
| `an5_generate_client`, `an5_push_schema`, `an5_pull_schema`, `an5_migrate`, `an5_seed` | Change the database or write files, so they ask for confirmation **and** require an explicit `confirm: true` |

Read-only tools are also the only ones a model can call freely, so always check
which tool ran before approving a schema change.

For detailed configuration (Cursor, Claude Desktop), security policies, and parameter specifications for all 13 tools, see the [VS Code MCP Server Guide]({{ '/guides/vscode-mcp/' | relative_url }}).

## Next Steps

- [Getting Started]({{ '/guides/getting-started/' | relative_url }}) - Set up an5 in your project
- [Feature Status]({{ '/guides/feature-status/' | relative_url }}) - Current implementation maturity