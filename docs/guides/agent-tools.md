---
layout: page
title: AI Agent Tools
description: 7 intelligent tools for database operations and task management
---

# AI Agent Tools

an5 Agent provides **7 consolidated tools** for schema exploration, query generation, database operations, and task management.

In VS Code, the same capabilities are reachable without writing any integration code: the [an5OrmVScode](https://github.com/an5ORM/an5OrmVScode) extension ships an [MCP server]({{ '/guides/vscode-mcp/' | relative_url }}) exposing schema tools, read-only queries and the schema operations to Copilot and other MCP clients. It registers itself — run `MCP: List Servers` and start **AN5 ORM** — or run **AN5: Install MCP Server** to write the config file.

## Tool Overview

| Tool | Actions | Description |
|------|---------|-------------|
| `schema` | list, describe, relations | Explore data models |
| `query` | generate, explain, validate | Work with SQL queries |
| `database` | execute, describe, health | Database operations |
| `generateClientCode` | - | Generate client code |
| `analyzeSchema` | - | Analyze schema issues |
| `retrieve` | schema, queries | Semantic search |
| `task` | create, list, update, delete | Manage tasks |

---

## schema

Explore database schema structure.

### Actions

| Action | Description | Required Params |
|--------|-------------|-----------------|
| `list` | List all models | - |
| `describe` | Get model details | `modelName` |
| `relations` | Get foreign keys | - (optional: `modelName`) |

### Examples

**List all models:**
```typescript
await agent.executeTool('schema', { action: 'list' });
// Returns: { models: [...], totalModels: 5 }
```

**Describe a model:**
```typescript
await agent.executeTool('schema', { 
  action: 'describe', 
  modelName: 'User' 
});
// Returns: { model: { name, fields, relations }, found: true }
```

**Get relations:**
```typescript
await agent.executeTool('schema', { 
  action: 'relations',
  modelName: 'User'  // Optional: filter by model
});
// Returns: { relations: [...] }
```

---

## query

Work with SQL queries.

### Actions

| Action | Description | Required Params |
|--------|-------------|-----------------|
| `generate` | Generate SQL from natural language | `description` |
| `explain` | Analyze SQL query | `sql` |
| `validate` | Check SQL syntax | `sql` |

### Examples

**Generate SQL:**
```typescript
await agent.executeTool('query', {
  action: 'generate',
  description: 'Find all users with their orders',
  tables: ['User', 'Order']  // Optional
});
// Returns: { sql: 'SELECT ...', explanation: '...', tables: [...] }
```

**Explain query:**
```typescript
await agent.executeTool('query', {
  action: 'explain',
  sql: 'SELECT u.*, COUNT(o.id) FROM users u LEFT JOIN orders o ON u.id = o.userId GROUP BY u.id'
});
// Returns: { interpretedIntent: '...', estimatedComplexity: 'moderate', notes: [...] }
```

**Validate query:**
```typescript
await agent.executeTool('query', {
  action: 'validate',
  sql: 'UPDATE users SET name = "John"'  // Invalid: uses double quotes
});
// Returns: { isValid: false, errors: [...], suggestions: [...] }
```

---

## database

Database operations.

### Actions

| Action | Description | Required Params |
|--------|-------------|-----------------|
| `execute` | Run SELECT query | `sql` |
| `describe` | Get table structure | `tableName` |
| `health` | Check connection | - |

### Examples

**Execute query:**
```typescript
await agent.executeTool('database', {
  action: 'execute',
  sql: 'SELECT TOP 10 * FROM users',
  connectionString: process.env.DATABASE_URL
});
// Returns: { success: true, rows: [...], rowCount: 10 }
```

**Describe table (reads from schema first):**
```typescript
await agent.executeTool('database', {
  action: 'describe',
  tableName: 'User'
});
// Returns: { 
//   tableName: 'User',
//   source: 'schema',  // or 'database' if not in schema
//   columns: [...]
// }
```

**Health check:**
```typescript
await agent.executeTool('database', {
  action: 'health',
  connectionString: process.env.DATABASE_URL
});
// Returns: { connected: true, serverVersion: '...', latencyMs: 12 }
```

---

## generateClientCode

Generate type-safe client code from schema, for any language the ORM supports:
`typescript`, `python`, `dotnet`, `golang` or `rust`.

```typescript
await agent.executeTool('generateClientCode', {
  schemaPath: 'an5Schema',
  language: 'rust'  // or 'typescript' | 'python' | 'dotnet' | 'golang'
});
// Returns: { success: true, files: [...], message: '...' }
```

The tool runs the real `@an5/orm` generator, so its output matches
`npm run generate` — the same files, with the same relations, filters and
metadata. Without `outputDir` it generates into a temporary directory, reads the
artifacts back and cleans up.

```typescript
// Write straight into the project
await agent.executeTool('generateClientCode', {
  schemaPath: 'an5Schema',
  language: 'typescript',
  outputDir: 'an5Client/typescript',
});
```

---

## analyzeSchema

Analyze schema for design issues.

```typescript
await agent.executeTool('analyzeSchema', {
  schemaPath: 'an5Schema'
});
// Returns: { 
//   issues: [...],
//   summary: { totalModels, totalFields, missingPrimaryKeys }
// }
```

---

## retrieve

Semantic search over schema and query samples.

### Types

| Type | Description |
|------|-------------|
| `schema` | Find model definitions |
| `queries` | Find SQL examples |

### Examples

**Search schema:**
```typescript
await agent.executeTool('retrieve', {
  type: 'schema',
  query: 'user authentication and permissions',
  k: 3  // Optional: max results
});
// Returns: { results: [...], query: '...' }
```

**Search query samples:**
```typescript
await agent.executeTool('retrieve', {
  type: 'queries',
  query: 'aggregate sales by month'
});
// Returns: { results: [...], query: '...' }
```

---

## task

Manage tasks from code reviews.

### Actions

| Action | Description | Required Params |
|--------|-------------|-----------------|
| `create` | Create task from issue | `type`, `description` |
| `list` | List tasks | - (optional: `status`, `priority`) |
| `update` | Update task | `taskId` + `status`/`priority` |
| `delete` | Delete task | `taskId` |

### Examples

**Create task:**
```typescript
await agent.executeTool('task', {
  action: 'create',
  type: 'BUG',
  description: 'User email not validated properly',
  file: 'src/services/user.ts'
});
// Returns: { id: '...', title: '...', priority: 'medium', status: 'todo' }
```

**List tasks:**
```typescript
await agent.executeTool('task', {
  action: 'list',
  status: 'todo',
  priority: 'high'
});
// Returns: [{ id: '...', title: '...', ... }]
```

**Update task:**
```typescript
await agent.executeTool('task', {
  action: 'update',
  taskId: 'task-abc123',
  status: 'in-progress'
});
```

**Delete task:**
```typescript
await agent.executeTool('task', {
  action: 'delete',
  taskId: 'task-abc123'
});
// Returns: true
```

---

## Natural Language Processing

```typescript
import { An5Agent } from '@an5/agent';

// Registers the 7 default tools; optionally pass extra tools
const agent = new An5Agent();

// Ask questions in natural language
const result = await agent.process({
  userQuestion: 'Show me all users with their recent orders',
  toolContext: { connectionString: process.env.DATABASE_URL }
});

console.log(result.toolCalls);
console.log(result.answer);
```

## Best Practices

1. **Use `schema` tool first** - Understand your data structure before querying
2. **Validate with `query` tool** - Always validate SQL before executing
3. **Read from schema** - `database describe` reads from `.an5` files first
4. **Use parameterized queries** - Prevent SQL injection
5. **Check health** - Verify connection before operations
