---
layout: page
title: Troubleshooting
description: Diagnostic guides, solutions, and resolutions for database connections and schema errors
---

# Troubleshooting

Solutions to common issues with database connections, schema validation, and runtime execution in an5 ORM.

{% assign code = page.docs_code | default: 'typescript' %}
{% assign provider = page.docs_provider | default: 'sqlite' %}

<p class="guide-note">
  <strong>Active Context:</strong> Troubleshooting for <strong>{{ code | capitalize }}</strong> on <strong>{{ provider | capitalize }}</strong>.
</p>

## Connection Issues

### 1. Connection Refused or Host Unreachable

**Symptom:** `ECONNREFUSED`, `Connection refused`, or timeout trying to open database connection.

**Diagnostic Checklist:**
1. Confirm the database service is running on the host and port.
2. Verify network firewalls allow incoming traffic from your application IP.
3. Validate connection string syntax for **{{ provider | capitalize }}**:

```ini
# Valid connection format for {{ provider | capitalize }}
DATABASE_URL={% case provider %}{% when 'postgresql' %}postgres://user:password@localhost:5432/dbname?sslmode=disable{% when 'sqlserver' %}sqlserver://localhost:1433;database=mydb;user=sa;password=yourpassword;trustServerCertificate=true{% when 'mysql' %}mysql://user:password@localhost:3306/mydb{% when 'sqlite' %}sqlite:///absolute/path/to/database.db{% when 'googlesheets' %}googlesheets://spreadsheetId;clientEmail=sa@project.iam.gserviceaccount.com;privateKey=...{% when 'nbase' %}nbase://localhost:1307?token=secret{% endcase %}
```

{% case provider %}
{% when 'postgresql' %}
**PostgreSQL specific notes:**
- Check `pg_hba.conf` allows connections from your client IP.
- When connecting to cloud instances (RDS, Supabase, Neon), append `?sslmode=require`.
- If vector queries fail, ensure extension is enabled: `CREATE EXTENSION IF NOT EXISTS vector;`.
{% when 'sqlserver' %}
**SQL Server specific notes:**
- If connecting with self-signed TLS certificates, append `;trustServerCertificate=true`.
- Verify the SQL Server Browser service and TCP/IP protocol are enabled in SQL Server Configuration Manager.
{% when 'mysql' %}
**MySQL specific notes:**
- If connecting with MySQL 8 `caching_sha2_password`, ensure the client driver supports modern auth or alter user to `mysql_native_password`.
{% when 'sqlite' %}
**SQLite specific notes:**
- Ensure the parent directory has write permissions for the application process.
- If getting `SQLITE_BUSY`, enable WAL mode (`PRAGMA journal_mode=WAL;`) for concurrent read/write access.
{% when 'googlesheets' %}
**Google Sheets specific notes:**
- If receiving `403 Forbidden`, ensure the target Google Spreadsheet is shared with the service account email (`clientEmail`) with Editor permissions.
- Ensure private key newlines (`\n`) in `.env` are URL-encoded or preserved properly.
{% when 'nbase' %}
**NBase specific notes:**
- Verify NBase vector daemon is running and listening on port 1307.
{% endcase %}

---

## Connection Diagnostic Test

Run a quick connection health test using your active language:

{% case code %}
{% when 'typescript' %}
```typescript
import { createAn5Adapter } from '@an5/adapters';

const db = createAn5Adapter({
  connectionString: process.env.DATABASE_URL!,
});

try {
  await db.$connect();
  console.log('Connected successfully to {{ provider | capitalize }}');
  await db.$disconnect();
} catch (error) {
  console.error('Connection failed:', error);
}
```

{% when 'python' %}
```python
import os
from an5_adapter import create_an5_adapter

try:
    db = create_an5_adapter(os.environ["DATABASE_URL"])
    print("Connected successfully to {{ provider | capitalize }}")
except Exception as error:
    print(f"Connection failed: {error}")
```

{% when 'dotnet' %}
```csharp
using System;
using an5Adapters.Dotnet;

try {
    var adapter = new An5Adapter(Environment.GetEnvironmentVariable("DATABASE_URL")!);
    Console.WriteLine("Connected successfully to {{ provider | capitalize }}");
} catch (Exception ex) {
    Console.WriteLine($"Connection failed: {ex.Message}");
}
```

{% when 'golang' %}
```go
package main

import (
    "fmt"
    "os"
    "github.com/an5ORM/an5Adapters/golang"
)

func main() {
    adapter, err := an5adapters.NewAn5Adapter(os.Getenv("DATABASE_URL"))
    if err != nil {
        fmt.Printf("Connection failed: %v\n", err)
        return
    }
    defer adapter.Close()
    fmt.Println("Connected successfully to {{ provider | capitalize }}")
}
```

{% when 'rust' %}
```rust
use an5_adapters::An5Adapter;

#[tokio::main]
async fn main() {
    let conn_str = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    match An5Adapter::connect(&conn_str).await {
        Ok(_) => println!("Connected successfully to {{ provider | capitalize }}"),
        Err(err) => eprintln!("Connection failed: {}", err),
    }
}
```

{% endcase %}

---

## Schema & Code Generation Issues

### 1. Type Mismatch in Schema

**Error:** `Invalid field type 'X' for provider 'Y'`

**Cause:** The schema `.an5` uses a type specific to another database dialect (e.g. `BIT` on SQLite or `BOOLEAN` on SQL Server).

**Solution:** Align field types in `an5Schema/` with the dialect rules of **{{ provider | capitalize }}**:
- Consult the [Field Types]({{ '/' | append: code | append: '/' | append: provider | append: '/guides/schema/' | relative_url }}#field-types) reference for valid types per provider.

### 2. Output Directory Not Found

**Error:** `Directory does not exist for generator output`

**Solution:** `an5Orm` generates directories automatically. Ensure your user has filesystem write permissions in the workspace and verify `outputs` paths in `an5Orm.config.js`.

---

## Next Steps

- [Database Providers]({{ '/' | append: code | append: '/' | append: provider | append: '/guides/providers/' | relative_url }}) - Full dialect specifications
- [Deployment]({{ '/' | append: code | append: '/' | append: provider | append: '/guides/deployment/' | relative_url }}) - Production security and pooling setup
