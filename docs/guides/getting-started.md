---
layout: page
title: Getting Started
description: Install and set up an5 in your project with support for all languages and providers
---

{% assign code = page.docs_code | default: 'typescript' %}
{% assign provider = page.docs_provider | default: 'sqlite' %}

# Getting Started

This guide will help you set up an5 in your project in under 5 minutes for **{{ code | capitalize }}** with **{{ provider | capitalize }}**.

For the current implementation and package maturity overview, see [Feature Status]({{ '/guides/feature-status/' | relative_url }}).

## Prerequisites

- Node.js 18+ (Node 24 recommended for schema compiler and CLI)
{% case code %}
{% when 'python' %}- Python 3.9+ (`pip` or `poetry`)
{% when 'dotnet' %}- .NET 8.0 SDK or later
{% when 'golang' %}- Go 1.21+
{% when 'rust' %}- Rust 1.75+ (Cargo)
{% when 'java' %}- JDK 8+ with Maven or Gradle
{% when 'kotlin' %}- JDK 8+ with the Kotlin toolchain (Gradle)
{% when 'swift' %}- Swift 5.9+ (Xcode 15+)
{% else %}- TypeScript 5.0+ and npm / pnpm / yarn
{% endcase %}
- Connection to {{ provider | capitalize }} (or local embedded setup)

## Installation

{% case code %}
{% when 'typescript' %}
```bash
npm install @an5/adapters @an5/orm
```
- `@an5/adapters`: Database runtime, connection handling, dynamic table clients, transactions.
- `@an5/orm`: Schema parser, multi-language generator, migrations (`db:push`, `db:pull`, `db:migrate`, `db:seed`).

{% when 'python' %}
```bash
# Generated Python client runs alongside your app
pip install pydantic python-dotenv
```
Generate your client using `npm run generate` from `an5Orm/`.

{% when 'dotnet' %}
```bash
# Add AN5 ADO.NET and ORM abstractions
dotnet add package Microsoft.Data.SqlClient
```
Generate your C# entities and `An5DbContext` using `npm run generate`.

{% when 'golang' %}
```bash
# Standard database drivers
go get github.com/mattn/go-sqlite3
```
Generate Go structs and table clients with `npm run generate`.

{% when 'rust' %}
```toml
# In Cargo.toml
[dependencies]
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
chrono = { version = "0.4", features = ["serde"] }
```
Generate Rust client modules with `npm run generate`.

{% when 'java' %}
```xml
<!-- pom.xml -->
<dependency>
  <groupId>io.github.an5orm</groupId>
  <artifactId>an5-adapters-java</artifactId>
  <version>0.2.13</version>
</dependency>
```
Generate the typed Java client (`An5DbContext`, entities, filters) with `npm run generate`.

{% when 'kotlin' %}
```kotlin
// build.gradle.kts
dependencies {
    implementation("io.github.an5orm:an5-adapters-kotlin:0.2.13")
}
```
Generate the typed Kotlin client with `npm run generate`.

{% when 'swift' %}
```swift
// Package.swift
dependencies: [
    // The runtime SwiftPM package is the `swift/` directory inside the
    // an5ORM/an5Adapters repository. SwiftPM takes a package's identity from the
    // last path component, so this one is identified as `swift` — and the
    // generated client ships in a directory with that same name, which would
    // make the two resolve to one package. Put the generated client under a
    // different directory name (a copy or a symlink is enough):
    //
    //   git clone https://github.com/an5ORM/an5Adapters.git Vendor/an5-adapters
    //   ln -s "$PWD/an5Client/swift" Vendor/an5-client
    .package(path: "Vendor/an5-adapters/swift"),
    .package(path: "Vendor/an5-client"),
],
targets: [
    .executableTarget(
        name: "App",
        dependencies: [
            .product(name: "An5Adapters", package: "swift"),
            .product(name: "An5Client", package: "an5-client"),
        ]),
]
```
There is no tagged SwiftPM release to point a URL dependency at yet: the runtime
lives in a subdirectory of that repository rather than at its root, and the
repository carries no matching tag. Depend on it by path as above. Generate the
typed Swift client with `npm run generate`; see
[Feature Status]({{ '/guides/feature-status/' | relative_url }}) for the packaging gap.
{% endcase %}

## Configuration

### 1. Set up Environment Variables

Edit `.env` and configure your database connection string:

```ini
{% case provider %}
{% when 'postgresql' %}
DATABASE_URL=postgres://user:password@localhost:5432/mydb?sslmode=disable
{% when 'sqlserver' %}
DATABASE_URL=sqlserver://localhost:1433;database=mydb;user=sa;password=yourpassword;trustServerCertificate=true
{% when 'mysql' %}
DATABASE_URL=mysql://root:password@localhost:3306/mydb
{% when 'sqlite' %}
DATABASE_URL=sqlite://./dev.db
{% when 'googlesheets' %}
DATABASE_URL=googlesheets://spreadsheet_id?credentials=./service-account.json
{% when 'nbase' %}
DATABASE_URL=nbase://localhost:1307
{% endcase %}
```

### 2. Define Your Schema

Create `.an5` files in the `an5Schema/` directory:

```an5
// an5Schema/User.an5
model User {
  id        NVARCHAR(1000) @id @default(uuid())
  email     NVARCHAR(255)  @unique
  name      NVARCHAR(255)?
  createdAt DATETIME2      @default(now())
  
  @@map("users")
}
```

### 3. Generate Client Code

Run from the `an5Orm/` repository directory:

```bash
npm run generate
```

This generates type-safe client code in `an5Client/{{ code }}/`.

### 4. Push Schema to Database

```bash
npm run db:push
```

This creates the tables in your database.

## Your First Query

{% case code %}
{% when 'typescript' %}
```typescript
import { createAn5Adapter } from '@an5/adapters';

// Initialize connection
const db = createAn5Adapter({
  connectionString: process.env.DATABASE_URL!,
});

async function main() {
  await db.$connect();

  // Create a user
  const user = await db.user.create({
    data: {
      email: 'john@example.com',
      name: 'John Doe'
    }
  });
  
  console.log('Created user:', user);
  
  // Find all users
  const users = await db.user.findMany();
  console.log('All users:', users);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
```

{% when 'python' %}
```python
import os
from an5_client import An5Client

# Initialize client (reads DATABASE_URL)
db = An5Client(connection_string=os.getenv("DATABASE_URL"))

def main():
    # Create a user
    user = db.user.create(data={
        "email": "john@example.com",
        "name": "John Doe"
    })
    print("Created user:", user)

    # Find all users
    users = db.user.find_many()
    print("All users:", users)

if __name__ == "__main__":
    main()
```

{% when 'dotnet' %}
```csharp
using System;
using System.Threading.Tasks;
using An5Orm;

class Program
{
    static async Task Main()
    {
        var db = new An5DbContext();

        // Create a user
        var user = await db.Users.CreateAsync(new UserCreateInput
        {
            Email = "john@example.com",
            Name = "John Doe"
        });
        Console.WriteLine($"Created user: {user.Id}");

        // Find all users
        var users = await db.Users.FindManyAsync(new UserFindManyArgs());
        Console.WriteLine($"Found {users.Count} users");
    }
}
```

{% when 'golang' %}
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

    // Create a user
    user, err := db.User.Create(ctx, &an5client.UserCreateInput{
        Email: "john@example.com",
        Name:  "John Doe",
    })
    if err != nil {
        panic(err)
    }
    fmt.Printf("Created user: %+v\n", user)

    // Find all users
    users, err := db.User.FindMany(ctx, &an5client.UserFindManyArgs{})
    if err != nil {
        panic(err)
    }
    fmt.Printf("Retrieved %d users\n", len(users))
}
```

{% when 'rust' %}
```rust
use an5_client::{An5Client, UserCreateInput, UserFindManyArgs};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let db = An5Client::from_env().await?;

    // Create a user
    let user = db.user().create(UserCreateInput {
        email: "john@example.com".to_string(),
        name: Some("John Doe".to_string()),
    }).await?;
    println!("Created user: {:?}", user);

    // Find all users
    let users = db.user().find_many(UserFindManyArgs::default()).await?;
    println!("Found {} users", users.len());

    Ok(())
}
```

{% when 'java' %}
```java
import an5.client.An5DbContext;
import an5.client.User;

public class Main {
  public static void main(String[] args) throws Exception {
    try (An5DbContext db = new An5DbContext(System.getenv("DATABASE_URL"))) {
      User user = db.getUser().create(
          new User().withEmail("john@example.com").withName("John Doe"));
      System.out.println("Created user: " + user.getId());

      System.out.println("Found " + db.getUser().findMany().size() + " users");
    }
  }
}
```

{% when 'kotlin' %}
```kotlin
import an5.client.An5Db
import an5.client.User

fun main() {
    An5Db(System.getenv("DATABASE_URL")).use { db ->
        val user = db.user.create(User(email = "john@example.com", name = "John Doe"))
        println("Created user: ${user.id}")

        println("Found ${db.user.findMany().size} users")
    }
}
```

{% when 'swift' %}
```swift
import An5Client

let db = try An5Db(connectionString: try An5Config.connectionString())

let user = try db.user.create(User(email: "john@example.com", name: "John Doe"))
print("Created user: \(user.id ?? "unknown")")

let users = try db.user.findMany()
print("Found \(users.count) users")
```
{% endcase %}

## Project Structure

```text
an5/
├── an5Schema/           # Schema definitions (.an5 files)
├── an5Client/           # Generated client code for all target languages
│   ├── typescript/
│   ├── python/
│   ├── dotnet/
│   ├── golang/
│   ├── rust/
│   ├── java/
│   ├── kotlin/
│   └── swift/
├── an5Orm.config.js     # ORM configuration & database mapping
└── .env                 # Environment variables & connection strings
```

## Available Commands

Schema/database commands run from the `an5Orm/` repository directory:

| Command | Where | Description |
|---------|-------|-------------|
| `npm run generate` | `an5Orm/` | Generate client code from schema |
| `npm run db:push` | `an5Orm/` | Push schema to database |
| `npm run db:pull` | `an5Orm/` | Pull schema from database |
| `npm run db:seed` | `an5Orm/` | Seed database with sample data |
| `npm run db:migrate diff` | `an5Orm/` | Compare schema with database |
| `npm run db:migrate:generate` | `an5Orm/` | Generate migration SQL |
| `npm run db:migrate:apply` | `an5Orm/` | Apply pending migration files |
| `npm run db:migrate:rollback` | `an5Orm/` | Roll back migrations |
| `npm run db:migrate:status` | `an5Orm/` | Show migration status |

## Next Steps

- [Database Providers]({{ '/guides/providers/' | relative_url }}) - Comprehensive guide for all 6 database providers
- [Client Languages]({{ '/guides/client-languages/' | relative_url }}) - Multi-language client generation reference
- [CRUD Operations]({{ '/guides/crud/' | relative_url }}) - Create, read, update, and delete data
- [Schema Definition]({{ '/guides/schema/' | relative_url }}) - Learn how to define your data models
