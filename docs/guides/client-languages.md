---
layout: page
title: Client Languages
description: Complete reference for AN5 ORM multi-language client runtimes across TypeScript, Python, .NET (C#), Go, Rust, Java, Kotlin, and Swift.
---

{% assign code = page.docs_code | default: 'typescript' %}
{% assign provider = page.docs_provider | default: 'sqlite' %}

# Client Languages

<p class="guide-note">
  <strong>Active Language:</strong> You are currently viewing documentation targeting <strong>{{ code | capitalize }}</strong>.
  The setup instructions, client model generation, and API query patterns below are aligned with your selection.
</p>

AN5 ORM generates native, type-safe client libraries from a single `.an5` schema across **TypeScript**, **Python**, **.NET (C#)**, **Go**, **Rust**, **Java**, **Kotlin**, and **Swift**.

---

## Language Ecosystem Overview

| Language | Client Package | Generated Directory | Generated Classes / Structs | Query API Style |
|---|---|---|---|---|
| **TypeScript** | `@an5/adapters` | `an5Client/typescript/` | Proxy Model Client (`db.user`) | Prisma-like async/await |
| **Python** | `an5-client` | `an5Client/python/` | Dataclasses + `An5Client` | Pythonic snake_case methods |
| **.NET (C#)** | `An5.Adapters` | `an5Client/dotnet/` | Entity Classes + `An5DbContext` | Async task-based methods |
| **Go** | `an5client` | `an5Client/golang/` | Structs + `TableClient[T]` | Context-first type-safe API |
| **Rust** | `an5-client` | `an5Client/rust/` | Serde Models + `An5Client` | Strongly-typed async futures |
| **Java** | `@an5/adapters` | `an5Client/java/` | JavaBeans + `An5DbContext` | JDBC, `ModelClient<T>` |
| **Kotlin** | `@an5/adapters` | `an5Client/kotlin/` | Data classes + `An5Db` | Query blocks, nullable reads |
| **Swift** | `@an5/adapters` | `an5Client/swift/` | Structs + `An5Db` | Throwing methods, `Row` reads |

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

---

## 6. Java

The Java client is plain sources with no runtime dependency beyond JDBC, which is the point:
it drops into any build without a framework and stays readable on Android, where a heavier
client would be a problem.

### Package & Setup
```bash
npm install @an5/adapters @an5/orm
```

Add `an5Adapters/java/src/main/java` and `an5Client/java` to your source root, and the JDBC
driver for your database (`org.xerial:sqlite-jdbc`, `org.postgresql:postgresql`, or
`com.microsoft.sqlserver:mssql-jdbc`). `an5Adapters/java` ships its own `pom.xml`, so
Maven and Gradle can resolve it as a module instead. The runtime itself has no dependencies
at all — which is what lets one adapter serve all three engines, and what keeps it usable on
Android.

Releases publish it to Maven Central as `org.an5orm:an5-adapters-java`; until the first one
lands, install it from a checkout (`mvn -f an5Adapters/java/pom.xml install`), which is what
the Kotlin module's `mavenLocal()` also resolves.

### Initialization & CRUD
```java
import an5.client.An5Config;
import an5.client.An5DbContext;
import an5.client.An5OrmTypes.Filters;
import an5.client.User;

import java.util.LinkedHashMap;
import java.util.Map;

try (An5DbContext db = new An5DbContext(An5Config.connectionString())) {
    // Create — a model with an @id column gets a generated key
    Map<String, Object> values = new LinkedHashMap<>();
    values.put("email", "eve@example.com");
    values.put("name", "Eve");
    User eve = db.getUser().create(new User().withEmail("eve@example.com").withName("Eve"));

    // Find many, with the filter tree the adapter's SQL builder reads
    Map<String, Object> filter = new LinkedHashMap<>();
    filter.put("email", Filters.contains("@example.com"));
    db.getUser().findMany(new an5.adapters.An5Query().where(filter).take(10));

    // Count, update, delete
    long active = db.getUser().count(null);
    db.getUser().updateMany(null, Map.of("score", Filters.gte(1)));
    db.getUser().deleteMany(null);

    // Raw SQL and transactions
    db.queryRaw("SELECT TOP 10 * FROM [dbo].[users]");
    db.transaction(scoped -> {
        scoped.table("Post").create(Map.of("userId", eve.getId(), "title", "Hello"));
        return null;
    });
}
```

Models are mutable JavaBeans with getters, setters and a fluent `with…`, and every column is
read through `An5Values` rather than cast — a JDBC driver may hand an `INT` back as `Integer`
or `Long`, and a `NUMERIC` column still arrives as `BigDecimal`.

---

## 7. Kotlin

The Kotlin runtime is a typed front door over the same JVM adapter, so the dialect rules and
the query builder exist once. Models are data classes and the filters read the way Kotlin
reads.

### Package & Setup
```bash
npm install @an5/adapters @an5/orm
```

`an5Adapters/kotlin` ships a `build.gradle.kts` and depends on the Java runtime rather than
reimplementing it, so the dialect rules and the where builder exist once — a filter that
means one thing in Java cannot mean another in Kotlin. Releases publish it to Maven Central
as `org.an5orm:an5-adapters-kotlin`; from a checkout, `mvn -f an5Adapters/java/pom.xml
install` puts the Java runtime in `~/.m2` where `mavenLocal()` finds it, then
`gradle -p an5Adapters/kotlin build` runs the whole module, smoke included.

### Initialization & CRUD
```kotlin
import an5.adapters.eq
import an5.adapters.gte
import an5.adapters.contains
import an5.client.An5Config
import an5.client.An5Db
import an5.client.User

An5Db(An5Config.connectionString()).use { db ->
    // Create
    val eve = db.user.create(User(email = "eve@example.com", name = "Eve"))

    // Find many, with a query block
    val adults = db.user.findMany {
        where("score" gte 10)
        where("email" contains "@example.com")
        orderBy("name", Sort.ASC)
        take(10)
    }

    // Typed reads: a NULL column stays null instead of becoming 0
    adults.firstOrNull { it.name == "Eve" }?.let { println(it.id) }

    // Count, update, delete
    val total = db.user.count()
    db.user.updateMany(mapOf("name" eq "Eve"), eve.copy(score = 10))
    db.user.deleteMany()

    // Relations
    val withPosts = db.user.findMany { include(mapOf("posts" to true)) }

    // Transactions
    db.transaction { scoped ->
        scoped.table("Post").create(mapOf("userId" to eve.id!!, "title" to "Hello"))
    }
}
```

Every property is nullable and defaults to `null`, because `update` and `upsert` take a
partly filled value and an untouched property has to stay out of the statement.

---

## 8. Swift

Swift reads and writes the on-device SQLite that every Apple platform already ships with —
no bundled engine, no extra binary, and the same file on device and in a simulator. The
runtime links the system `libsqlite3`, so the only build requirement is SQLite's headers.

### Package & Setup

The generated client is a SwiftPM package, so an app depends on it directly. SwiftPM has no
way to point a target at an arbitrary directory the way a csproj or a go.mod does, which is
why `an5Client/swift` emits a `Package.swift` and keeps its sources under
`Sources/An5Client/` rather than shipping loose files.

```swift
// Package.swift of the app
dependencies: [
    .package(url: "https://github.com/an5ORM/an5Adapters.git", from: "0.2.11"),
    .package(path: "../an5Client/swift"),
]
targets: [
    .target(name: "AppData", dependencies: [
        .product(name: "An5Client", package: "An5Client"),
    ])
]
```

Building the runtime needs SQLite's headers (`apt-get install libsqlite3-dev` on Linux);
there is nothing to bundle, because every Apple platform already ships SQLite.

### Initialization & CRUD
```swift
import An5Adapters
import AppDataModels

let db = try An5Db(path: documentsDirectory + "/app.sqlite")

// Create — a model with an @id column gets a generated key
var eve = User(email: "eve@example.com", name: "Eve")
eve = try db.user.create(eve)

// Find many
let adults = try db.user.findMany(Query(filter: [
    "score": An5Orm.NumberFilter.atLeast(10),
    "email": An5Orm.StringFilter.has("@example.com"),
], orderBy: [["name": "asc"]], take: 10))

// Relations and eager loading
var query = Query()
query.include = ["posts": true, "_count": true]
let withPosts = try db.user.findMany(query)
print(withPosts.first?.relationCount("posts") ?? 0)

// Transactions, which roll back on any thrown error
try db.transaction { scoped in
    try scoped.table("Post").create(["userId": eve.id ?? "", "title": "Hello"])
}

// Reads and writes that never leave the device
let hits = try db.document.vectorSearch([1.0, 0.0], take: 5)
```

Models are structs with an explicit `init(row:)`, and every column is read through a typed
accessor — a `BOOL` arrives as an `Int` from one driver and a `Bool` from another, and a
`NUMERIC` that fits in an `Int` still arrives as a `Decimal`.
