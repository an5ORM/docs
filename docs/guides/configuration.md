---
layout: page
title: Configuration
description: Configure an5 ORM for your environment
---

# Configuration

an5 ORM uses environment variables, schema configuration files, and runtime adapters to customize behavior.

## an5Orm.config.js

Create `an5Orm.config.js` in your project root to configure code generation and schema options:

```javascript
module.exports = {
  // Database for db:push, db:pull, db:migrate:* and db:cleanup.
  // DATABASE_URL overrides this, so commit a development database here and
  // let CI set its own. Keep passwords in the environment.
  connectionString: "sqlserver://localhost:1433;database=mydb;user=sa;password=...",

  // Schema directory (default: 'an5Schema')
  schemaDir: "an5Schema",

  // Output configuration
  outputs: {
    typescript: {
      outputDir: "an5Client/typescript",
      metadataFile: "an5Client/typescript/an5Metadata.ts",
    },
    python: {
      metadataFile: "an5Client/python/an5_metadata.py",
    },
    dotnet: {
      outputDir: "an5Client/dotnet",
    },
    golang: {
      outputDir: "an5Client/golang",
    },
    rust: {
      outputDir: "an5Client/rust",
    },
  },

  // Database pull options
  pull: {
    exclude: ["^__", "^sys\\."], // Exclude system tables
    preserveRelations: true,
  },

  // Code generation options
  generation: {
    generateMetadata: true, // Write the generated metadata module
  },
};
```

### Validation

The file is checked before anything uses it, so a mistyped key or a wrong type
stops generation instead of quietly changing where the output goes:

```
❌ Invalid an5Orm.config.js:
  outputs.typescript.outputDirs  unknown option; did you mean "outputDir"?
  pull.exclude                   expected an array of strings, received string
  generation.generateComments    unknown option; expected one of "generateMetadata"
```

Every problem is reported at once. Each key is known, each value has an expected
type, and a key that is close to a real one gets a suggestion. The four CLI
commands and the generator all read the file through this one loader, so they
cannot disagree about what it means.

### Provider

The connection string also picks the database provider, which decides which field
types the schema may use. `sqlserver://` is SQL Server (also the fallback for
anything unrecognised), `postgres://`/`postgresql://` PostgreSQL, `mysql://`/
`mariadb://` MySQL, `sqlite://` or a path ending in `.sqlite`/`.db` SQLite, and
`googlesheets://` Google Sheets. See [Field Types]({{ '/guides/schema/' | relative_url }}#field-types).

```ini
# PostgreSQL — `INT` in the schema is now rejected, `INTEGER` is the spelling
DATABASE_URL=postgres://user:password@localhost:5432/mydb
```

With no connection string the provider is SQL Server, so generating from a config
without one keeps validating against SQL Server types.

`db:push` writes the DDL of whichever provider the connection string selects, so it
works on all of them. `db:pull`, `db:migrate:*` and `db:cleanup` still only speak SQL
Server — they read `sys.*` catalogs and write T-SQL — so pointed at another provider
they stop with that message rather than running the wrong SQL. `db:seed` is not
affected either way: it only runs the project's own script.

### Configuration Options

| Option                            | Type       | Default                                 | Description                                 |
| --------------------------------- | ---------- | --------------------------------------- | ------------------------------------------- |
| `connectionString`                | `string`   | —                                       | Database for the CLI commands; `DATABASE_URL` overrides it |
| `schemaDir`                       | `string`   | `'an5Schema'`                           | Path to schema files                        |
| `outputs.typescript.outputDir`    | `string`   | `'an5Client/typescript'`                | TypeScript output directory                 |
| `outputs.typescript.metadataFile` | `string`   | `'an5Client/typescript/an5Metadata.ts'` | Metadata file path for the generated client |
| `outputs.python.metadataFile`     | `string`   | `'an5Client/python/an5_metadata.py'`    | Python metadata path                        |
| `outputs.dotnet.outputDir`        | `string`   | `'an5Client/dotnet'`                    | .NET output directory                       |
| `outputs.golang.outputDir`        | `string`   | `'an5Client/golang'`                    | Go output directory                         |
| `outputs.rust.outputDir`          | `string`   | `'an5Client/rust'`                      | Rust output directory                       |
| `generation.generateMetadata`     | `boolean`  | `true`                                  | Write the generated metadata module         |
| `pull.exclude`                    | `string[]` | `['^__', '^sys\\.']`                    | Tables to exclude from pull                 |
| `pull.preserveRelations`          | `boolean`  | `true`                                  | Keep relations in schema                    |

## Environment Variables

### Database (`DATABASE_URL`)

`DATABASE_URL` takes precedence over `connectionString` in the config file, so
the same committed config works locally and in CI.

```ini
# SQL Server
DATABASE_URL=sqlserver://localhost:1433;database=mydb;user=sa;password=yourpassword

# PostgreSQL
DATABASE_URL=postgres://user:password@localhost:5432/mydb

# MySQL
DATABASE_URL=mysql://user:password@localhost:3306/mydb

# SQLite
DATABASE_URL=sqlite:///path/to/database.db

# Google Sheets
DATABASE_URL=googlesheets://spreadsheetId;clientEmail=sa@project.iam.gserviceaccount.com;privateKey=your-url-encoded-key

# NBase — vector store, no rows of its own
DATABASE_URL=nbase://localhost:1307
```

`nbase://host:port` may carry options in the query string:
`?token=…&timeoutMs=500&method=hnsw`. To search NBase while the rows stay in
another database, pass the same string as `nbase` next to that database's
connection string — see [Vector Search]({{ '/guides/vector-search/' | relative_url }}).

### LLM Configuration (for an5-cli release notes & agent features)

```ini
LLM_PROVIDER=openai  # openai, gemini, custom
LLM_API_KEY=sk-your-api-key
LLM_MODEL=gpt-4o-mini
```

## Runtime Adapter Setup (via `@an5/adapters`)

```typescript
import { createAn5Adapter } from "@an5/adapters";

const db = createAn5Adapter({
  // The runtime reads the environment, not an5Orm.config.js — that file
  // configures the generator and the CLI commands.
  connectionString: process.env.DATABASE_URL!,
});

await db.$connect();
```

## LLM & Embedding Runtime Config

At runtime you can read and update the active LLM/Embedding config using the config API exported from `@an5/adapters`:

```typescript
import {
  getLlmConfig,
  setLlmConfig,
  getEmbeddingConfig,
  setEmbeddingConfig,
  resetAdapter,
} from "@an5/adapters";

const current = getLlmConfig();
setLlmConfig({ provider: "openai", model: "gpt-4o-mini", apiKey: "..." });
setEmbeddingConfig({
  provider: "openai",
  model: "text-embedding-3-small",
  apiKey: "...",
});
resetAdapter();
```

## Docker Configuration

### docker-compose.yml

```yaml
version: "3.8"
services:
  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=yourpassword
      - MSSQL_PID=Developer
    ports:
      - "1433:1433"
    volumes:
      - mssql-data:/var/opt/mssql

  app:
    build: .
    environment:
      - DATABASE_URL=sqlserver://db:1433;database=mydb;user=sa;password=yourpassword
    depends_on:
      - db

volumes:
  mssql-data:
```
