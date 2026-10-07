---
layout: page
title: Schema Definition
description: Define your data models with an5 schema syntax
---

# Schema Definition

an5 uses a declarative schema syntax to define your data models. Schema files use the `.an5` extension.

## Basic Syntax

```an5
model User {
  id        NVARCHAR(1000) @id @default(uuid())
  email     NVARCHAR(255)  @unique
  name      NVARCHAR(255)?
  createdAt DATETIME2      @default(now())

  @@map("users")
}
```

## Model Definition

### Fields

Each field has a name, type, and optional attributes:

```an5
model Post {
  id        NVARCHAR(1000) @id @default(uuid())
  title     NVARCHAR(255)  @description("The post title")
  content   TEXT?
  published BIT            @default(false)
  authorId  NVARCHAR(1000)
}
```

{% assign code = page.docs_code | default: 'typescript' %}
{% assign provider = page.docs_provider | default: 'sqlite' %}

<p class="guide-note">
  <strong>Active Context:</strong> Targeting <strong>{{ provider | capitalize }}</strong> with <strong>{{ code | capitalize }}</strong> client generator.
  Ensure field types in your <code>.an5</code> models align with the {{ provider | capitalize }} dialect requirements below.
</p>

### Field Types

Valid types depend on the database you are generating for. The provider is read from
the connection string (`sqlserver://`, `postgres://`, `mysql://`, `sqlite://`,
`googlesheets://`, or a path ending in `.sqlite`/`.sqlite3`/`.db`); with no connection
string it is SQL Server. A type the provider does not have stops generation with the
field that used it, instead of producing SQL the database rejects later.

This is stricter than before, and deliberately: one shared list used to accept
`INTEGER` for SQL Server and `BIT` for SQLite, so a schema only failed once the
database rejected it. Migrating means replacing each type with the provider's own —
`BOOLEAN` → `BIT` on SQL Server, `DATETIME2` → `DATETIME` or `DATETIME2` kept on SQL
Server but `DATETIME` on SQLite, and so on. The error names the provider and the
field, so a run over the schema lists everything to change at once.

Names that would read as a relation are never types: `USER` and `NAME` are real
PostgreSQL types but are left out on purpose, so `user User @relation(...)` stays a
relation.

Table names follow the provider too. SQL Server is generated as `[dbo].[table]`, as
before; every other provider gets the bare `table`, because the brackets are SQL Server
syntax — `[dbo].[users]` is invalid in PostgreSQL and fails on SQLite with "no such
table: dbo.users". The adapter quotes the name for whichever dialect it is connected
to. A model that declares `@@schema("main")` keeps that prefix everywhere.

<div class="example-tabs">
  <div class="example-tabs-header">
    <button class="tab-btn active" type="button">SQL Server</button>
    <button class="tab-btn" type="button">PostgreSQL</button>
    <button class="tab-btn" type="button">MySQL</button>
    <button class="tab-btn" type="button">SQLite</button>
    <button class="tab-btn" type="button">Google Sheets</button>
  </div>

  <div class="tab-content active" markdown="1">

| Type | Description | Example | TypeScript |
| :--- | :--- | :--- | :--- |
| `NVARCHAR(n)` | Variable-length Unicode string | `NVARCHAR(255)` | `string` |
| `VARCHAR(n)` | Variable-length ASCII string | `VARCHAR(100)` | `string` |
| `CHAR(n)` | Fixed-length string | `CHAR(10)` | `string` |
| `NCHAR(n)` | Fixed-length Unicode string | `NCHAR(10)` | `string` |
| `TEXT` | Large text field | `TEXT` | `string` |
| `NTEXT` | Large Unicode text field | `NTEXT` | `string` |
| `XML` | XML data | `XML` | `string` |
| `INT` | 32-bit integer | `INT` | `number` |
| `BIGINT` | 64-bit integer | `BIGINT` | `number \| bigint` |
| `SMALLINT` | 16-bit integer | `SMALLINT` | `number` |
| `TINYINT` | 8-bit integer | `TINYINT` | `number` |
| `FLOAT` | Floating point | `FLOAT` | `number` |
| `REAL` | Single-precision float | `REAL` | `number` |
| `DECIMAL(p,s)` | Fixed precision | `DECIMAL(10,2)` | `number` |
| `NUMERIC(p,s)` | Fixed precision | `NUMERIC(10,2)` | `number` |
| `MONEY` | Currency amount | `MONEY` | `number` |
| `SMALLMONEY` | Small currency amount | `SMALLMONEY` | `number` |
| `BIT` | Boolean | `BIT` | `boolean` |
| `DATE` | Date only | `DATE` | `Date` |
| `DATETIME` | Date and time | `DATETIME` | `Date` |
| `DATETIME2` | High precision datetime | `DATETIME2` | `Date` |
| `SMALLDATETIME` | Short datetime | `SMALLDATETIME` | `Date` |
| `DATETIMEOFFSET` | Datetime with timezone | `DATETIMEOFFSET` | `Date` |
| `TIME` | Time only | `TIME` | `Date` |
| `UNIQUEIDENTIFIER` | UUID/GUID | `UNIQUEIDENTIFIER` | `string` |
| `VARBINARY(n)` | Variable binary data | `VARBINARY(255)` | `Buffer` |
| `BINARY(n)` | Fixed binary data | `BINARY(16)` | `Buffer` |
| `IMAGE` | Large binary data | `IMAGE` | `Buffer` |
| `ROWVERSION` | Row version timestamp | `ROWVERSION` | `Buffer` |
| `VECTOR` | Vector embedding | `VECTOR(1536)` | `number[] \| string` |
| `GEOGRAPHY` | Spatial data | `GEOGRAPHY` | `string` |
| `GEOMETRY` | Spatial data | `GEOMETRY` | `string` |
| `HIERARCHYID` | Hierarchy tree position | `HIERARCHYID` | `string` |
| `SQL_VARIANT` | Any SQL data type | `SQL_VARIANT` | `any` |

  </div>

  <div class="tab-content" markdown="1">

| Type | Description | Example | TypeScript |
| :--- | :--- | :--- | :--- |
| `VARCHAR(n)` | Variable-length string | `VARCHAR(255)` | `string` |
| `CHAR(n)` | Fixed-length string | `CHAR(10)` | `string` |
| `TEXT` | Large text field | `TEXT` | `string` |
| `UUID` | Universally unique identifier | `UUID` | `string` |
| `INTEGER` | 32-bit signed integer | `INTEGER` | `number` |
| `INT4` | 32-bit signed integer (alias) | `INT4` | `number` |
| `BIGINT` | 64-bit signed integer | `BIGINT` | `number \| bigint` |
| `INT8` | 64-bit signed integer (alias) | `INT8` | `number \| bigint` |
| `SMALLINT` | 16-bit signed integer | `SMALLINT` | `number` |
| `INT2` | 16-bit signed integer (alias) | `INT2` | `number` |
| `SERIAL` | Autoincrementing integer | `SERIAL` | `number` |
| `BIGSERIAL` | Autoincrementing 64-bit integer | `BIGSERIAL` | `number \| bigint` |
| `SMALLSERIAL` | Autoincrementing 16-bit integer | `SMALLSERIAL` | `number` |
| `DECIMAL(p,s)` | Exact numeric | `DECIMAL(10,2)` | `number` |
| `NUMERIC(p,s)` | Exact numeric (alias) | `NUMERIC(10,2)` | `number` |
| `REAL` | Single precision float | `REAL` | `number` |
| `DOUBLE PRECISION` | Double precision float | `DOUBLE PRECISION` | `number` |
| `MONEY` | Currency amount | `MONEY` | `number` |
| `BOOLEAN` | Logical boolean | `BOOLEAN` | `boolean` |
| `BOOL` | Logical boolean (alias) | `BOOL` | `boolean` |
| `DATE` | Calendar date | `DATE` | `Date` |
| `TIME` | Time of day | `TIME` | `Date` |
| `TIMETZ` | Time with time zone | `TIMETZ` | `Date` |
| `TIMESTAMP` | Date and time | `TIMESTAMP` | `Date` |
| `TIMESTAMPTZ` | Timestamp with time zone | `TIMESTAMPTZ` | `Date` |
| `INTERVAL` | Time span | `INTERVAL` | `string` |
| `JSON` | Textual JSON | `JSON` | `any` |
| `JSONB` | Binary JSON | `JSONB` | `any` |
| `BYTEA` | Binary data | `BYTEA` | `Buffer` |
| `INET` | IPv4 or IPv6 host address | `INET` | `string` |
| `CIDR` | IPv4 or IPv6 network spec | `CIDR` | `string` |
| `VECTOR` | pgvector embedding | `VECTOR(1536)` | `number[] \| string` |
| `GEOGRAPHY` | PostGIS geography | `GEOGRAPHY` | `string` |
| `GEOMETRY` | PostGIS geometry | `GEOMETRY` | `string` |

  </div>

  <div class="tab-content" markdown="1">

| Type | Description | Example | TypeScript |
| :--- | :--- | :--- | :--- |
| `VARCHAR(n)` | Variable-length string | `VARCHAR(255)` | `string` |
| `CHAR(n)` | Fixed-length string | `CHAR(10)` | `string` |
| `NVARCHAR(n)` | National variable-length string | `NVARCHAR(255)` | `string` |
| `TEXT` | Large text field | `TEXT` | `string` |
| `TINYTEXT` | Small text field | `TINYTEXT` | `string` |
| `MEDIUMTEXT` | Medium text field | `MEDIUMTEXT` | `string` |
| `LONGTEXT` | Very large text field | `LONGTEXT` | `string` |
| `ENUM(...)` | Enumeration set of values | `ENUM('active','inactive')` | `string` |
| `SET(...)` | Set of permitted values | `SET('read','write')` | `string` |
| `INT` | 32-bit integer | `INT` | `number` |
| `INTEGER` | 32-bit integer (alias) | `INTEGER` | `number` |
| `BIGINT` | 64-bit integer | `BIGINT` | `number \| bigint` |
| `SMALLINT` | 16-bit integer | `SMALLINT` | `number` |
| `TINYINT` | 8-bit integer | `TINYINT` | `number` |
| `MEDIUMINT` | 24-bit integer | `MEDIUMINT` | `number` |
| `SERIAL` | Bigint auto-increment alias | `SERIAL` | `number \| bigint` |
| `FLOAT` | Single-precision float | `FLOAT` | `number` |
| `DOUBLE` | Double-precision float | `DOUBLE` | `number` |
| `DECIMAL(p,s)` | Exact fixed-point | `DECIMAL(10,2)` | `number` |
| `NUMERIC(p,s)` | Exact fixed-point | `NUMERIC(10,2)` | `number` |
| `BOOLEAN` | Boolean (TINYINT(1)) | `BOOLEAN` | `boolean` |
| `BOOL` | Boolean alias | `BOOL` | `boolean` |
| `BIT` | Bit-field flag | `BIT` | `boolean` |
| `DATE` | Date only | `DATE` | `Date` |
| `DATETIME` | Date and time | `DATETIME` | `Date` |
| `TIMESTAMP` | Timestamp with timezone conversion | `TIMESTAMP` | `Date` |
| `TIME` | Time only | `TIME` | `Date` |
| `YEAR` | 4-digit year | `YEAR` | `number` |
| `JSON` | Native JSON document | `JSON` | `any` |
| `BLOB` | Binary large object | `BLOB` | `Buffer` |
| `TINYBLOB` | Small binary object | `TINYBLOB` | `Buffer` |
| `MEDIUMBLOB` | Medium binary object | `MEDIUMBLOB` | `Buffer` |
| `LONGBLOB` | Very large binary object | `LONGBLOB` | `Buffer` |
| `BINARY(n)` | Fixed-length binary | `BINARY(16)` | `Buffer` |
| `VARBINARY(n)` | Variable-length binary | `VARBINARY(255)` | `Buffer` |

  </div>

  <div class="tab-content" markdown="1">

| Type | Description | Example | TypeScript |
| :--- | :--- | :--- | :--- |
| `INTEGER` | Integer value | `INTEGER` | `number` |
| `INT` | Integer affinity | `INT` | `number` |
| `BIGINT` | Large integer | `BIGINT` | `number \| bigint` |
| `TINYINT` | Small integer | `TINYINT` | `number` |
| `SMALLINT` | Small integer | `SMALLINT` | `number` |
| `MEDIUMINT` | Medium integer | `MEDIUMINT` | `number` |
| `REAL` | Floating point value | `REAL` | `number` |
| `FLOAT` | Floating point affinity | `FLOAT` | `number` |
| `DOUBLE` | Double precision affinity | `DOUBLE` | `number` |
| `DECIMAL(p,s)` | Decimal affinity | `DECIMAL(10,2)` | `number` |
| `NUMERIC` | Numeric affinity | `NUMERIC` | `number` |
| `BOOLEAN` | Stored as 0 or 1 | `BOOLEAN` | `boolean` |
| `BOOL` | Boolean alias | `BOOL` | `boolean` |
| `TEXT` | Text string | `TEXT` | `string` |
| `VARCHAR(n)` | Text affinity string | `VARCHAR(255)` | `string` |
| `NVARCHAR(n)` | Text affinity string | `NVARCHAR(255)` | `string` |
| `CHAR(n)` | Text affinity string | `CHAR(10)` | `string` |
| `CLOB` | Character large object | `CLOB` | `string` |
| `DATE` | Stored as ISO text | `DATE` | `Date` |
| `DATETIME` | Stored as ISO text | `DATETIME` | `Date` |
| `TIMESTAMP` | Stored as ISO text | `TIMESTAMP` | `Date` |
| `TIME` | Stored as ISO text | `TIME` | `Date` |
| `BLOB` | Binary data | `BLOB` | `Buffer` |
| `UUID` | UUID string | `UUID` | `string` |
| `JSON` | JSON string | `JSON` | `any` |
| `VECTOR` | Vector embedding, stored as float32 BLOB | `VECTOR(1536)` | `number[] \| string` |

  </div>

  <div class="tab-content" markdown="1">

| Type | Description | Example | TypeScript |
| :--- | :--- | :--- | :--- |
| `STRING` | Cell text value | `STRING` | `string` |
| `VARCHAR` | Text column | `VARCHAR` | `string` |
| `TEXT` | Long text cell | `TEXT` | `string` |
| `INT` | Integer cell value | `INT` | `number` |
| `INTEGER` | Integer cell value | `INTEGER` | `number` |
| `BIGINT` | Large integer value | `BIGINT` | `number \| bigint` |
| `FLOAT` | Number cell value | `FLOAT` | `number` |
| `DOUBLE` | Double number value | `DOUBLE` | `number` |
| `DECIMAL` | Numeric cell value | `DECIMAL` | `number` |
| `BOOLEAN` | Checkbox / TRUE/FALSE cell | `BOOLEAN` | `boolean` |
| `BOOL` | Boolean alias | `BOOL` | `boolean` |
| `DATE` | Date formatted cell | `DATE` | `Date` |
| `DATETIME` | Date & time cell | `DATETIME` | `Date` |
| `BYTES` | Base64 encoded cell | `BYTES` | `Buffer` |
| `BLOB` | Binary cell data | `BLOB` | `Buffer` |
| `VECTOR` | Vector embedding string | `VECTOR(1536)` | `number[] \| string` |

  </div>
</div>

### Optional Fields

Add `?` to make a field optional:

```an5
model User {
  id    NVARCHAR(1000) @id @default(uuid())
  name  NVARCHAR(255)?  // Optional field
  email NVARCHAR(255)   // Required field
}
```

## Attributes

### Primary Key

```an5
model User {
  id NVARCHAR(1000) @id @default(uuid())
}
```

### Unique Constraint

```an5
model User {
  email NVARCHAR(255) @unique
}
```

### Default Values

```an5
model Post {
  id        NVARCHAR(1000) @id @default(uuid())
  status    NVARCHAR(50)   @default("draft")
  views     INT            @default(0)
  createdAt DATETIME2      @default(now())
}
```

### Description

```an5
model User {
  id NVARCHAR(1000) @id @default(uuid()) @description("Primary key")
}
```

## Model Directives

Directives are declared at the model level and control table mapping, constraints, and indexes.

### Table Mapping

Use `@@map()` to map a model to a different table name:

```an5
model User {
  id    NVARCHAR(1000) @id @default(uuid())
  email NVARCHAR(255)

  @@map("app_users")
}
```

### Model Description

```an5
model User {
  id NVARCHAR(1000) @id @default(uuid())

  @@description("User account")
}
```

### Unique Constraints

`@@unique()` declares a unique constraint across one or more fields. Compound
unique constraints are supported:

```an5
model Membership {
  id     NVARCHAR(1000) @id @default(uuid())
  userId NVARCHAR(1000)
  orgId  NVARCHAR(1000)

  @@unique([userId, orgId])
}
```

### Indexes

`@@index()` declares a database index. Advanced options are supported:

```an5
model Order {
  id        NVARCHAR(1000) @id @default(uuid())
  userId    NVARCHAR(1000)
  total     DECIMAL(10,2)
  status    NVARCHAR(50)
  createdAt DATETIME2

  // Simple index
  @@index([userId])

  // Named index (honored in migration diff/generate)
  @@index([userId, createdAt], map: "idx_orders_user_created")

  // Include columns
  @@index([userId], include: [total, status])

  // Filtered index
  @@index([status], filter: "[status] <> 'cancelled'")

  // Index options (e.g. fillfactor)
  @@index([userId], options: "fillfactor=80")
}
```

Supported index options:

| Option    | Description                  | Example                             |
| --------- | ---------------------------- | ----------------------------------- |
| `map`     | Custom index/constraint name | `map: "idx_orders_user"`            |
| `include` | Included (non-key) columns   | `include: [total, status]`          |
| `filter`  | Filtered index predicate     | `filter: "[status] <> 'cancelled'"` |
| `options` | Raw index options            | `options: "fillfactor=80"`          |

Migrations honor mapped index/unique names, include/filter/options metadata,
and `dbo.`-qualified table names when comparing schema with the database.

## Complete Example

```an5
model User {
  id        NVARCHAR(1000) @id @default(uuid()) @description("Primary key")
  email     NVARCHAR(255)  @unique @description("User email")
  name      NVARCHAR(255)? @description("Display name")
  avatar    NVARCHAR(500)? @description("Avatar URL")
  role      NVARCHAR(50)   @default("user") @description("User role")
  isActive  BIT            @default(1) @description("Account status")
  createdAt DATETIME2      @default(now()) @description("Creation date")
  updatedAt DATETIME2      @default(now()) @description("Last update")

  // Relations
  posts     Post[]
  profile   Profile?

  @@description("User account")
  @@map("users")
}

model Post {
  id        NVARCHAR(1000) @id @default(uuid())
  title     NVARCHAR(255)  @description("Post title")
  content   TEXT?          @description("Post content")
  published BIT            @default(0) @description("Published status")
  authorId  NVARCHAR(1000) @description("Author reference")

  // Relations
  author    User           @relation(fields: [authorId], references: [id])
  tags      Tag[]

  @@index([authorId])
  @@map("posts")
}

model Tag {
  id    NVARCHAR(1000) @id @default(uuid())
  name  NVARCHAR(100)  @unique

  posts Post[]

  @@map("tags")
}
```

## Next Steps

- [CRUD Operations]({{ '/guides/crud/' | relative_url }}) - Learn how to query your data
- [Relations]({{ '/guides/relations/' | relative_url }}) - Define relationships between models
- [Advanced Queries]({{ '/guides/queries/' | relative_url }}) - Complex query patterns
