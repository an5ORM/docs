---
layout: page
title: Transactions
description: Execute multiple operations atomically
---

# Transactions

an5 ORM supports transactions to ensure data consistency when performing multiple related operations.

## Basic Transaction

```typescript
await db.$transaction(async (tx) => {
  // All operations succeed or all fail
  const user = await tx.user.create({
    data: { email: 'john@example.com', name: 'John' }
  });
  
  const order = await tx.order.create({
    data: {
      userId: user.id,
      total: 100
    }
  });
  
  // If any error occurs, all changes are rolled back
});
```

## Transaction with Rollback

```typescript
try {
  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: 'john@example.com', name: 'John' }
    });
    
    // This will fail if email already exists
    const duplicate = await tx.user.create({
      data: { email: 'john@example.com', name: 'Another John' }
    });
  });
} catch (error) {
  console.log('Transaction rolled back:', error.message);
}
```

## Nested Transactions

```typescript
await db.$transaction(async (tx) => {
  // Outer transaction
  const user = await tx.user.create({
    data: { email: 'john@example.com' }
  });
  
  // Inner transaction (uses the same connection)
  await tx.$transaction(async (innerTx) => {
    const order = await innerTx.order.create({
      data: { userId: user.id, total: 100 }
    });
    
    await innerTx.inventory.update({
      where: { productId: 'product-1' },
      data: { quantity: { decrement: 1 } }
    });
  });
});
```

## Interactive Transactions

Use `$begin()` when you need explicit control over the transaction lifetime.
The returned `tx` client uses the same model API as `db`.

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

Interactive transaction clients are single-use: after `tx.$commit()` or
`tx.$rollback()`, use a new `db.$begin()` call for the next transaction.

## Common Use Cases

### Transfer Funds

```typescript
await db.$transaction(async (tx) => {
  // Debit sender
  await tx.account.update({
    where: { id: senderId },
    data: { balance: { decrement: amount } }
  });
  
  // Credit receiver
  await tx.account.update({
    where: { id: receiverId },
    data: { balance: { increment: amount } }
  });
  
  // Create transaction record
  await tx.transaction.create({
    data: {
      fromId: senderId,
      toId: receiverId,
      amount
    }
  });
});
```

### Order with Inventory

```typescript
await db.$transaction(async (tx) => {
  // Check inventory
  const product = await tx.product.findUnique({
    where: { id: productId }
  });
  
  if (product.quantity < quantity) {
    throw new Error('Insufficient inventory');
  }
  
  // Create order
  const order = await tx.order.create({
    data: {
      userId,
      items: {
        create: [{ productId, quantity, price: product.price }]
      },
      total: product.price * quantity
    }
  });
  
  // Update inventory
  await tx.product.update({
    where: { id: productId },
    data: { quantity: { decrement: quantity } }
  });
  
  return order;
});
```

## Transaction Options

```typescript
await db.$transaction(async (tx) => {
  // Operations here
}, {
  timeout: 10000  // Maximum time for transaction to complete (ms)
});
```

## Best Practices

1. **Keep transactions short** - Minimize the time the database is locked
2. **Handle errors properly** - Always catch and handle transaction errors
3. **Use appropriate isolation levels** - For concurrent scenarios
4. **Avoid deadlocks** - Access resources in a consistent order
5. **Prefer `$transaction` for scoped work** - Use `$begin()` only when manual lifetime control is needed

## Next Steps

- [Vector Search]({{ '/guides/vector-search/' | relative_url }}) - AI-powered search
- [Raw Queries]({{ '/guides/queries/' | relative_url }}) - Execute raw SQL
