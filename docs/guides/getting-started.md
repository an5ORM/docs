---
layout: page
title: Getting Started
description: Install and set up an5 in your project
---

# Getting Started

This guide will help you set up an5 in your project in under 5 minutes.

For the current implementation and package maturity overview, see [Feature Status]({{ '/guides/feature-status/' | relative_url }}).

## Prerequisites

- Node.js 18+ (Node 24 recommended)
- SQL Server, PostgreSQL, MySQL, SQLite, Google Sheets, or NBase connection
- npm or yarn package manager

## Installation

```bash
npm install @an5/adapters @an5/orm
```

- `@an5/adapters`: Database runtime, connection handling, dynamic table clients, transactions.
- `@an5/orm`: Schema parser, multi-language generator, migrations (`db:push`, `db:pull`, `db:migrate`, `db:seed`).

## Configuration

### 1. Set up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and configure your database connection:

```ini
# Database connection string (SQL Server, PostgreSQL, MySQL, SQLite, Google Sheets, or NBase)
DATABASE_URL=sqlserver://localhost:1433;database=mydb;user=sa;password=yourpassword
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

This generates type-safe client code in `an5Client/`.

### 4. Push Schema to Database

```bash
npm run db:push
```

This creates the tables in your database.

## Your First Query

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

## Project Structure

```
an5/
├── an5Schema/           # Schema definitions (.an5 files)
├── node_modules/@an5/adapters # Database runtime & adapters
├── node_modules/@an5/orm      # Schema & migrations engine
├── an5Client/                # Generated client code
└── .env                 # Configuration
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
| `npm run db:migrate:apply` | `an5Orm/` | Apply pending migration files; pass `-- --dry-run` to preview SQL |
| `npm run db:migrate:rollback` | `an5Orm/` | Roll back migrations; pass `-- --dry-run`, `-- 3`, or `-- --to <file>` |
| `npm run db:migrate:status` | `an5Orm/` | Show migration status |
| `npm run build` | workspace root | Build all workspace packages |
| `npm test` | workspace root | Run tests across the workspace |

## Next Steps

- [Schema Definition]({{ '/guides/schema/' | relative_url }}) - Learn how to define your data models
- [CRUD Operations]({{ '/guides/crud/' | relative_url }}) - Create, read, update, and delete data
- [Transactions]({{ '/guides/transactions/' | relative_url }}) - Atomic transactions and rollback
