---
layout: page
title: CRUD Operations
description: Create, Read, Update, and Delete data with an5 ORM
---

# CRUD Operations

`@an5/adapters` provides a clean, type-safe API for all CRUD operations.

## Setup

```typescript
import { createAn5Adapter } from '@an5/adapters';

const db = createAn5Adapter({
  connectionString: process.env.DATABASE_URL!,
});
```

## Create

### Create a Single Record

```typescript
const user = await db.user.create({
  data: {
    email: 'john@example.com',
    name: 'John Doe'
  }
});

console.log(user);
// { id: "uuid", email: "john@example.com", name: "John Doe", ... }
```

### Create with Relations

```typescript
const user = await db.user.create({
  data: {
    email: 'john@example.com',
    name: 'John Doe',
    posts: {
      create: [
        { title: 'First Post', content: 'Hello world!' },
        { title: 'Second Post', content: 'Another post' }
      ]
    },
    profile: {
      create: { bio: 'Software developer' }
    }
  }
});
```

### Create Many Records

```typescript
const users = await db.user.createMany({
  data: [
    { email: 'alice@example.com', name: 'Alice' },
    { email: 'bob@example.com', name: 'Bob' },
    { email: 'charlie@example.com', name: 'Charlie' }
  ]
});

console.log(`Created ${users.count} users`);
```

## Read

### Find Unique Record

```typescript
// By primary key
const user = await db.user.findUnique({
  where: { id: 'user-id-123' }
});

// By unique field
const user = await db.user.findUnique({
  where: { email: 'john@example.com' }
});
```

### Find First Record

```typescript
const user = await db.user.findFirst({
  where: {
    name: { contains: 'John' },
    isActive: true
  },
  orderBy: { createdAt: 'desc' }
});
```

### Find Many Records

```typescript
const users = await db.user.findMany({
  where: {
    isActive: true,
    email: { contains: '@example.com' }
  },
  orderBy: [
    { createdAt: 'desc' }
  ],
  skip: 0,
  take: 10
});
```

### Count Records

```typescript
const count = await db.user.count({
  where: { isActive: true }
});
```

## Update

### Update a Single Record

```typescript
const user = await db.user.update({
  where: { id: 'user-id-123' },
  data: {
    name: 'Jane Doe',
    updatedAt: new Date()
  }
});
```

### Update Many Records

```typescript
const result = await db.user.updateMany({
  where: { role: 'admin' },
  data: { isActive: true }
});

console.log(`Updated ${result.count} users`);
```

### Upsert (Update or Create)

```typescript
const user = await db.user.upsert({
  where: { email: 'john@example.com' },
  update: { name: 'John Updated' },
  create: {
    email: 'john@example.com',
    name: 'John Doe'
  }
});
```

## Delete

### Delete a Single Record

```typescript
const user = await db.user.delete({
  where: { id: 'user-id-123' }
});
```

### Delete Many Records

```typescript
const result = await db.user.deleteMany({
  where: { isActive: false }
});

console.log(`Deleted ${result.count} users`);
```

## Transactions

Use `$transaction` to execute multiple operations atomically:

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

When you need explicit control over when the transaction commits or rolls back,
use interactive transactions instead — see [Transactions]({{ '/guides/transactions/' | relative_url }}).

## Raw Queries

Execute raw SQL when you need more control:

```typescript
// Query with parameters
const users = await db.$queryRaw`
  SELECT * FROM users 
  WHERE email LIKE ${'%@example.com'}
  ORDER BY created_at DESC
`;

// Execute (INSERT, UPDATE, DELETE)
const result = await db.$executeRaw`
  UPDATE users SET is_active = 0 
  WHERE last_login < ${dateThreshold}
`;
```

## Error Handling

```typescript
try {
  const user = await db.user.create({
    data: { email: 'john@example.com' }
  });
} catch (error) {
  if (error.code === 'P2002') {
    console.log('Unique constraint violation');
  } else {
    console.error('Database error:', error);
  }
}
```

## Next Steps

- [Relations]({{ '/guides/relations/' | relative_url }}) - Define relationships between models
- [Advanced Queries]({{ '/guides/queries/' | relative_url }}) - Complex query patterns
- [Transactions]({{ '/guides/transactions/' | relative_url }}) - Atomic operations
