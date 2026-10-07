---
layout: page
title: Configuration
description: Configure an5 ORM for your environment, target languages, and database providers
---

# Configuration

an5 ORM uses configuration files, environment variables, and runtime adapters to tailor behavior to your architecture.

{% assign code = page.docs_code | default: 'typescript' %}
{% assign provider = page.docs_provider | default: 'sqlite' %}

<p class="guide-note">
  <strong>Active Context:</strong> Currently configuring for <strong>{{ code | capitalize }}</strong> with <strong>{{ provider | capitalize }}</strong>.
  The connection string and client runtime examples below are customized for your selection.
</p>

## an5Orm.config.js

Create `an5Orm.config.js` in your project root to configure code generation and schema options:

```javascript
module.exports = {
  // Database for db:push, db:pull, db:migrate:* and db:cleanup.
  // DATABASE_URL overrides this, so commit a development database here and
  // let CI set its own. Keep passwords in the environment.
  connectionString: {% case provider %}{% when 'postgresql' %}"postgres://user:password@localhost:5432/mydb"{% when 'mysql' %}"mysql://user:password@localhost:3306/mydb"{% when 'sqlite' %}"sqlite://./dev.db"{% when 'googlesheets' %}"googlesheets://spreadsheetId;clientEmail=sa@project.iam.gserviceaccount.com;privateKey=..."{% when 'nbase' %}"nbase://localhost:1307"{% else %}"sqlserver://localhost:1433;database=mydb;user=sa;password=..."{% endcase %},

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

```text
❌ Invalid an5Orm.config.js:
  outputs.typescript.outputDirs  unknown option; did you mean "outputDir"?
  pull.exclude                   expected an array of strings, received string
  generation.generateComments    unknown option; expected one of "generateMetadata"
```

Every problem is reported at once. Each key is known, each value has an expected
type, and a key that is close to a real one gets a suggestion. The four CLI
commands and the generator all read the file through this loader.

### Provider Detection

The connection string scheme selects the database provider and determines allowed schema field types:

- `sqlserver://` &rarr; SQL Server
- `postgres://` or `postgresql://` &rarr; PostgreSQL
- `mysql://` or `mariadb://` &rarr; MySQL
- `sqlite://` or `.sqlite`/`.db` path &rarr; SQLite
- `googlesheets://` &rarr; Google Sheets
- `nbase://` &rarr; NBase Vector Database

```ini
# Selected provider connection string
DATABASE_URL={% case provider %}{% when 'postgresql' %}postgres://user:password@localhost:5432/mydb{% when 'mysql' %}mysql://user:password@localhost:3306/mydb{% when 'sqlite' %}sqlite:///path/to/database.db{% when 'googlesheets' %}googlesheets://spreadsheetId;clientEmail=sa@project.iam.gserviceaccount.com;privateKey=your-key{% when 'nbase' %}nbase://localhost:1307{% else %}sqlserver://localhost:1433;database=mydb;user=sa;password=yourpassword{% endcase %}
```

## Runtime Adapter Setup

{% case code %}
{% when 'typescript' %}
In TypeScript / Node.js or browser environments:

```typescript
import { createAn5Adapter } from "@an5/adapters";

const db = createAn5Adapter({
  connectionString: process.env.DATABASE_URL!,
});

await db.$connect();
```

{% when 'python' %}
In Python applications:

```python
import os
from an5_adapter import create_an5_adapter

conn_str = os.getenv("DATABASE_URL", "{% case provider %}{% when 'postgresql' %}postgres://user:pass@localhost:5432/db{% when 'sqlite' %}sqlite:///dev.db{% else %}sqlserver://localhost:1433;database=db{% endcase %}")
db = create_an5_adapter(conn_str)
```

{% when 'dotnet' %}
In .NET (C#) applications:

```csharp
using an5Adapters.Dotnet;

var connStr = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? "{% case provider %}{% when 'postgresql' %}Host=localhost;Database=db{% when 'sqlite' %}Data Source=dev.db{% else %}Server=localhost;Database=db{% endcase %}";
var adapter = new An5Adapter(connStr);
```

{% when 'golang' %}
In Go services:

```go
package main

import (
    "os"
    "github.com/an5ORM/an5Adapters/golang"
)

func main() {
    connStr := os.Getenv("DATABASE_URL")
    adapter, err := an5adapters.NewAn5Adapter(connStr)
    if err != nil {
        panic(err)
    }
    defer adapter.Close()
}
```

{% when 'rust' %}
In Rust crates:

```rust
use an5_adapters::An5Adapter;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let conn_str = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "{% case provider %}{% when 'postgresql' %}postgres://localhost/db{% when 'sqlite' %}sqlite://dev.db{% else %}sqlserver://localhost/db{% endcase %}".into());
    let adapter = An5Adapter::connect(&conn_str).await?;
    Ok(())
}
```

{% endcase %}

## SQLite Vector Search

SQLite ranks a `VECTOR(n)` column inside the database. Two adapter options
control how:

```typescript
const db = createAn5Adapter({
  connectionString: 'sqlite:///app.db',
  // Load the sqlite-vec extension. Optional: without it the adapters rank with
  // their own distance functions or `json_each`.
  sqliteVec: './node_modules/sqlite-vec/vec0',
  // Pin one strategy instead of probing: 'sqlite-vec' | 'udf' | 'sql' | 'memory'.
  vectorStrategy: 'auto',
});
```

| Option | Type | Default | Applies to |
|--------|------|---------|------------|
| `sqliteVec` | `string` | unset | SQLite only |
| `vectorStrategy` | `'auto' \| 'sqlite-vec' \| 'udf' \| 'sql' \| 'memory'` | `'auto'` | SQLite only |

Other runtimes spell the same option `sqlite_vec` / `vector_strategy` (Python),
`SqliteVec` / `VectorStrategy` (.NET), `VectorSupport` (Go), `vector_strategy`
(Rust), `sqliteVecPath` / `vectorStrategy` (Swift) and `An5.vectorStrategy(…)`
(Kotlin). See [Vector Search](vector-search.md#sqlite).

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

## Next Steps

- [Database Providers]({{ '/' | append: code | append: '/' | append: provider | append: '/guides/providers/' | relative_url }}) - Comprehensive database provider guide
- [Client Languages]({{ '/' | append: code | append: '/' | append: provider | append: '/guides/client-languages/' | relative_url }}) - Multi-language runtime reference
