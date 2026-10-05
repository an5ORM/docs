---
layout: page
title: Advanced Queries
description: Complex query patterns with filtering, sorting, and aggregation in every client language
---

# Advanced Queries

`@an5/adapters` provides powerful query capabilities for complex data retrieval across SQL dialects (MSSQL, PostgreSQL, MySQL, SQLite) and Google Sheets.

{% include queries-context.html %}

{% if queries_available %}
{% if code == "typescript" %}

## Setup

```typescript
import { createAn5Adapter } from '@an5/adapters';

const db = createAn5Adapter({
  connectionString: process.env.DATABASE_URL!,
});
```

## Filtering

### Comparison Operators

```typescript
const users = await db.user.findMany({
  where: {
    // Equal
    status: 'active',
    
    // Not equal
    status: { not: 'banned' },
    
    // Comparison
    age: { gte: 18 },
    score: { gt: 100 },
    views: { lt: 1000 },
    orderCount: { lte: 10 }
  }
});
```

### String Operators

```typescript
const users = await db.user.findMany({
  where: {
    // Contains
    email: { contains: '@example.com' },
    
    // Starts with
    name: { startsWith: 'John' },
    
    // Ends with
    name: { endsWith: 'son' },
    
    // In list
    role: { in: ['admin', 'moderator'] },
    
    // Not in list
    role: { notIn: ['banned', 'suspended'] }
  }
});
```

### Logical Operators

```typescript
const users = await db.user.findMany({
  where: {
    OR: [
      { role: 'admin' },
      { role: 'moderator' }
    ],
    AND: [
      { isActive: true },
      { createdAt: { gte: lastMonth } }
    ],
    NOT: {
      status: 'banned'
    }
  }
});
```

## Sorting

```typescript
const users = await db.user.findMany({
  orderBy: [
    { role: 'asc' },
    { createdAt: 'desc' }
  ]
});
```

## Pagination

### Offset-based

```typescript
const users = await db.user.findMany({
  skip: 20,  // Skip first 20
  take: 10   // Take next 10
});
```

When `skip` is used, dialect-aware pagination is automatically generated (`LIMIT/OFFSET` for PostgreSQL/MySQL/SQLite, `OFFSET/FETCH` for MSSQL).

## Aggregations

### Basic Aggregations

```typescript
const stats = await db.order.aggregate({
  _count: true,
  _sum: { total: true },
  _avg: { total: true },
  _min: { total: true },
  _max: { total: true }
});

console.log({
  count: stats._count._all,
  total: stats._sum.total,
  average: stats._avg.total,
  min: stats._min.total,
  max: stats._max.total
});
```

### Group By

```typescript
const ordersByUser = await db.order.groupBy({
  by: ['status'],
  where: { total: { gte: 10 } },
  orderBy: { status: 'asc' },
  skip: 0,
  take: 10,
  _count: true,
  _sum: { total: true }
});
```

## Nested Relation Pagination

Inside `include`, `skip` and `take` paginate the related rows **per parent row**:

```typescript
const users = await db.user.findMany({
  include: {
    posts: {
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 5,    // first 5 posts for each user
    }
  }
});
```

## Select Specific Fields

```typescript
const users = await db.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
    _count: true,
  }
});
```

## Complex Query Example

```typescript
// Find active users with published posts, ordered by join date
const users = await db.user.findMany({
  where: {
    isActive: true,
  },
  include: {
    posts: {
      select: {
        id: true,
        title: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    },
    _count: true
  },
  orderBy: { createdAt: 'desc' },
  take: 10
});
```

{% unless provider == 'googlesheets' %}

## Raw SQL Queries

For queries where you need direct SQL execution:

```typescript
const users = await db.$queryRawUnsafe(
  'SELECT id, email FROM users WHERE email = @p_0',
  'reader@example.com'
);
```

{% endunless %}
{% endif %}

## Client query capabilities

The examples above use `@an5/adapters` for TypeScript. The generated clients cover
the same ground for the other languages, but **not evenly** — each one is generated
from the same schema and the query surface differs:

| | TypeScript | Python | .NET | Go | Rust | Java | Kotlin | Swift |
|---|---|---|---|---|---|---|---|---|
| Read rows | `findMany` | `find_many` | `FindMany` | `FindMany` | `find_many` | `findMany` | `findMany` | `findMany` |
| Filter | `where` object | `where` dict | SQL predicate | typed structs | typed structs | `An5Query.where` | query block | `Query(filter:)` |
| Sort | `orderBy` | `order_by` | in the SQL you write | `*SortOrder` | `SortOrder` | `An5Query.orderBy` | `orderBy(...)` | `Query.orderBy` |
| Paginate | `skip` / `take` | `skip` / `take` | in the SQL you write | `Skip` / `Take` | `skip` / `take` | `skip` / `take` | `skip` / `take` | `skip` / `take` |
| Select columns | `select` | `select` | — | `Select` | `select` | `select` | `select` | `select` |
| Load relations | `include` | `include` | — | — | — | `include` | `include` | `include` |
| Aggregate | `aggregate` | `aggregate` | `Count` only | — | through `table()` | `aggregate` | `aggregate` | `aggregate` |
| Group by | `groupBy` | `group_by` | — | — | through `table()` | `groupBy` | `groupBy` | `groupBy` |
| Raw SQL | `$queryRawUnsafe` | `query_raw` | `QueryRaw` | `QueryRaw` | `adapter().query_raw` | `queryRaw` | `query` | `query` |

The examples below use the fields of the generated example schema — `User` with
`id`, `email`, `name`, `createdAt`, and `Order` with `userId`, `total` — so the
queries line up across languages.

{% if code == "python" %}

### Python

```python
from an5_client import An5Client

db = An5Client()  # reads DATABASE_URL

users = db.user.find_many(
    where={
        "email": {"contains": "@example.com"},
        "createdAt": {"gte": "2026-01-01"},
    },
    order_by={"createdAt": "desc"},
    skip=0,
    take=10,
    select=["id", "email", "createdAt"],
)
```

The calls are synchronous and rows come back as plain dicts.

```python
stats = db.order.aggregate(
    where={"total": {"gte": 10}},
    _count=True,
    _sum={"total": True},
    _avg={"total": True},
    _min={"total": True},
    _max={"total": True},
)

print(stats["_count"], stats["_sum_total"], stats["_avg_total"])

by_user = db.order.group_by(
    by=["userId"],
    where={"total": {"gte": 10}},
    order_by={"userId": "asc"},
    take=10,
    _sum={"total": True},
)
# [{"userId": "...", "_count": 3, "_sum_total": 120.0}, ...]
```

Two differences from TypeScript are worth knowing:

- **The aggregate result is flat.** Keys are `_count`, `_sum_total`, `_avg_total`;
  there is no `_count._all`.
- **`take` is what turns pagination on.** `skip` on its own is ignored, so always
  pass `take` when paging.

Filter keys go into SQL as column names and stay camelCase. The generated
`StringFilter` dataclasses use snake_case names (`starts_with`, `not_in`) that the
parser does not read — pass plain dicts, not those dataclasses.

```python
rows = db.query_raw(
    "SELECT userId, SUM(total) AS revenue FROM orders GROUP BY userId",
)
```

There is no `@p_0` rewriting, so write the placeholders your dialect expects:
`%s` on PostgreSQL, `?` on SQL Server and SQLite.

{% endif %}

{% if code == "dotnet" %}

### .NET (C#)

The generated .NET client takes a **SQL predicate**, not a filter object, and has
no `orderBy`, `select`, or relation loading — sorting and paging are part of the
predicate you write:

```csharp
using An5Orm;
using An5Orm.Entities;

var db = new An5DbContext();  // reads DATABASE_URL

var users = db.User.FindMany(
    "email LIKE @email AND createdAt >= @since",
    new Dictionary<string, object>
    {
        ["email"] = "%@example.com%",
        ["since"] = new DateTime(2026, 1, 1),
    });

// SQL Server: OFFSET/FETCH does not accept parameters, so the page numbers are
// inlined. PostgreSQL and SQLite use "LIMIT @take OFFSET @skip".
var page = db.User.FindMany(
    "email LIKE @email ORDER BY createdAt DESC {% if provider == 'sqlserver' %}OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY{% else %}LIMIT 10 OFFSET 20{% endif %}",
    new Dictionary<string, object> { ["email"] = "%@example.com%" });

var activeCount = db.User.Count("email LIKE @email",
    new Dictionary<string, object> { ["email"] = "%@example.com%" });
```

There is no `aggregate` or `groupBy`. `Count` covers counting rows; anything else
goes through raw SQL:

```csharp
var revenue = db.Order.QueryRaw(
    "SELECT COALESCE(SUM(total), 0) AS revenue FROM orders WHERE total >= @min",
    new Dictionary<string, object> { ["min"] = 10 });
```

The client is synchronous throughout — there is no `FindManyAsync`.

{% endif %}

{% if code == "golang" %}

### Go

```go
connStr := an5.GetDefaultConnectionString()
conn, err := sql.Open("{% case provider %}{% when 'postgresql' %}postgres{% when 'sqlite' %}sqlite3{% else %}sqlserver{% endcase %}", connStr)  // register the selected database/sql driver first
if err != nil {
	log.Fatal(err)
}
defer conn.Close()

db := an5.NewAn5DbContextWithConnStr(conn, connStr)
ctx := context.Background()

since := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
take, skip := 10, 0

users, err := db.User.FindMany(ctx, &an5.UserFindManyArgs{
	Where: &an5.UserWhereInput{
		Email:     &an5.StringFilter{Contains: an5.StringPtr("@example.com")},
		CreatedAt: &an5.DateTimeFilter{Gte: &since},
	},
	OrderBy: &an5.UserOrderByInput{
		CreatedAt: an5.SortOrderPtr(an5.SortOrderDesc),
	},
	Take:   &take,
	Skip:   &skip,
	Select: []string{"id", "email", "created_at"},
})
```

Every call takes a `context.Context` and returns `([]T, error)`. `Take` and `Skip`
are pointers, and both have to be set for the page to be applied.

Counting and raw SQL are available; `aggregate` and `groupBy` are not:

```go
n, err := db.Order.Count(ctx, &an5.OrderCountArgs{
	Where: &an5.OrderWhereInput{
		Total: &an5.IntFilter{Gte: an5.IntPtr(10)},
	},
})

rows, err := db.Order.QueryRaw(ctx,
	"SELECT userId, SUM(total) AS revenue FROM orders GROUP BY userId")
```

Two things to know about the Go client:

- It writes columns in `snake_case` (`created_at`), whatever the schema declares.
- `NotIn` is declared on the filter types but never turned into SQL, so setting it
  silently does nothing. `In` works.

{% endif %}

{% if code == "rust" %}

### Rust

```rust
use an5_client::{An5Client, DateTimeFilter, SortOrder, StringFilter,
                 UserFindManyArgs, UserOrderByInput, UserWhereInput};

let db = An5Client::connect(&conn_str).await?;

let users = db.user().find_many(&UserFindManyArgs {
    where_: Some(UserWhereInput {
        email: Some(StringFilter {
            contains: Some("@example.com".to_string()),
            ..Default::default()
        }),
        created_at: Some(DateTimeFilter {
            gte: Some(since),
            ..Default::default()
        }),
        ..Default::default()
    }),
    order_by: Some(UserOrderByInput {
        created_at: Some(SortOrder::Desc),
        ..Default::default()
    }),
    take: Some(10),
    skip: 0,
    select: Some(vec!["id".to_string(), "email".to_string()]),
}).await?;
```

Everything is `async`, and the result is a `Result`. The per-model handles do not
expose `aggregate` or `groupBy`, but the adapter underneath does — reach it with
`table()`:

```rust
use an5_adapters::AggregateArgs;
use serde_json::json;

let agg = db.table("Order").aggregate(&AggregateArgs {
    sum: Some(json!(["total"])),
    ..Default::default()
}).await?;

println!("{}", agg["_count"]);       // COUNT(*) is always included
println!("{}", agg["_sum_total"]);

let rows = db.adapter()
    .query_raw("SELECT userId, SUM(total) AS revenue FROM orders GROUP BY userId", &[])
    .await?;
```

Two things to know about the Rust client:

- The aggregate result is **flat** — `agg["_sum_total"]`, not `agg["_sum"]["total"]` —
  and `_sum`/`_avg`/`_min`/`_max` take a JSON array of column names.
- `in_list` on the filter types serializes to `inList`, which is not an operator the
  query builder knows, so it is dropped. Use `not_in`, or pass the filter as JSON:
  `json!({ "email": { "in": ["a@b.test", "c@d.test"] } })`.

{% endif %}
{% endif %}

## Next Steps

- [Relations]({{ '/guides/relations/' | relative_url }}) - Model relationships & nested writes
- [Deployment]({{ '/guides/deployment/' | relative_url }}) - Production configuration
