---
layout: page
title: Vector Search
description: AI-powered semantic search with NBase, SQL Server, PostgreSQL, or in-memory
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

The TypeScript runtime tries the backends in this order and uses the first one that works. Other runtimes have their own provider support; use the examples for your stack below.

| Order | Backend | Needs |
|-------|---------|-------|
| 1 | [NBase](https://github.com/N2FlowJS/nbase) — Neural Vector Database | An NBase endpoint |
| 2 | PostgreSQL | pgvector extension |
| 3 | SQL Server 2025 | `VECTOR_DISTANCE` |
| 4 | In-memory | Nothing, but the whole table is loaded |

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
`VECTOR_DISTANCE`, or the `pgvector` extension on PostgreSQL. On earlier
instances the ORM automatically falls back to an in-memory cosine-distance
search.

### 2. Create Vector Fields

```an5
model Document {
  id        NVARCHAR(1000)  @id @default(uuid())
  title     NVARCHAR(255)
  content   TEXT
  embedding VARBINARY(8000) @description("Vector embedding for semantic search")
  
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
    embedding: Buffer.from(new Float32Array(embedding).buffer)
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
