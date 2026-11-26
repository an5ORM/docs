---
layout: page
title: CRUD Operations
description: Create, Read, Update, and Delete data with an5 ORM across all supported client languages
---

{% assign code = page.docs_code | default: 'typescript' %}
{% assign provider = page.docs_provider | default: 'sqlite' %}

# CRUD Operations

AN5 ORM provides a clean, type-safe API for all CRUD operations tailored for **{{ code | capitalize }}**.

---

## Client Setup

{% case code %}
{% when 'typescript' %}
```typescript
import { createAn5Adapter } from '@an5/adapters';

const db = createAn5Adapter({
  connectionString: process.env.DATABASE_URL!,
});
```

{% when 'python' %}
```python
from an5_client import An5Client

db = An5Client()  # automatically connects to DATABASE_URL
```

{% when 'dotnet' %}
```csharp
using System;
using System.Collections.Generic;
using An5Orm;
using An5Orm.Entities;

var db = new An5DbContext();  // synchronous, reads DATABASE_URL
```

{% when 'golang' %}
```go
import (
    "context"
    "database/sql"
    "log"

    _ "github.com/mattn/go-sqlite3"
    "an5client"
)

connStr := an5client.GetDefaultConnectionString()
conn, err := sql.Open("sqlite3", connStr)
if err != nil {
    log.Fatal(err)
}
defer conn.Close()

ctx := context.Background()
db := an5client.NewAn5DbContextWithConnStr(conn, connStr)
```

{% when 'rust' %}
```rust
use an5_client::{
    An5Client, SortOrder, StringFilter, UserCreateInput, UserFindFirstArgs,
    UserFindManyArgs, UserFindUniqueArgs, UserOrderByInput, UserUpdateArgs,
    UserUpdateInput, UserWhereInput,
};

let conn_str = std::env::var("DATABASE_URL")?;
let db = An5Client::connect(&conn_str).await?;
```

{% when 'java' %}
```java
import an5.client.An5DbContext;
import an5.client.An5OrmTypes.BoolFilter;
import an5.client.An5OrmTypes.StringFilter;
import an5.client.An5OrmTypes.UserWhere;
import an5.client.User;

An5DbContext db = new An5DbContext(System.getenv("DATABASE_URL"));
```

`An5DbContext` implements `AutoCloseable`, so `try (An5DbContext db = new An5DbContext(...))`
closes the connection when the block ends.

{% when 'kotlin' %}
```kotlin
import an5.client.An5Db
import an5.client.An5Orm
import an5.client.User

val db = An5Db(System.getenv("DATABASE_URL"))
```

`An5Db` implements `AutoCloseable`; `An5Db(url).use { db -> ... }` closes it when the
block returns.

{% when 'swift' %}
```swift
import An5Client

let db = try An5Db(connectionString: try An5Config.connectionString())
```

`An5Config` reads `AN5_DATABASE_URL`; `An5Db(path:)` opens a file directly. Both are
reference types that live as long as the process.
{% endcase %}

---

## 1. Create

### Create a Single Record

{% case code %}
{% when 'typescript' %}
```typescript
const user = await db.user.create({
  data: {
    email: 'john@example.com',
    name: 'John Doe'
  }
});
console.log(user);
```

{% when 'python' %}
```python
user = db.user.create(data={
    "email": "john@example.com",
    "name": "John Doe"
})
print("Created user:", user)
```

{% when 'dotnet' %}
```csharp
var user = db.User.Create(new User
{
    Id = Guid.NewGuid().ToString(),
    Email = "john@example.com",
    Name = "John Doe"
});
```

{% when 'golang' %}
```go
user, err := db.User.Create(ctx, &an5client.User{
    Id:    "u-1",
    Email: "john@example.com",
    Name:  an5client.StringPtr("John Doe"),
})
```

{% when 'rust' %}
```rust
let user = db.user().create(&UserCreateInput {
    email: "john@example.com".to_string(),
    name: Some("John Doe".to_string()),
    created_at: None,
}).await?;
```

{% when 'java' %}
```java
User user = db.getUser().create(
    new User().withEmail("john@example.com").withName("John Doe"));
System.out.println(user.getId());
```

{% when 'kotlin' %}
```kotlin
val user = db.user.create(User(email = "john@example.com", name = "John Doe"))
println(user.id)
```

{% when 'swift' %}
```swift
let user = try db.user.create(User(email: "john@example.com", name: "John Doe"))
print(user.id ?? "unknown")
```
{% endcase %}

### Create Many Records

{% case code %}
{% when 'typescript' %}
```typescript
const result = await db.user.createMany({
  data: [
    { email: 'alice@example.com', name: 'Alice' },
    { email: 'bob@example.com', name: 'Bob' },
  ]
});
console.log(`Created ${result.count} users`);
```

{% when 'python' %}
```python
# Batch creation in Python
users = [
    db.user.create(data={"email": "alice@example.com", "name": "Alice"}),
    db.user.create(data={"email": "bob@example.com", "name": "Bob"}),
]
```

{% when 'dotnet' %}
```csharp
var count = db.User.CreateMany(new List<User>
{
    new() { Id = Guid.NewGuid().ToString(), Email = "alice@example.com", Name = "Alice" },
    new() { Id = Guid.NewGuid().ToString(), Email = "bob@example.com", Name = "Bob" }
});
```

{% when 'golang' %}
```go
count, err := db.User.CreateMany(ctx, []*an5client.User{
    {Id: "u-alice", Email: "alice@example.com", Name: an5client.StringPtr("Alice")},
    {Id: "u-bob", Email: "bob@example.com", Name: an5client.StringPtr("Bob")},
})
```

{% when 'rust' %}
```rust
for input in &[
    UserCreateInput { email: "alice@example.com".into(), name: Some("Alice".into()), created_at: None },
    UserCreateInput { email: "bob@example.com".into(), name: Some("Bob".into()), created_at: None },
] {
    db.user().create(input).await?;
}
```

{% when 'java' %}
```java
import java.util.Arrays;

int created = db.getUser().createMany(Arrays.asList(
    new User().withEmail("alice@example.com").withName("Alice"),
    new User().withEmail("bob@example.com").withName("Bob")), false);
System.out.println("Created " + created + " users");
```

The second argument is `skipDuplicates`.

{% when 'kotlin' %}
```kotlin
val created = db.user.createMany(listOf(
    User(email = "alice@example.com", name = "Alice"),
    User(email = "bob@example.com", name = "Bob"),
))
println("Created $created users")
```

`skipDuplicates` defaults to `false`.

{% when 'swift' %}
```swift
let created = try db.user.createMany([
    User(email: "alice@example.com", name: "Alice"),
    User(email: "bob@example.com", name: "Bob"),
])
print("Created \(created) users")
```

`skipDuplicates` defaults to `false`.
{% endcase %}

---

## 2. Read

### Find by Primary Key or Unique Field

{% case code %}
{% when 'typescript' %}
```typescript
const user = await db.user.findUnique({
  where: { email: 'john@example.com' }
});
```

{% when 'python' %}
```python
user = db.user.find_first(
    where={"email": "john@example.com"}
)
```

{% when 'dotnet' %}
```csharp
var user = db.User.FindFirst(new UserFindFirstArgs
{
    Where = new UserWhereInput
    {
        Email = new StringFilter { Equals = "john@example.com" }
    }
});

// Or fetch directly by primary key:
var byId = db.User.FindUnique(userId);
```

{% when 'golang' %}
```go
user, err := db.User.FindFirst(ctx, &an5client.UserFindFirstArgs{
    Where: &an5client.UserWhereInput{
        Email: &an5client.StringFilter{Equals: an5client.StringPtr("john@example.com")},
    },
})
```

{% when 'rust' %}
```rust
let user = db.user().find_first(&UserFindFirstArgs {
    where_: Some(UserWhereInput {
        email: Some(StringFilter {
            equals: Some("john@example.com".into()),
            ..Default::default()
        }),
        ..Default::default()
    }),
    ..Default::default()
}).await?;
```

{% when 'java' %}
```java
UserWhere where = new UserWhere();
where.Email = StringFilter.is("john@example.com");

User user = db.getUser().findUnique(where.toMap());
```

`findUnique` returns `null` when nothing matches. The typed where also exposes
`and`, `or` and `not` for nesting.

{% when 'kotlin' %}
```kotlin
val user = db.user.findUnique(
    An5Orm.UserWhere(email = An5Orm.StringFilter.`is`("john@example.com")).build()
)
```

`build()` turns the typed where into the map the runtime reads; unset filters are
left out of it.

{% when 'swift' %}
```swift
var byEmail = An5Orm.UserWhere()
byEmail.email = An5Orm.StringFilter.`is`("john@example.com")

let user = try db.user.findUnique(filter: byEmail.build())
```

`findUnique` returns `nil` when nothing matches.
{% endcase %}

### Find Many Records with Filter & Sort

{% case code %}
{% when 'typescript' %}
```typescript
const users = await db.user.findMany({
  where: {
    isActive: true,
    email: { contains: '@example.com' }
  },
  orderBy: { createdAt: 'desc' },
  skip: 0,
  take: 10
});
```

{% when 'python' %}
```python
users = db.user.find_many(
    where={
        "isActive": True,
        "email": {"contains": "@example.com"}
    },
    order_by={"createdAt": "desc"},
    skip=0,
    take=10,
)
```

The Python adapter resolves both schema field names (`isActive`, `createdAt`)
and `snake_case` aliases (`is_active`, `created_at`) through generated metadata,
accepts typed filter/args dataclasses from `an5_orm_types.py` (such as
`UserWhereInput`, `StringFilter`, `UserOrderByInput`, and `UserFindManyArgs`),
and raises `ValueError` on unknown field or operator keys.

{% when 'dotnet' %}
```csharp
var users = db.User.FindMany(new UserFindManyArgs
{
    Where = new UserWhereInput
    {
        Email = new StringFilter { Contains = "@example.com", Mode = "insensitive" }
    },
    OrderBy = new UserOrderByInput { CreatedAt = "desc" },
    Skip = 0,
    Take = 10
});
```

{% when 'golang' %}
```go
users, err := db.User.FindMany(ctx, &an5client.UserFindManyArgs{
    Where: &an5client.UserWhereInput{
        Email: &an5client.StringFilter{
            Contains: an5client.StringPtr("@example.com"),
            Mode:     "insensitive",
        },
    },
    OrderBy: &an5client.UserOrderByInput{
        CreatedAt: an5client.SortOrderPtr(an5client.SortOrderDesc),
    },
    Take: an5client.IntPtr(10),
})
```

{% when 'rust' %}
```rust
let users = db.user().find_many(&UserFindManyArgs {
    where_: Some(UserWhereInput {
        email: Some(StringFilter {
            contains: Some("@example.com".into()),
            mode: Some("insensitive".into()),
            ..Default::default()
        }),
        ..Default::default()
    }),
    order_by: Some(UserOrderByInput {
        created_at: Some(SortOrder::Desc),
        ..Default::default()
    }),
    take: Some(10),
    ..Default::default()
}).await?;
```

{% when 'java' %}
```java
import an5.adapters.An5Query;

UserWhere where = new UserWhere();
where.IsActive = BoolFilter.is(true);
where.Email = StringFilter.has("@example.com");

List<User> users = db.getUser().findMany(new An5Query()
    .where(where.toMap())
    .orderBy("createdAt", "desc")
    .skip(0)
    .take(10));
```

One `An5Query` carries the whole call: `where`, `orderBy`, `skip`, `take`, `select`
and `include` chain onto it.

{% when 'kotlin' %}
```kotlin
import an5.adapters.Sort

val users = db.user.findMany {
    where(
        An5Orm.UserWhere(
            isActive = An5Orm.BoolFilter.`is`(true),
            email = An5Orm.StringFilter.has("@example.com"),
        ).build()
    )
    orderBy("createdAt", Sort.DESC)
    skip(0)
    take(10)
}
```

`findMany { ... }` takes a `QueryBuilder` lambda, so the query reads top to bottom.

{% when 'swift' %}
```swift
var active = An5Orm.UserWhere()
active.isActive = An5Orm.BoolFilter.`is`(true)
active.email = An5Orm.StringFilter.has("@example.com")

let users = try db.user.findMany(Query(
    filter: active.build(),
    orderBy: [["createdAt": "desc"]],
    skip: 0,
    take: 10
))
```

`Query` is a value: filter, sort, paging and projection are all arguments to it.
{% endcase %}

---

## 3. Update

### Update Single Record

{% case code %}
{% when 'typescript' %}
```typescript
const updated = await db.user.update({
  where: { id: user.id },
  data: { name: 'Johnny Doe' }
});
```

{% when 'python' %}
```python
updated = db.user.update(
    where={"id": user["id"]},
    data={"name": "Johnny Doe"}
)
```

{% when 'dotnet' %}
```csharp
user.Name = "Johnny Doe";
var updated = db.User.Update(user);

// Or update matching rows with a filter:
var count = db.User.UpdateMany(
    new UserWhereInput { Id = new StringFilter { Equals = user.Id } },
    new Dictionary<string, object> { ["name"] = "Johnny Doe" });
```

{% when 'golang' %}
```go
user.Name = an5client.StringPtr("Johnny Doe")
updated, err := db.User.Update(ctx, user)

// Or update matching rows with a filter:
count, err := db.User.UpdateMany(
    ctx,
    &an5client.UserWhereInput{Id: &an5client.StringFilter{Equals: &user.Id}},
    map[string]interface{}{"name": "Johnny Doe"},
)
```

{% when 'rust' %}
```rust
let affected = db.user().update(&UserUpdateArgs {
    where_: Some(UserWhereInput {
        id: Some(StringFilter { equals: user.id.clone(), ..Default::default() }),
        ..Default::default()
    }),
    data: UserUpdateInput {
        name: Some("Johnny Doe".into()),
        ..Default::default()
    },
}).await?;
```

{% when 'java' %}
```java
UserWhere byId = new UserWhere();
byId.Id = StringFilter.is(user.getId());

User updated = db.getUser().update(byId.toMap(),
    new User().withName("Johnny Doe"));
```

Columns left out of the value are left out of the statement, so they keep their
current value.

{% when 'kotlin' %}
```kotlin
val id = checkNotNull(user.id) { "create did not return a generated id" }

val updated = db.user.update(
    An5Orm.UserWhere(id = An5Orm.StringFilter.`is`(id)).build(),
    User(name = "Johnny Doe"),
)
```

Every property of `User` is nullable and defaults to `null`, which is what keeps an
unset column out of the statement.

{% when 'swift' %}
```swift
var byId = An5Orm.UserWhere()
byId.id = An5Orm.StringFilter.`is`(user.id)

let updated = try db.user.update(
    filter: byId.build(),
    data: User(name: "Johnny Doe")
)
```

Columns left out of `data` are left out of the statement.
{% endcase %}

---

## 4. Delete

### Delete Single Record

{% case code %}
{% when 'typescript' %}
```typescript
await db.user.delete({
  where: { id: user.id }
});
```

{% when 'python' %}
```python
db.user.delete(where={"id": user["id"]})
```

{% when 'dotnet' %}
```csharp
var deleted = db.User.Delete(user.Id);

// Or delete matching rows with a filter:
var removed = db.User.DeleteMany(new UserDeleteManyArgs
{
    Where = new UserWhereInput { Id = new StringFilter { Equals = user.Id } }
});
```

{% when 'golang' %}
```go
deleted, err := db.User.Delete(ctx, user.Id)

// Or delete matching rows with a filter:
removed, err := db.User.DeleteMany(ctx, &an5client.UserDeleteManyArgs{
    Where: &an5client.UserWhereInput{Id: &an5client.StringFilter{Equals: &user.Id}},
})
```

{% when 'rust' %}
```rust
db.user().delete(&UserFindUniqueArgs {
    where_: Some(UserWhereInput {
        id: Some(StringFilter { equals: user.id.clone(), ..Default::default() }),
        ..Default::default()
    }),
}).await?;
```

{% when 'java' %}
```java
UserWhere byId = new UserWhere();
byId.Id = StringFilter.is(user.getId());

db.getUser().delete(byId.toMap());
```

The deleted row comes back, or `null` when nothing matched. `deleteMany(where)`
counts rows instead.

{% when 'kotlin' %}
```kotlin
val id = checkNotNull(user.id) { "create did not return a generated id" }

db.user.delete(An5Orm.UserWhere(id = An5Orm.StringFilter.`is`(id)).build())
```

`deleteMany(where)` returns how many rows went away.

{% when 'swift' %}
```swift
var byId = An5Orm.UserWhere()
byId.id = An5Orm.StringFilter.`is`(user.id)

_ = try db.user.delete(filter: byId.build())
```

`deleteMany(filter:)` returns how many rows went away.
{% endcase %}

---

## Next Steps

- [Advanced Queries]({{ '/guides/queries/' | relative_url }}) - In-depth filtering, pagination, and aggregation
- [Relations & Joins]({{ '/guides/relations/' | relative_url }}) - One-to-many and many-to-many relations
- [Database Providers]({{ '/guides/providers/' | relative_url }}) - Provider dialect specifics
- [Client Languages]({{ '/guides/client-languages/' | relative_url }}) - Complete language runtime specifications
