---
layout: page
title: API Reference
description: Complete API reference for an5 ORM
---

# API Reference

Complete API documentation for an5 ORM.

## An5Adapter Class (`@an5/adapters`)

### Factory / Constructor

```typescript
import { createAn5Adapter, An5Adapter } from '@an5/adapters';

const db = createAn5Adapter({
  connectionString: process.env.DATABASE_URL!,
});
```

### Methods

| Method / Property | Returns | Description |
|---|---|---|
| `db[modelName]` | `AdapterTableClient<T>` | Dynamic model access property (e.g. `db.user`, `db.order`) |
| `table(name)` | `AdapterTableClient<T>` | Explicit dynamic table client instance (`adapter.table('User')`) |
| `$connect()` | `Promise<void>` | Establish connection to database |
| `$disconnect()` | `Promise<void>` | Close database connection pool |
| `$transaction(fn, options?)` | `Promise<T>` | Execute callback-style transaction |

---

## AdapterTableClient API

### findFirst

```typescript
db.model.findFirst(params: FindFirstArgs): Promise<Model | null>
```

**Params:**
```typescript
{
  where?: WhereInput,
  orderBy?: OrderByInput,
  include?: IncludeInput,
  select?: SelectInput,
  skip?: number,
  take?: number
}
```

### findMany

```typescript
db.model.findMany(params: FindManyArgs): Promise<Model[]>
```

**Params:**
```typescript
{
  where?: WhereInput,
  orderBy?: OrderByInput | OrderByInput[],
  include?: IncludeInput,
  select?: SelectInput,
  skip?: number,
  take?: number
}
```

### create

```typescript
db.model.create(params: CreateArgs): Promise<Model>
```

**Params:**
```typescript
{
  data: CreateInput,
  include?: IncludeInput,
  select?: SelectInput
}
```

### createMany

```typescript
db.model.createMany(params: CreateManyArgs): Promise<BatchPayload>
```

**Params:**
```typescript
{
  data: CreateInput[],
  skipDuplicates?: boolean
}
```

### update

```typescript
db.model.update(params: UpdateArgs): Promise<Model>
```

**Params:**
```typescript
{
  where: WhereInput,
  data: UpdateInput,
  include?: IncludeInput,
  select?: SelectInput
}
```

### updateMany

```typescript
db.model.updateMany(params: UpdateManyArgs): Promise<BatchPayload>
```

**Params:**
```typescript
{
  where?: WhereInput,
  data: UpdateInput
}
```

### upsert

```typescript
db.model.upsert(params: UpsertArgs): Promise<Model>
```

**Params:**
```typescript
{
  where: WhereInput,
  create: CreateInput,
  update: UpdateInput
}
```

### delete

```typescript
db.model.delete(params: DeleteArgs): Promise<Model>
```

**Params:**
```typescript
{
  where: WhereInput
}
```

### deleteMany

```typescript
db.model.deleteMany(params: DeleteManyArgs): Promise<BatchPayload>
```

**Params:**
```typescript
{
  where?: WhereInput
}
```

### count

```typescript
db.model.count(params?: CountArgs): Promise<number>
```

### aggregate

```typescript
db.model.aggregate(params: AggregateArgs): Promise<AggregateResult>
```

**Params:**
```typescript
{
  where?: WhereInput,
  _count?: boolean,
  _sum?: { field: boolean },
  _avg?: { field: boolean },
  _min?: { field: boolean },
  _max?: { field: boolean }
}
```

### groupBy

```typescript
db.model.groupBy(params: GroupByArgs): Promise<GroupByResult[]>
```

**Params:**
```typescript
{
  by: ScalarFieldEnum | ScalarFieldEnum[],
  where?: WhereInput,
  orderBy?: OrderByInput | OrderByInput[],
  skip?: number,
  take?: number,
  _count?: true | { _all?: true; field?: true },
  _sum?: { numericField?: true },
  _avg?: { numericField?: true },
  _min?: { field?: true },
  _max?: { field?: true }
}
```

### vectorSearch

```typescript
db.model.vectorSearch(params: VectorSearchArgs): Promise<Model[]>
```

**Params:**
```typescript
{
  vector: number[],
  vectorField?: string,
  take?: number,
  distanceMetric?: 'cosine' | 'euclidean' | 'dot',
  vectorElementType?: 'float32' | 'float16' | 'uint8',
  where?: WhereInput,
  include?: IncludeInput
}
```

Returns `(Model & { distance: number })[]`. Native `VECTOR_DISTANCE` is used when
supported by the SQL Server instance; otherwise a cosine-distance fallback runs
in memory.

## Where Input

### Basic Operators

```typescript
{
  // Equality
  field: 'value',
  status: { equals: 'active' },
  deletedAt: null,
  archivedAt: { equals: null },
  role: { not: 'banned' },
  email: { not: null },
  name: { not: { contains: 'legacy' } },
  
  // Comparison
  score: { gt: 10 },
  age: { gte: 18 },
  views: { lt: 1000 },
  orderCount: { lte: 10 },
  
  // String
  title: { contains: 'text' },
  firstName: { startsWith: 'Jo' },
  lastName: { endsWith: 'son' },
  
  // List
  team: { in: ['a', 'b'] },
  tag: { notIn: ['archived', 'deleted'] }
}
```

### Logical Operators

```typescript
{
  AND: [{ field: 'value' }, { field2: 'value' }],
  OR: [{ field: 'value' }, { field2: 'value' }],
  NOT: [{ field: 'value' }, { field2: { startsWith: 'tmp' } }]
}
```

`AND` and `NOT` accept either a single object or an array of objects.

### Relation Filters

```typescript
{
  posts: { some: { title: 'Hello' } },
  posts: { none: {} },
  posts: { every: { published: true } }
}
```

Empty relation filters are meaningful: `some: {}` checks that at least one
related row exists, `none: {}` checks that no related rows exist, and
`every: {}` is treated as true.

## Update Input

Scalar fields accept direct replacement values. Numeric fields also accept
field operations:

```typescript
{
  name: 'Updated',
  score: { increment: 1 },
  total: { decrement: 10 },
  multiplier: { multiply: 2 },
  ratio: { divide: 4 },
  count: { set: 0 }
}
```

Common nested writes are supported on relation fields:

```typescript
{
  posts: {
    create: [{ title: 'New' }],
    connect: [{ id: 'post-1' }],
    set: [{ id: 'post-2' }],
    disconnect: [{ id: 'post-3' }],
    delete: [{ id: 'post-4' }],
    update: [{ where: { id: 'post-5' }, data: { title: 'Updated' } }],
    upsert: [{
      where: { id: 'post-6' },
      create: { title: 'Created' },
      update: { title: 'Updated' }
    }]
  }
}
```

## Include Input

```typescript
{
  // Simple include
  posts: true,
  
  // With ordering / projection
  posts: {
    select: { id: true, title: true },
    orderBy: { createdAt: 'desc' }
  },
  
  // Nested
  posts: {
    include: {
      comments: true,
      author: true
    }
  },
  
  // Count
  _count: {
    select: { posts: true }
  }
}
```

## Select Input

```typescript
{
  id: true,
  email: true,
  name: true,
  posts: {
    select: {
      id: true,
      title: true
    }
  },
  _count: true
}
```

Relation fields inside `select` behave as implicit includes. Helper keys needed
to resolve selected relations are fetched internally and removed from the final
projection when not explicitly selected.

```typescript
{
  name: true,
  orders: {
    select: { id: true }
  },
  _count: {
    select: { orders: true }
  }
}
```

## Order By Input

```typescript
// Single field
{ createdAt: 'desc' }

// Multiple fields
[
  { role: 'asc' },
  { createdAt: 'desc' }
]
```

For regular `find*` queries, only scalar columns are supported in `orderBy`.
`groupBy` can also order grouped rows through its `orderBy` argument.

## Transaction

### $transaction

```typescript
await db.$transaction(async (tx) => {
  // Operations using tx instead of db
  const user = await tx.user.create({...});
  const order = await tx.order.create({...});
});
```

`$transaction` is callback-based and automatically commits or rolls back.
Calling `tx.$transaction()` inside an active transaction reuses the same
transactional executor when the adapter does not provide native nested
transactions.

### Interactive Transactions

```typescript
const tx = await db.$begin();

try {
  await tx.user.update({ where: { id: userId }, data: { active: true } });
  await tx.$commit();
} catch (error) {
  await tx.$rollback();
  throw error;
}
```

`$begin()` requires the underlying adapter or custom executor to expose
interactive transaction support. Google Sheets does not support interactive
transactions.

## Raw Queries

### $queryRaw

```typescript
// Template tag
const users = await db.$queryRaw`
  SELECT * FROM users 
  WHERE email LIKE ${'%@example.com'}
`;
```

### $executeRaw

```typescript
const result = await db.$executeRaw`
  UPDATE users SET active = 0 
  WHERE last_login < ${dateThreshold}
`;
```

## Batch Payload

```typescript
{
  count: number  // Number of affected rows
}
```

## Error Handling

```typescript
import { An5ClientKnownRequestError } from '@an5/orm';

try {
  await db.user.create({
    data: { email: 'john@example.com' }
  });
} catch (error) {
  if (error instanceof An5ClientKnownRequestError) {
    console.log('Code:', error.code);
    console.log('Message:', error.message);
  }
}
```

## Known Error Codes

| Code | Description |
|------|-------------|
| P2002 | Unique constraint violation |
| P2003 | Foreign key constraint |
| P2025 | Record not found |

Other failures surface as the underlying driver error.

---

## @an5/adapters

The `@an5/adapters` package provides database and spreadsheet execution for the ORM
and can also be used standalone. The full public API is exported from the package root.

### Factory functions

| Function | Description |
|----------|-------------|
| `createAn5Adapter(config)` | Create an adapter from `An5AdapterConfig`. Detects the dialect from the config `type` or from a `connectionString` scheme (`sqlserver://`, `postgres://`, `mysql://`, `sqlite://`, `googlesheets://`) |
| `createAn5SheetsAdapter(config)` | Create a Google Sheets adapter from `An5SheetsAdapterConfig` |
| `parseSheetsConnectionString(url)` | Parse a `googlesheets://` connection string into `An5SheetsAdapterConfig` |

```typescript
import {
  createAn5Adapter,
  createAn5SheetsAdapter,
  parseSheetsConnectionString,
} from '@an5/adapters';

// Dialect auto-detection from connection string
const db = createAn5Adapter({
  connectionString: 'googlesheets://spreadsheetId;clientEmail=...;privateKey=...',
});

// Direct Sheets configuration
const sheets = createAn5SheetsAdapter({
  spreadsheetId: 'spreadsheetId',
  clientEmail: 'sa@project.iam.gserviceaccount.com',
  privateKey: '...',
  sheetMapping: { users: 'Users' },
});

// Parse a connection string
const cfg = parseSheetsConnectionString('googlesheets://spreadsheetId;apiKey=...');
```

### Adapter classes

| Class | Description |
|-------|-------------|
| `An5Adapter` | Dialect-agnostic adapter (`exec`, `executeRaw`, `table`, `$transaction`, `$connect`, `$disconnect`) |
| `An5SheetsAdapter` | Spreadsheet adapter. Adds `readRange`, `writeRange`, `appendRange`, `listSheets`, `deleteSheet` |
| `SheetsTableClient<T>` | Typed table client over a sheet (`findMany`, `findFirst`, `create`, `update`, `delete`, `clear`, `deleteAll`, …) |

### Config functions

| Function | Description |
|----------|-------------|
| `getLlmConfig()` / `setLlmConfig(config)` | Read/update the active LLM configuration |
| `getEmbeddingConfig()` / `setEmbeddingConfig(config)` | Read/update the active embedding configuration |
| `resetAdapter()` | Clear cached adapter/config state |
| `setAdapterMetadata(metadata)` | Pass schema metadata explicitly to the adapter |

### Subpaths

The package also exposes scoped entry points:

| Subpath | Contents |
|---------|----------|
| `@an5/adapters/browser` | Browser-safe bundle (Sheets via fetch + metadata helpers, no SQL engines) |
| `@an5/adapters/googlesheets` | Google Sheets adapter only |
| `@an5/adapters/config` | `LlmConfigData` / `EmbeddingConfigData` types and helpers |
| `@an5/adapters/mssql` | SQL Server engine |
| `@an5/adapters/postgres` | PostgreSQL engine |
| `@an5/adapters/mysql` | MySQL engine |
| `@an5/adapters/sqlite` | SQLite engine |
| `@an5/adapters/base` | Base types and metadata helpers |
| `@an5/adapters/python` | Packaged Python adapter facade source |
| `@an5/adapters/dotnet` | Packaged .NET adapter facade source |
| `@an5/adapters/golang` | Packaged Go adapter facade source |

### Sheets config (`An5SheetsAdapterConfig`)

| Field | Type | Description |
|-------|------|-------------|
| `spreadsheetId` | `string` | Google Sheets spreadsheet id |
| `clientEmail?` | `string` | OAuth service-account email (use with `privateKey`) |
| `privateKey?` | `string` | Service-account private key |
| `credentials?` | `object` | Alternative: full service-account JSON credentials |
| `accessToken?` | `string` | OAuth access token (browser mode) |
| `apiKey?` | `string` | Google API key (browser mode) |
| `sheetMapping?` | `Record<string, string>` | Model → sheet name mapping (defaults to model name) |

---

## An5Agent Class

### Constructor

```typescript
import { An5Agent } from '@an5/agent';

const agent = new An5Agent(tools?: Tool[]);
```

Registers the 7 default tools unless overridden; custom tools can be appended.

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `process(context)` | `Promise<AgentResponse>` | Process `AgentContext` (`{ userQuestion, database?, toolContext? }`) |
| `executeTool(name, input, context?)` | `Promise<unknown>` | Execute a specific tool |
| `getTools()` | `Tool[]` | Get all registered tools |
| `getTool(name)` | `Tool \| undefined` | Get tool by name |
| `addTool(tool)` | `void` | Register a new tool |

### Tools (7 consolidated)

| Tool | Actions | Description |
|------|---------|-------------|
| `schema` | list, describe, relations | Explore data models |
| `query` | generate, explain, validate | Work with SQL queries |
| `database` | execute, describe, health | Database operations |
| `generateClientCode` | - | Generate client code |
| `analyzeSchema` | - | Analyze schema issues |
| `retrieve` | schema, queries | Semantic search |
| `task` | create, list, update, delete | Manage tasks |

For detailed tool documentation, see [AI Agent Tools]({{ '/guides/agent-tools/' | relative_url }}).

---

## CLI Commands

Schema/database commands run as npm scripts from the `an5Orm/` repository directory (no standalone `an5` CLI binary is shipped).

## Browser Adapters API (`@an5/adapters/browser`)

The `@an5/adapters/browser` entrypoint provides zero-dependency browser-safe database adapters for Web Browsers, WASM, and Client Components.

### `createBrowserSqliteAdapter`

Creates a type-safe AN5 ORM adapter for in-browser SQLite execution drivers (such as `sql.js`, WASM, OPFS, or Capacitor/Expo SQLite).

```typescript
import { createBrowserSqliteAdapter } from '@an5/adapters/browser';

const adapter = createBrowserSqliteAdapter({
  driver: {
    exec: (sql: string, params?: any[]) => rows
  },
  dialect: 'sqlite'
});
```

### `An5SheetsAdapter` / `createAn5SheetsAdapter`

Creates a browser-safe Google Sheets database adapter.

```typescript
import { createAn5SheetsAdapter } from '@an5/adapters/browser';

const sheetsDb = createAn5SheetsAdapter({
  spreadsheetId: 'YOUR_SHEET_ID',
  accessToken: 'YOUR_OAUTH_TOKEN' // or apiKey: 'YOUR_API_KEY'
});
```

---

### Schema Management

| Command | Description |
|---------|-------------|
| `npm run generate` | Generate client code from schema |
| `npm run db:push` | Push schema to database |
| `npm run db:pull` | Pull schema from database |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:migrate diff` | Compare schema with database |
| `npm run db:migrate:generate` | Generate migration SQL |
| `npm run db:migrate:apply` | Apply pending migration files; pass `-- --dry-run` to preview SQL |
| `npm run db:migrate:rollback` | Roll back the latest applied migration; pass `-- --dry-run`, `-- 3`, or `-- --to <file>` |
| `npm run db:migrate:status` | Show migration status |

### Development

The following are workspace-root scripts (run from the repository root, not from `an5Orm/`):

| Command | Where | Description |
|---------|-------|-------------|
| `npm run build` | workspace root | Build all workspace packages |
| `npm test` | `an5Orm/` or workspace root | Run tests (an5Orm) or the full workspace suite |
| `npm run test:full` | workspace root | Run workspace tests plus generator, package smoke, and Python/.NET/Go compile gates |
| `npm run test:integration:live` | workspace root | Run live adapter Postgres/SQL Server checks plus ORM SQL Server relation/transaction/vector fallback checks when database URLs are configured |
| `npm run ui` | workspace root | Start local UI |

### Release

| Command | Description |
|---------|-------------|
| `npm run dryrun` | Preview release changes |
| `npm run release` | Release across the workspace |

For more CLI commands, see [CLI Commands]({{ '/guides/cli/' | relative_url }}).
