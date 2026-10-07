---
layout: page
title: Vector Search
description: AI-powered semantic search with NBase, SQL Server, PostgreSQL, SQLite, or in-memory
---

# Vector Search

an5 ORM includes built-in vector search capabilities for AI and machine learning applications.

## Overview

Vector search allows you to find similar items based on semantic meaning rather than exact matches. This is useful for:

- Semantic search in documentation
- Recommendation systems
- Image similarity search
- Natural language queries

## Choosing a backend

The TypeScript runtime tries the backends in this order and uses the first one that works. Other runtimes have their own provider support; switch the language and provider in the header toolbar above to see code for your stack.

| Order | Backend | Needs |
|-------|---------|-------|
| 1 | [NBase](https://github.com/N2FlowJS/nbase) — Neural Vector Database | An NBase endpoint |
| 2 | PostgreSQL | pgvector extension |
| 3 | SQL Server 2025 | `VECTOR_DISTANCE` |
| 4 | SQLite | [sqlite-vec](https://github.com/asg017/sqlite-vec), or nothing |
| 5 | In-memory | Nothing, but the whole table is loaded |

Use NBase when the embedding table is too large to scan: the vectors live in the
vector database and the rows stay in your table, so a search never loads the
table into memory.

{% include vector-context.html %}

{% assign selected_code = page.docs_code | default: "typescript" %}
{% if selected_code == "typescript" %}

## TypeScript reference across backends

The following sections cover all TypeScript backends, including optional NBase integration. Use the selected-provider example above as your starting point.

## Setup

### 1. Enable Vector Search

For the in-database backends, native support requires **SQL Server 2025** for
`VECTOR_DISTANCE`, the `pgvector` extension on PostgreSQL, or the `sqlite-vec`
extension on SQLite. On earlier instances the ORM automatically falls back to
an in-memory cosine-distance search.

SQLite needs no extension at all: the adapters register their own
`an5_vec_cosine` / `an5_vec_l2` / `an5_vec_ip` functions where the driver allows
it, and rank the column with `json_each` where it does not. See
[SQLite](#sqlite) below.

### 2. Create Vector Fields

Declare the column as `VECTOR(n)` and the runtime stores what the provider
needs: the native `VECTOR` type on SQL Server and PostgreSQL, a BLOB of float32
on SQLite. SQLite has no vector type, so the schema's declaration only names the
column — what ends up in it is the runtime's choice.

```an5
model Document {
  id        NVARCHAR(1000)  @id @default(uuid())
  title     NVARCHAR(255)
  content   TEXT
  embedding VECTOR(1536)    @description("Vector embedding for semantic search")

  @@map("documents")
}
```

### 3. Generate Embeddings

Embeddings are generated with your own embedding provider (e.g. OpenAI), typically
configured through the `EmbeddingConfig` model:

```typescript
// Generate embedding with your provider, e.g. OpenAI text-embedding-3-small
const embedding: number[] = await myEmbeddingProvider.embed(document.content);

// Store with the document
await db.document.create({
  data: {
    title: document.title,
    content: document.content,
    embedding
  }
});
```

## Basic Vector Search

```typescript
// Search for similar documents
const results = await db.document.vectorSearch({
  vector: queryEmbedding,
  vectorField: 'embedding',
  take: 10,
  distanceMetric: 'cosine'
});

console.log(results);
// [{ id: "...", title: "...", content: "...", distance: 0.85 }, ...]
```

## Advanced Vector Search

### With Filters

```typescript
const results = await db.document.vectorSearch({
  vector: queryEmbedding,
  vectorField: 'embedding',
  where: {
    category: 'technical',
    published: true
  },
  take: 5,
  distanceMetric: 'cosine'
});
```

### With Relations

```typescript
const results = await db.document.vectorSearch({
  vector: queryEmbedding,
  vectorField: 'embedding',
  include: {
    author: {
      select: { name: true }
    },
    tags: true
  },
  take: 10
});
```

## NBase — Neural Vector Database

[NBase](https://github.com/N2FlowJS/nbase) is a partitioned vector database with
HNSW, LSH and KNN indexing behind a REST API. an5 can run the similarity search
there while the rows stay in your relational table.

### Configure

NBase is configured with a connection string, like every other backend:

```typescript
const db = createAn5Adapter({
  connectionString: 'sqlserver://localhost:1433;database=mydb',
  nbase: 'nbase://localhost:1307',
});
```

| Form | Result |
|------|--------|
| `nbase://localhost:1307` | `http://localhost:1307` |
| `nbase:localhost:1307` | `http://localhost:1307` |
| `nbase:http://localhost:1307` | `http://localhost:1307` |
| `nbase:https://vectors.example.com` | kept as written |

Options are read from the query string: `?token=…&timeoutMs=…&method=hnsw`.

### Index then search

```typescript
// Once: push the embedding column into NBase.
const { indexed } = await db.document.indexVectorsInNBase({ vectorField: 'embedding' });

// Per query: search runs in NBase, hits are read from the table.
const results = await db.document.vectorSearch({
  vector: queryEmbedding,
  vectorField: 'embedding',
  take: 10,
  distanceMetric: 'cosine',
});
// [{ id: "…", title: "…", content: "…", distance: 0.85 }, ...]
```

Each vector keeps its row id in metadata, so a hit is hydrated from the table by
that id and the result keeps the same `{ ...row, distance }` shape as the other
backends.

### Vector store only

An adapter whose connection string is NBase has no relational database, so a
search returns the hits themselves:

```typescript
const db = createAn5Adapter({ connectionString: 'nbase://localhost:1307' });
await db.$connect();          // probes the endpoint
const hits = await db.table('Document').vectorSearch({ vector: queryEmbedding, take: 5 });
// hits[0] = { id: "Document:42", an5Id: "42", an5Model: "Document", distance: 0.11 }
```

### Standalone client

```typescript
import { createNBaseVectorClient } from '@an5/adapters/nbase';

const nbase = createNBaseVectorClient({ url: 'http://localhost:1307' });
await nbase.health();
await nbase.addVectors([{ id: 'a:1', vector: [0.1, 0.2], metadata: { an5Id: '1' } }]);
const { results } = await nbase.search([0.1, 0.2], { k: 5, distanceMetric: 'cosine' });
```

### When NBase is unavailable

A NBase outage logs a warning and falls through to the next backend, so losing
the vector store degrades performance rather than breaking queries.


## Distance Metrics

| Metric | Description | Use Case |
|--------|-------------|----------|
| `cosine` | Cosine distance | General purpose, recommended |
| `euclidean` | Euclidean distance | When magnitude matters |
| `dot` | Dot product | When vectors are normalized. NBase only implements cosine and euclidean, so a `dot` request searches with cosine |

## Hybrid Search

Combine vector search with traditional filters:

```typescript
const results = await db.document.vectorSearch({
  vector: queryEmbedding,
  vectorField: 'embedding',
  where: {
    AND: [
      { category: { in: ['tech', 'science'] } },
      { createdAt: { gte: lastMonth } },
      { views: { gte: 100 } }
    ]
  },
  take: 20
});
```

Results are always returned ordered by `distance` ascending (closest first).

## SQLite

SQLite has no vector type, so a `VECTOR(n)` column stores a **BLOB of
little-endian float32** — 4 bytes per dimension, about a third of the JSON text
it replaces. Write a plain array of numbers and the adapters encode it for you;
read it back and you get the same array, so nothing in your code deals with
bytes.

```typescript
await db.document.create({
  data: { title: 'RAG overview', content: '...', embedding: queryEmbedding }
});

const row = await db.document.findFirst({ where: { title: 'RAG overview' } });
row.embedding; // number[] — the float32 bytes were decoded
```

A column that already holds JSON text (`'[0.1, 0.2]'`) keeps working: the
adapters read both, so a database written by an older version needs no
migration.

### How the search is ranked

Every runtime tries the same four strategies in order, and uses the first one
that runs:

| Order | Strategy | Needs | Reaches |
|-------|----------|-------|---------|
| 1 | `sqlite-vec` | The extension loaded | `BLOB` columns, and `vec0` tables |
| 2 | `udf` | A driver that can register a function | `BLOB` and legacy text columns |
| 3 | `sql` | JSON1 (built in since SQLite 3.38) | Legacy text columns |
| 4 | `memory` | Nothing | Any column, whole table loaded |

Strategies 1-3 rank inside the database and transfer only the rows that match,
which is the reason to prefer them over the in-memory path. A row whose stored
vector cannot be scored — no vector, another dimension — is left out rather than
reported with a null distance.

Which strategies a given runtime can reach:

| Runtime | `sqlite-vec` | `udf` | `sql` | `memory` |
|---------|--------------|-------|-------|----------|
| TypeScript (`better-sqlite3`) | yes | yes | yes | yes |
| TypeScript (browser `sql.js`) | only in a WASM build that can load one | with `registerFunction` | yes | yes |
| Python (`sqlite3`) | yes | yes | yes | yes |
| .NET (`Microsoft.Data.Sqlite`) | yes | yes | yes | yes |
| Go (`database/sql`) | if the driver loaded it | if the driver registered them | yes | yes |
| Rust (`sqlx`) | no | no | yes | yes |
| Java / Kotlin (JDBC) | if the driver loaded it | no | yes | yes |
| Swift (`CSQLite`) | yes | yes | yes | yes |

`sqlx` pools connections and JDBC has no API for either, which is why those two
reach only the `sql` and `memory` strategies. That still ranks in the database —
the table is not loaded into the client — it just cannot use an ANN index.

### Loading sqlite-vec

[sqlite-vec](https://github.com/asg017/sqlite-vec) adds an approximate nearest
neighbour index, which is what makes a large embedding table fast. Pass the
extension binary when you open the adapter:

```typescript
const db = createAn5Adapter({
  connectionString: 'sqlite:///app.db',
  sqliteVec: './node_modules/sqlite-vec/vec0',
});
```

```python
db = create_an5_adapter("sqlite:///app.db", sqlite_vec="vec0")
```

```swift
SQLiteDriver.sqliteVecPath = "path/to/vec0"
```

For a real ANN index, store the vectors in a
[`vec0` virtual table](https://github.com/asg017/sqlite-vec#virtual-tables)
alongside your own, which is the shape sqlite-vec is indexed for.

### Pinning a strategy

`vectorStrategy` skips the probing and uses one strategy, which is useful for
pinning a benchmark or for reproducing a query exactly:

```typescript
const db = createAn5Adapter({
  connectionString: 'sqlite:///app.db',
  vectorStrategy: 'memory', // or 'sqlite-vec' | 'udf' | 'sql'
});
```

The other runtimes take the same option (`vector_strategy` in Python,
`VectorStrategy` in .NET, `VectorSupport` in Go, `An5.vectorStrategy(...)` in
Kotlin, `An5Adapter.vectorStrategy` in Swift, `vector_strategy` in Rust).

## In-Memory Fallback

Last resort: for development, or when no vector backend is configured,
`vectorSearch` scans the table and compares vectors in memory. No separate store
class is needed — pass the same arguments and the ORM handles the fallback.

It is correct but does not scale: every call loads the matching rows, so reach
for NBase or a native engine once the table grows.

```typescript
const results = await db.document.vectorSearch({
  vector: queryEmbedding,
  take: 5
});
```

## Use Case: RAG Pipeline

```typescript
// 1. Generate the query embedding with your own provider
const queryEmbedding = await myEmbeddingProvider.embed(question);

// 2. Retrieve relevant documents
const relevantDocs = await db.document.vectorSearch({
  vector: queryEmbedding,
  take: 5
});

// 3. Build context and answer with your LLM of choice
const context = relevantDocs
  .map(doc => `Title: ${doc.title}\nContent: ${doc.content}`)
  .join('\n\n');

const answer = await myLlmProvider.complete({
  prompt: `Based on the following context, answer the question: ${question}\n\nContext:\n${context}`
});

return {
  answer,
  sources: relevantDocs
};
```

## Performance Tips

1. **Index your vector columns** for faster similarity search
   - With NBase: `indexVectorsInNBase({ vectorField: 'embedding' })` once, then
     searches run in the vector database instead of scanning the table
2. **Limit results** with `take` to reduce computation
3. **Filter early** with `where` to narrow candidates
4. **Cache embeddings** to avoid regenerating them

{% endif %}

## Next Steps

- [AI Agent]({{ '/guides/agent-tools/' | relative_url }}) - Natural language database queries
- [Raw Queries]({{ '/guides/queries/' | relative_url }}) - Execute raw SQL
