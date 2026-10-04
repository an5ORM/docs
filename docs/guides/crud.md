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
using An5Orm;

var db = new An5DbContext();
```

{% when 'golang' %}
```go
import (
    "context"
    "os"
    "an5client"
)

ctx := context.Background()
db, err := an5client.NewAn5DbContext(ctx, os.Getenv("DATABASE_URL"))
```

{% when 'rust' %}
```rust
use an5_client::{An5Client, UserCreateInput, UserFindManyArgs};

let db = An5Client::from_env().await?;
```
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
var user = await db.Users.CreateAsync(new UserCreateInput
{
    Email = "john@example.com",
    Name = "John Doe"
});
```

{% when 'golang' %}
```go
user, err := db.User.Create(ctx, &an5client.UserCreateInput{
    Email: "john@example.com",
    Name:  "John Doe",
})
```

{% when 'rust' %}
```rust
let user = db.user().create(UserCreateInput {
    email: "john@example.com".to_string(),
    name: Some("John Doe".to_string()),
}).await?;
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
var count = await db.Users.CreateManyAsync(new List<UserCreateInput>
{
    new() { Email = "alice@example.com", Name = "Alice" },
    new() { Email = "bob@example.com", Name = "Bob" }
});
```

{% when 'golang' %}
```go
count, err := db.User.CreateMany(ctx, []*an5client.UserCreateInput{
    {Email: "alice@example.com", Name: "Alice"},
    {Email: "bob@example.com", Name: "Bob"},
})
```

{% when 'rust' %}
```rust
for input in vec![
    UserCreateInput { email: "alice@example.com".into(), name: Some("Alice".into()) },
    UserCreateInput { email: "bob@example.com".into(), name: Some("Bob".into()) },
] {
    db.user().create(input).await?;
}
```
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
var user = await db.Users.FindFirstAsync(new UserFindFirstArgs
{
    Where = new UserWhereInput { Email = new StringFilter { Equals = "john@example.com" } }
});
```

{% when 'golang' %}
```go
user, err := db.User.FindFirst(ctx, &an5client.UserFindFirstArgs{
    Where: &an5client.UserWhereInput{
        Email: &an5client.StringFilter{Equals: "john@example.com"},
    },
})
```

{% when 'rust' %}
```rust
let user = db.user().find_first(UserFindFirstArgs {
    where_clause: Some(UserWhereInput {
        email: Some(StringFilter { equals: Some("john@example.com".into()), ..Default::default() }),
        ..Default::default()
    }),
    ..Default::default()
}).await?;
```
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
        "is_active": True,
        "email": {"contains": "@example.com"}
    },
    order_by={"created_at": "desc"},
    skip=0,
    take=10,
)
```

{% when 'dotnet' %}
```csharp
var users = await db.Users.FindManyAsync(new UserFindManyArgs
{
    Where = new UserWhereInput
    {
        IsActive = new BoolFilter { Equals = true },
        Email = new StringFilter { Contains = "@example.com" }
    },
    OrderBy = new UserOrderByInput { CreatedAt = SortOrder.Desc },
    Take = 10
});
```

{% when 'golang' %}
```go
users, err := db.User.FindMany(ctx, &an5client.UserFindManyArgs{
    Where: &an5client.UserWhereInput{
        IsActive: &an5client.BoolFilter{Equals: true},
        Email:    &an5client.StringFilter{Contains: "@example.com"},
    },
    Take: 10,
})
```

{% when 'rust' %}
```rust
let users = db.user().find_many(UserFindManyArgs {
    where_clause: Some(UserWhereInput {
        is_active: Some(BoolFilter { equals: Some(true) }),
        email: Some(StringFilter { contains: Some("@example.com".into()), ..Default::default() }),
        ..Default::default()
    }),
    take: Some(10),
    ..Default::default()
}).await?;
```
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
await db.Users.UpdateAsync(new UserUpdateArgs
{
    Where = new UserWhereInput { Id = new StringFilter { Equals = user.Id } },
    Data = new UserUpdateInput { Name = "Johnny Doe" }
});
```

{% when 'golang' %}
```go
err := db.User.Update(ctx, &an5client.UserUpdateArgs{
    Where: &an5client.UserWhereInput{Id: &an5client.StringFilter{Equals: user.Id}},
    Data:  &an5client.UserUpdateInput{Name: "Johnny Doe"},
})
```

{% when 'rust' %}
```rust
let updated = db.user().update(UserUpdateArgs {
    where_clause: UserWhereInput { id: Some(StringFilter { equals: Some(user.id.clone()), ..Default::default() }), ..Default::default() },
    data: UserUpdateInput { name: Some("Johnny Doe".into()), ..Default::default() },
}).await?;
```
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
await db.Users.DeleteAsync(new UserWhereInput
{
    Id = new StringFilter { Equals = user.Id }
});
```

{% when 'golang' %}
```go
err := db.User.Delete(ctx, &an5client.UserWhereInput{
    Id: &an5client.StringFilter{Equals: user.Id},
})
```

{% when 'rust' %}
```rust
db.user().delete(UserWhereInput {
    id: Some(StringFilter { equals: Some(user.id.clone()), ..Default::default() }),
    ..Default::default()
}).await?;
```
{% endcase %}

---

## Next Steps

- [Advanced Queries]({{ '/guides/queries/' | relative_url }}) - In-depth filtering, pagination, and aggregation
- [Relations & Joins]({{ '/guides/relations/' | relative_url }}) - One-to-many and many-to-many relations
- [Database Providers]({{ '/guides/providers/' | relative_url }}) - Provider dialect specifics
- [Client Languages]({{ '/guides/client-languages/' | relative_url }}) - Complete language runtime specifications
