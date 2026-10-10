---
layout: page
title: Transactions
description: Execute multiple operations atomically across client languages and database providers
---

# Transactions

an5 ORM supports transactions to ensure data consistency when performing multiple related operations.

{% assign code = page.docs_code | default: 'typescript' %}
{% assign provider = page.docs_provider | default: 'sqlite' %}
{% assign tx_supported = true %}
{% if provider == 'nbase' or provider == 'googlesheets' %}{% assign tx_supported = false %}{% endif %}

{% if tx_supported %}
<p class="guide-note">
  <strong>{{ provider | capitalize }} note:</strong>
  {% case provider %}
  {% when 'postgresql' %}PostgreSQL uses standard ACID transactions with <code>BEGIN</code>, <code>COMMIT</code>, and <code>ROLLBACK</code>. Nested transactions leverage <code>SAVEPOINT</code>.
  {% when 'sqlserver' %}SQL Server supports full ACID transactions. Nested transactions use <code>SAVE TRANSACTION</code> savepoints.
  {% when 'sqlite' %}SQLite uses file-level locking with <code>BEGIN IMMEDIATE</code> to avoid write deadlocks. In-memory databases support transactions within the connection lifetime.
  {% when 'mysql' %}MySQL (InnoDB engine) enforces full ACID compliance and row-level locking during active transactions.
  {% endcase %}
</p>
{% else %}
<p class="guide-warning">
  <strong>Notice:</strong> Multi-statement ACID transactions are not supported on <strong>{{ provider | capitalize }}</strong>.
  {% if provider == 'nbase' %}
  NBase is a specialized vector store optimized for high-throughput similarity indexing rather than transactional relational storage.
  {% elsif provider == 'googlesheets' %}
  The Google Sheets adapter performs atomic batch row updates via the Google Sheets REST API, but does not provide multi-step rollback transactions.
  {% endif %}
  Please choose a relational SQL provider (PostgreSQL, SQL Server, MySQL, SQLite) in the header above for transactional workflows.
</p>
{% endif %}

{% if tx_supported %}
{% case code %}
{% when 'typescript' %}
## Basic Transaction (Scoped)

Execute multiple database operations within a scoped callback. If any operation throws an error, all changes roll back automatically.

```typescript
await db.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: 'john@example.com', name: 'John' }
  });
  
  const order = await tx.order.create({
    data: {
      userId: user.id,
      total: 100
    }
  });
});
```

## Interactive Transactions ($begin, $commit, $rollback)

Use `$begin()` when you need manual control over transaction boundaries across asynchronous steps:

```typescript
const tx = await db.$begin();

try {
  await tx.account.update({
    where: { id: senderId },
    data: { balance: { decrement: amount } }
  });

  await tx.account.update({
    where: { id: receiverId },
    data: { balance: { increment: amount } }
  });

  await tx.$commit();
} catch (error) {
  await tx.$rollback();
  throw error;
}
```

## Nested Transactions

Inner `$transaction` blocks automatically map to savepoints on supported engines:

```typescript
await db.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: 'john@example.com' }
  });
  
  await tx.$transaction(async (innerTx) => {
    await innerTx.order.create({
      data: { userId: user.id, total: 100 }
    });
  });
});
```

{% when 'python' %}
## Basic Transaction (Callback)

Use `db.transaction()` with a callback function. All operations executed through the transaction client succeed or rollback together:

```python
def transfer_workflow(tx):
    tx.account.update(
        where={"id": sender_id},
        data={"balance": {"decrement": amount}}
    )
    tx.account.update(
        where={"id": receiver_id},
        data={"balance": {"increment": amount}}
    )

# Automatically commits on return, rolls back if an exception is raised
db.transaction(transfer_workflow)
```

## Lambda Transaction

For concise single- or two-step operations:

```python
db.transaction(lambda tx: tx.user.create({
    "data": {"email": "alice@example.com", "name": "Alice"}
}))
```

## Exception Handling and Rollback

```python
try:
    def failing_action(tx):
        tx.user.create({"data": {"email": "bob@example.com"}})
        raise RuntimeError("Validation failure: reverting transaction")

    db.transaction(failing_action)
except RuntimeError as err:
    print(f"Transaction safely rolled back: {err}")
```

{% when 'dotnet' %}
## Scoped Transaction in C#

The .NET adapter provides `adapter.Transaction<T>()` to execute atomic blocks with automatic commit and rollback:

```csharp
adapter.Transaction<int>(tx =>
{
    var userTable = adapter.Table<User>("User");
    var orderTable = adapter.Table<Order>("Order");

    userTable.Create(new User {
        Id = Guid.NewGuid().ToString(),
        Email = "dotnet-dev@example.com",
        Name = "Dev"
    });

    orderTable.Create(new Order {
        Id = Guid.NewGuid().ToString(),
        Total = 250
    });

    return 0; // Commits on normal exit
});
```

## Error Handling and Rollback

If an unhandled exception occurs inside the delegate, the transaction aborts and changes are reverted:

```csharp
try
{
    adapter.Transaction<int>(tx =>
    {
        userTable.Create(new User { Email = "fail@example.com" });
        throw new InvalidOperationException("Abort operation");
    });
}
catch (InvalidOperationException ex)
{
    Console.WriteLine($"Transaction rolled back: {ex.Message}");
}
```

{% when 'golang' %}
## Transaction with Context

The Go adapter provides `adapter.Transaction(ctx, fn)` with a transaction function taking a standard `*sql.Tx`:

```go
package main

import (
    "context"
    "database/sql"
    "fmt"
    "github.com/an5ORM/an5Adapters/golang"
)

func runTransaction(ctx context.Context, adapter *an5adapters.An5Adapter) error {
    return adapter.Transaction(ctx, func(tx *sql.Tx) error {
        // Execute queries within the active transaction
        _, err := tx.ExecContext(ctx, "UPDATE accounts SET balance = balance - $1 WHERE id = $2", 100, "acc-1")
        if err != nil {
            return err // Returning an error automatically triggers ROLLBACK
        }

        _, err = tx.ExecContext(ctx, "UPDATE accounts SET balance = balance + $1 WHERE id = $2", 100, "acc-2")
        if err != nil {
            return err
        }

        return nil // Returning nil triggers COMMIT
    })
}
```

{% when 'rust' %}
## Asynchronous Transaction in Rust

The Rust adapter runtime executes closures within an isolated transaction scope:

```rust
use an5_adapters::An5Adapter;
use anyhow::Result;

async fn execute_atomic_flow(adapter: &An5Adapter) -> Result<()> {
    adapter.transaction(|conn| async move {
        // Operations executed on the transaction connection
        sqlx::query("UPDATE accounts SET balance = balance - ? WHERE id = ?")
            .bind(100)
            .bind("acc-1")
            .execute(&mut *conn)
            .await?;

        sqlx::query("UPDATE accounts SET balance = balance + ? WHERE id = ?")
            .bind(100)
            .bind("acc-2")
            .execute(&mut *conn)
            .await?;

        Ok(()) // Commits on Ok(()), rolls back on Err
    }).await?;

    Ok(())
}
```

{% when 'java' %}
## Basic Transaction (Scoped)

`An5DbContext.transaction` commits when the callback returns and rolls back when it
throws:

```java
User user = db.transaction(tx -> {
  User created = db.getUser().create(
      new User().withEmail("john@example.com").withName("John"));
  db.getOrder().create(
      new Order().withUserId(created.getId()).withTotal(100));
  return created;
});
```

The work runs on the context's adapter, so the typed handles take part in the same
transaction; `tx` is that adapter again when you need raw SQL. Nested `transaction()`
calls are rejected rather than flattened, because an inner commit would turn an outer
rollback into a partial save.

## Error Handling and Rollback

```java
try {
  db.transaction(tx -> {
    db.getUser().create(new User().withEmail("john@example.com").withName("First"));
    throw new IllegalStateException("rollback");
  });
} catch (IllegalStateException expected) {
  // the insert above was discarded with the transaction
} catch (SQLException error) {
  // connection-level failure
}
```

{% when 'kotlin' %}
## Basic Transaction (Scoped)

```kotlin
val user = db.transaction {
    val created = db.user.create(User(email = "john@example.com", name = "John"))
    db.order.create(Order(userId = created.id, total = 100))
    created
}
```

The block returns the transaction's value and commits when it returns. It is handed the
`An5` runtime for raw SQL, but the typed handles on `db` share the same connection, so
they are part of the transaction too. Nested `transaction` calls are rejected rather
than flattened.

## Error Handling and Rollback

```kotlin
try {
    db.transaction<Unit> {
        db.user.create(User(email = "john@example.com", name = "First"))
        throw IllegalStateException("rollback")
    }
} catch (expected: IllegalStateException) {
    // the insert above was discarded with the transaction
}
```

{% when 'swift' %}
## Basic Transaction (Scoped)

```swift
let user = try db.transaction {
    let created = try db.user.create(User(email: "john@example.com", name: "John"))
    try db.order.create(Order(userId: created.id, total: 100))
    return created
}
```

The closure returns the transaction's value and commits when it returns; a thrown error
rolls it back first. It is handed the adapter for raw SQL, but the typed handles on `db`
share the same connection, so they are part of the transaction too. Nested `transaction`
calls are rejected rather than flattened.

## Error Handling and Rollback

```swift
import Foundation

do {
    try db.transaction { (_: An5Adapter) throws -> Void in
        _ = try db.user.create(User(email: "john@example.com", name: "First"))
        throw NSError(domain: "example.rollback", code: 1)
    }
} catch {
    // the insert above was discarded with the transaction
}
```

{% endcase %}

## Best Practices

1. **Keep transactions short** - Minimize the time table rows are locked to avoid blocking concurrent queries.
2. **Handle errors properly** - Always handle potential deadlock or timeout exceptions in application code.
3. **Consistent ordering** - Always update tables and records in a deterministic order across all endpoints to prevent database deadlocks.
4. **Choose the appropriate isolation level** - Tailor the transaction isolation according to concurrency and consistency requirements.

{% endif %}

## Next Steps

- [Advanced Queries]({{ '/' | append: code | append: '/' | append: provider | append: '/guides/queries/' | relative_url }}) - Filter, sort, and paginate data
- [Relations & Joins]({{ '/' | append: code | append: '/' | append: provider | append: '/guides/relations/' | relative_url }}) - Model relational data integrity
