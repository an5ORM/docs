---
layout: page
title: Database Providers
description: Complete guide for all supported AN5 ORM database and vector providers including PostgreSQL, SQL Server, MySQL, SQLite, Google Sheets, and dedicated vector databases (NBase, Qdrant, Chroma, Pinecone, Weaviate, Milvus).
---

{% assign code = page.docs_code | default: 'typescript' %}
{% assign provider = page.docs_provider | default: 'sqlite' %}

# Database Providers

<p class="guide-note">
  <strong>Selected Provider:</strong> You are currently viewing documentation targeting <strong>{{ provider | capitalize }}</strong>.
  The specifications, connection string formats, and type mappings below are aligned with your selection.
</p>

AN5 ORM supports relational databases, Google Sheets serverless tables, and 6 dedicated vector database engines.

---

## Quick Comparison

| Provider | Protocol | Dialect | Pagination | Parameters | Vector Search | CLI Push / Migrate |
|---|---|---|---|---|---|---|
| **PostgreSQL** | `postgres://`, `postgresql://` | Postgres SQL | `LIMIT / OFFSET` | `%s`, `$1` | Native via `pgvector` | `db:push` |
| **SQL Server** | `sqlserver://` | T-SQL | `OFFSET ... FETCH` | `@p_0`, `?` | Native (2025) / In-memory | `db:push`, `db:pull`, `db:migrate` |
| **MySQL** | `mysql://`, `mariadb://` | MySQL / MariaDB | `LIMIT / OFFSET` | `?` | In-memory fallback | `db:push` |
| **SQLite** | `sqlite://`, `.db`, `.sqlite` | SQLite3 | `LIMIT / OFFSET` | `?` | Native (sqlite-vec / built-in distance functions / `json_each`) | `db:push` |
| **Google Sheets** | `googlesheets://` | In-memory query | Array slicing | N/A | Not supported | Serverless sync |
| **Vector DBs** (NBase, Qdrant, Chroma, Pinecone, Weaviate, Milvus) | `nbase://`, `qdrant://`, `chroma://`, `pinecone://`, `weaviate://`, `milvus://` | Vector Engine | Vector `topK` | N/A | Native Vector Store / ANN | Vector indexing |

---

## 1. PostgreSQL

### Connection String
```ini
DATABASE_URL=postgres://user:password@localhost:5432/dbname?sslmode=disable
# or
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### Features & Capabilities
* **Dialect**: Standard ANSI SQL with PostgreSQL extensions.
* **Pagination**: Uses `LIMIT {take} OFFSET {skip}`.
* **Parameters**: Placeholder `%s` in Python, `$1, $2` in native drivers.
* **Types**: Supports `INTEGER`, `BIGINT`, `TEXT`, `VARCHAR`, `BOOLEAN`, `TIMESTAMP WITH TIME ZONE`, `JSONB`, `BYTEA`.
* **Vector Search**: Native integration with `pgvector` extension. Cosine distance (`<=>`), L2 distance (`<->`), and inner product (`<#>`).

---

## 2. SQL Server (MSSQL)

### Connection String
```ini
DATABASE_URL=sqlserver://localhost:1433;database=mydb;user=sa;password=YourPassword123!;trustServerCertificate=true
```

### Features & Capabilities
* **Dialect**: Microsoft Transact-SQL (T-SQL).
* **Pagination**: Uses `ORDER BY ... OFFSET {skip} ROWS FETCH NEXT {take} ROWS ONLY`.
* **Parameters**: Placeholders `@p_0`, `@p_1` or `?`.
* **Types**: Supports `INT`, `BIGINT`, `NVARCHAR`, `VARCHAR`, `BIT`, `DATETIME2`, `VARBINARY`.
* **Schema Tools**: Full support for `db:push`, `db:pull`, `db:migrate:*`, and schema catalog reflection via `sys.*`.
* **Vector Search**: Native support in SQL Server 2025 via `VECTOR_DISTANCE()`, with automatic fallback to in-memory cosine ranking on earlier versions.

---

## 3. MySQL / MariaDB

### Connection String
```ini
DATABASE_URL=mysql://user:password@localhost:3306/mydb
# or
DATABASE_URL=mariadb://user:password@localhost:3306/mydb
```

### Features & Capabilities
* **Dialect**: MySQL 8.0+ and MariaDB 10.5+.
* **Pagination**: Uses `LIMIT {take} OFFSET {skip}`.
* **Identifiers**: Enclosed in backticks (`` `table`.`column` ``).
* **Parameters**: Positional `?` placeholders.
* **Types**: Supports `INT`, `BIGINT`, `VARCHAR`, `TEXT`, `TINYINT(1)` for boolean, `DATETIME`, `JSON`.

---

## 4. SQLite

### Connection String
```ini
DATABASE_URL=sqlite://./dev.db
# or relative file path
DATABASE_URL=./dev.db
```

### Features & Capabilities
* **Dialect**: SQLite3 embedded engine.
* **Zero Configuration**: No standalone database server required; operates directly on local disk or `:memory:`.
* **Pagination**: Uses `LIMIT {take} OFFSET {skip}`.
* **Parameters**: Positional `?` placeholders.
* **Vector Search**: A `VECTOR(n)` column stores a BLOB of little-endian float32, and the search is ranked inside the database — by [sqlite-vec](https://github.com/asg017/sqlite-vec) when it loads, otherwise by the runtime's own `an5_vec_*` functions or `json_each`. No extension is required. See [Vector Search]({{ '/' | append: code | append: '/' | append: provider | append: '/guides/vector-search/' | relative_url }}#sqlite) for which strategy each runtime reaches.
* **Ideal for**: Rapid local development, integration tests, and edge/desktop applications.

---

## 5. Google Sheets

### Connection String
```ini
DATABASE_URL=googlesheets://spreadsheet_id?credentials=./service-account.json
```

### Features & Capabilities
* **Serverless Storage**: Uses Google Spreadsheet tabs as structured database tables.
* **Query Execution**: Evaluates structured queries, filters, and projections in memory over sheet rows.
* **Use Cases**: Lightweight CMS, rapid prototyping, admin data entry without running database servers.

---

## 6. Dedicated Vector Databases (NBase, Qdrant, Chroma, Pinecone, Weaviate, Milvus)

AN5 ORM supports 6 specialized vector database engines through a unified abstraction, usable either as a primary vector database or as a sidecar vector store paired with a SQL database.

### Connection Strings

```ini
# NBase
DATABASE_URL=nbase://localhost:1307?token=secret&method=hnsw

# Qdrant
DATABASE_URL=qdrant://localhost:6333?collection=articles&apiKey=secret

# Chroma / ChromaDB
DATABASE_URL=chroma://localhost:8000?collection=articles&tenant=default_tenant&database=default_database

# Pinecone
DATABASE_URL=pinecone://my-index-svc.region.pinecone.io?apiKey=pcsk_secret&namespace=articles

# Weaviate
DATABASE_URL=weaviate://localhost:8080?className=Article&apiKey=secret

# Milvus / Zilliz Cloud
DATABASE_URL=milvus://localhost:19530?collection=articles&token=root:Milvus&dbName=default
```

### Features & Capabilities
* **Unified REST Clients**: Zero third-party SDK dependencies across all runtimes (TypeScript, Python, .NET, Go, Rust, Java, Kotlin, Swift).
* **Dual Operation Modes**:
  - **Sidecar Mode**: Configured via `vectorStore: '...'` on a relational adapter (`sqlite://`, `postgres://`, `sqlserver://`). Stores embeddings in the vector database while keeping primary entities in SQL. Sync with `indexVectors()` and search with `vectorSearch()`.
  - **Vector-Only Mode**: Connects directly to the vector store without an underlying relational database.
* **Automatic Fallback**: If the external vector engine experiences an outage or timeout, queries automatically degrade gracefully to relational vector engines or in-memory similarity without throwing unhandled exceptions.
