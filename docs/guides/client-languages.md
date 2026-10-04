---
layout: page
title: Client Languages
description: Complete reference for AN5 ORM multi-language client runtimes across TypeScript, Python, .NET (C#), Go, and Rust.
---

{% assign code = page.docs_code | default: 'typescript' %}
{% assign provider = page.docs_provider | default: 'sqlite' %}

# Client Languages

<p class="guide-note">
  <strong>Active Language:</strong> You are currently viewing documentation targeting <strong>{{ code | capitalize }}</strong>.
  The setup instructions, client model generation, and API query patterns below are aligned with your selection.
</p>

AN5 ORM generates native, type-safe client libraries from a single `.an5` schema across **TypeScript**, **Python**, **.NET (C#)**, **Go**, and **Rust**.

---

## Language Ecosystem Overview

| Language | Client Package | Generated Directory | Generated Classes / Structs | Query API Style |
|---|---|---|---|---|
| **TypeScript** | `@an5/adapters` | `an5Client/typescript/` | Proxy Model Client (`db.user`) | Prisma-like async/await |
| **Python** | `an5-client` | `an5Client/python/` | Dataclasses + `An5Client` | Pythonic snake_case methods |
| **.NET (C#)** | `An5.Adapters` | `an5Client/dotnet/` | Entity Classes + `An5DbContext` | Async task-based methods |
| **Go** | `an5client` | `an5Client/golang/` | Structs + `TableClient[T]` | Context-first type-safe API |
| **Rust** | `an5-client` | `an5Client/rust/` | Serde Models + `An5Client` | Strongly-typed async futures |

---

## 1. TypeScript

### Package & Setup
```bash
npm install @an5/adapters @an5/orm
```

### Initialization & CRUD
```typescript
import { createAn5Adapter } from '@an5/adapters';

const db = createAn5Adapter({
  connectionString: process.env.DATABASE_URL!,
});

// Create
const user = await db.user.create({
  data: { email: 'alice@example.com', name: 'Alice' }
});

// Find Many
const users = await db.user.findMany({
  where: { email: { contains: '@example.com' } },
  orderBy: { createdAt: 'desc' },
  skip: 0,
  take: 10,
});

// Update & Delete
await db.user.update({
  where: { id: user.id },
  data: { name: 'Alice Walker' }
});
await db.user.delete({ where: { id: user.id } });
```

---

## 2. Python

### Output & Setup
Generated under `an5Client/python/`:
* `an5_client.py`: The `An5Client` entry point.
* `an5_models.py`: Data classes with TypedDict row shapes.
* `an5_orm_types.py`: Type-safe filter objects (`StringFilter`, `IntFilter`, etc.).

### Usage
```python
from an5_client import An5Client

db = An5Client()  # automatically reads DATABASE_URL

# Create
user = db.user.create(
    data={"email": "bob@example.com", "name": "Bob"}
)

# Find Many
users = db.user.find_many(
    where={"email": {"contains": "@example.com"}},
    order_by={"created_at": "desc"},
    skip=0,
    take=10,
)

# Raw SQL
results = db.query_raw("SELECT id, email FROM users WHERE id = %s", user["id"])
```

---

## 3. .NET (C#)

### Output & Setup
Generated under `an5Client/dotnet/`:
* `<Model>.cs`: Strongly-typed C# entity classes.
* `An5DbContext.cs`: ORM context providing `Users`, `Posts`, etc.
* `An5OrmTypes.cs`: Query argument and filter classes.

### Usage
```csharp
using An5Orm;

var db = new An5DbContext(); // reads DATABASE_URL from environment

// Create
var user = await db.Users.CreateAsync(new UserCreateInput
{
    Email = "carol@example.com",
    Name = "Carol"
});

// Find Many with Filters
var users = await db.Users.FindManyAsync(new UserFindManyArgs
{
    Where = new UserWhereInput
    {
        Email = new StringFilter { Contains = "@example.com" }
    },
    OrderBy = new UserOrderByInput { CreatedAt = SortOrder.Desc },
    Take = 10
});

// Raw SQL
var rawUsers = await db.QueryRawAsync<User>("SELECT * FROM users WHERE status = @p_0", "active");
```

---

## 4. Go (Golang)

### Output & Setup
Generated under `an5Client/golang/`:
* `<model>.go`: Struct definitions with JSON tags.
* `client.go`: `An5DbContext` and generic `TableClient[T]` methods.

### Usage
```go
package main

import (
    "context"
    "fmt"
    "os"
    "an5client"
)

func main() {
    ctx := context.Background()
    db, err := an5client.NewAn5DbContext(ctx, os.Getenv("DATABASE_URL"))
    if err != nil {
        panic(err)
    }

    // Create
    user, err := db.User.Create(ctx, &an5client.UserCreateInput{
        Email: "dave@example.com",
        Name:  "Dave",
    })

    // Find Many
    users, err := db.User.FindMany(ctx, &an5client.UserFindManyArgs{
        Where: &an5client.UserWhereInput{
            Email: &an5client.StringFilter{Contains: "@example.com"},
        },
        Take: 10,
    })
    fmt.Printf("Retrieved %d users\n", len(users))
}
```

---

## 5. Rust

### Output & Setup
Generated under `an5Client/rust/src/`:
* `models.rs`: Serde-deriving model structs.
* `filters.rs`: Type-safe filter builders.
* `client.rs`: Async client with runtime adapter binding.

### Usage
```rust
use an5_client::{An5Client, UserCreateInput, UserFindManyArgs, StringFilter};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let db = An5Client::from_env().await?;

    // Create
    let user = db.user().create(UserCreateInput {
        email: "eve@example.com".to_string(),
        name: Some("Eve".to_string()),
    }).await?;

    // Find Many
    let users = db.user().find_many(UserFindManyArgs {
        where_clause: Some(UserWhereInput {
            email: Some(StringFilter { contains: Some("@example.com".to_string()), ..Default::default() }),
            ..Default::default()
        }),
        take: Some(10),
        ..Default::default()
    }).await?;

    println!("Found {} users", users.len());
    Ok(())
}
```
