---
layout: page
title: Troubleshooting
description: Solutions and troubleshooting guides for common database connections, schema validation, query execution, and code generation issues in AN5 ORM.
---

# Troubleshooting

Solutions to common issues with an5 ORM.

## Connection Issues

### Cannot Connect to Database

**Error:** `Connection refused` or `ECONNREFUSED`

**Solution:**
1. Verify database server is running
2. Check connection string format
3. Ensure firewall allows connection
4. Verify credentials

```ini
# Correct format
DATABASE_URL=sqlserver://localhost:1433;database=mydb;user=sa;password=yourpassword

# With encryption (Azure SQL)
DATABASE_URL=sqlserver://server.database.windows.net:1433;database=mydb;user=admin;password=pass;encrypt=true
```

### Connection Timeout

**Error:** `Connection acquire timeout`

**Solution:**
```typescript
import { createAn5Adapter } from '@an5/adapters';

const db = createAn5Adapter({
  connectionString: process.env.DATABASE_URL!,
});
await db.$connect();
```

### Too Many Connections

**Error:** `Login failed for user` or connection limit reached

**Solution:**
```typescript
import { createAn5Adapter } from '@an5/adapters';

const db = createAn5Adapter({
  connectionString: process.env.DATABASE_URL!,
});
```

## Schema Issues

### Table Already Exists

**Error:** `Table already exists`

**Solution:**
- Use `IF NOT EXISTS` in migrations
- Check schema before creating

```typescript
await db.$executeRaw`
  CREATE TABLE IF NOT EXISTS users (
    id NVARCHAR(1000) PRIMARY KEY,
    email NVARCHAR(255) UNIQUE
  )
`;
```

### Column Type Mismatch

**Error:** `Invalid column type`

**Solution:**
- Verify schema matches database
- Use correct SQL Server types

| Schema Type | SQL Server |
|-------------|------------|
| `NVARCHAR(n)` | nvarchar |
| `INT` | int |
| `DATETIME2` | datetime2 |
| `BIT` | bit |

### Unique Constraint Violation

**Error:** `Unique constraint violation`

**Solution:**
```typescript
// Check if exists before creating
const existing = await db.user.findUnique({
  where: { email: 'john@example.com' }
});

if (existing) {
  // Update instead
  await db.user.update({
    where: { email: 'john@example.com' },
    data: { name: 'John Updated' }
  });
} else {
  // Create new
  await db.user.create({
    data: { email: 'john@example.com', name: 'John' }
  });
}
```

## Query Issues

### No Results Found

**Possible causes:**
- Data doesn't exist
- Wrong filter conditions
- Case sensitivity

**Solution:**
```typescript
// Debug: log the query
console.log('Filter:', { where: { email: 'john@example.com' } });

const user = await db.user.findFirst({
  where: { email: 'john@example.com' }
});

console.log('Result:', user);
```

### Type Errors

**Error:** `Type 'string' is not assignable to type 'number'`

**Solution:**
```typescript
// Ensure correct types
const user = await db.user.create({
  data: {
    age: parseInt('25')  // Convert string to number
  }
});
```

### Relation Not Included

**Error:** `Cannot read property of undefined`

**Solution:**
```typescript
// Include the relation
const user = await db.user.findUnique({
  where: { id: 'user-id' },
  include: { posts: true }  // Add this
});

console.log(user.posts);  // Now available
```

## Performance Issues

### Slow Queries

**Solution:**
```typescript
import { createAn5Adapter } from '@an5/adapters';

const db = createAn5Adapter({
  connectionString: process.env.DATABASE_URL!,
});

// Add indexes
await db.$executeRaw('CREATE INDEX idx_email ON users(email)');
```

### Memory Leaks

**Solution:**
```typescript
import { createAn5Adapter } from '@an5/adapters';

// Always disconnect when done
async function main() {
  const db = createAn5Adapter({
    connectionString: process.env.DATABASE_URL!,
  });
  await db.$connect();
  
  try {
    // Use db
  } finally {
    await db.$disconnect();
  }
}
```

### N+1 Query Problem

**Solution:**
```typescript
// Bad: N+1 queries
const users = await db.user.findMany();
for (const user of users) {
  user.posts = await db.post.findMany({
    where: { authorId: user.id }
  });
}

// Good: Include relations
const users = await db.user.findMany({
  include: { posts: true }
});
```

## Build Issues

### TypeScript Errors

**Error:** `Cannot find module '@an5/orm'`

**Solution:**
```bash
# Install the published ORM package
npm install @an5/orm

# Verify the package resolves
node -e "require('@an5/orm')"
```

### Generation Fails

**Error:** `Schema parse error`

**Solution:**
1. Check `.an5` file syntax
2. Validate field types
3. Run format command

```bash
npx an5-cli format schema/
npm run generate   # from an5Orm/
```

## Environment Issues

### .env Not Loading

**Solution:**
1. Ensure `.env` is in project root
2. Check file name (no spaces)
3. Restart application

```bash
# Verify file exists
ls -la .env

# Check content
cat .env
```

### Wrong Node Version

**Error:** `SyntaxError` or unexpected behavior

**Solution:**
```bash
# Check version
node --version  # Should be 18+

# Use nvm
nvm use 24
npm install
```

## Debug Mode

Enable debug logging:

```bash
# Set debug level
export LOG_LEVEL=debug

# Or in .env
LOG_LEVEL=debug
```

```typescript
// Uses DATABASE_URL from the environment; set LOG_LEVEL=debug for verbose query logging
const db = new An5ORM();
```

## Getting Help

1. **Check logs** - Enable debug logging
2. **Search issues** - GitHub Issues
3. **Community** - Discord/Slack
4. **Documentation** - This site

## Known Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| P2002 | Unique constraint violation | Check for duplicate values |
| P2003 | Foreign key constraint | Check related records |

These are raised as `An5ClientKnownRequestError` from `@an5/orm`. Other failures
surface as the underlying driver error (or a plain `Error` for records not found).
