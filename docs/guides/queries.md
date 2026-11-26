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

The examples above use `@an5/adapters` for TypeScript. Every generated client shares the
same query model from the schema, with language-idiomatic builders and a few
runtime-specific differences:

| | TypeScript | Python | .NET | Go | Rust | Java | Kotlin | Swift |
|---|---|---|---|---|---|---|---|---|
| Read rows | `findMany` | `find_many` | `FindMany` | `FindMany` | `find_many` | `findMany` | `findMany` | `findMany` |
| Filter | `where` object | `where` dict / dataclasses | `*WhereInput` (or SQL) | typed `*WhereInput` | typed `*WhereInput` | `An5Query.where` / `*Where` | query block / `*Where` | `Query(filter:)` / `*Where` |
| Sort | `orderBy` | `order_by` | `*OrderByInput` | `*SortOrder` | `SortOrder` | `An5Query.orderBy` | `orderBy(...)` | `Query.orderBy` |
| Paginate | `skip` / `take` | `skip` / `take` | `Skip` / `Take` | `Skip` / `Take` | `skip` / `take` | `skip` / `take` | `skip` / `take` | `skip` / `take` |
| Select columns | `select` | `select` | `Select` | `Select` | `select` | `select` | `select` | `select` |
| Load relations | `include` | `include` | relation filters in `Where` | relation filters in `Where` | `include` via `table()` | `include` | `include` | `include` |
| Aggregate | `aggregate` | `aggregate` | `Aggregate` | `Aggregate` | through `table()` | `aggregate` | `aggregate` | `aggregate` |
| Group by | `groupBy` | `group_by` | `GroupBy` | `GroupBy` | `group_by` | `groupBy` | `groupBy` | `groupBy` |
| Raw SQL | `$queryRawUnsafe` | `query_raw` | `QueryRaw` | `QueryRaw` | `adapter().query_raw` | `queryRaw` | `query` | `query` |

The examples below use the fields of the generated example schema — `User` with
`id`, `email`, `name`, `createdAt`, and `Order` with `userId`, `total` — so the
queries line up across languages.

{% if code == "python" %}

### Python

```python
from an5_client import An5Client
from an5_orm_types import (
    IntFilter,
    NumberFilter,
    OrderAggregateHavingInput,
    OrderGroupByArgs,
    StringFilter,
    UserFindManyArgs,
    UserOrderByInput,
    UserWhereInput,
)

db = An5Client()  # reads DATABASE_URL

users = db.user.find_many(
    UserFindManyArgs(
        where=UserWhereInput(
            email=StringFilter(contains="@example.com", mode="insensitive"),
            created_at={"gte": "2026-01-01"},
        ),
        order_by=UserOrderByInput(created_at="desc"),
        skip=0,
        take=10,
        select=["id", "email", "createdAt"],
    )
)
```

The calls are synchronous and rows come back as plain dicts (plain dict `where` /
`order_by` arguments work identically to the dataclasses).

```python
stats = db.order.aggregate(
    where={"total": {"gte": 10}},
    _count=True,
    _sum={"total": True},
    _avg={"total": True},
    _min={"total": True},
    _max={"total": True},
)

print(stats["_count"]["_all"], stats["_sum"]["total"], stats["_avg"]["total"])

by_user = db.order.group_by(
    OrderGroupByArgs(
        by=["userId"],
        where={"total": {"gte": 10}},
        having=OrderAggregateHavingInput(
            _count={"_all": IntFilter(gte=1)},
            _sum={"total": NumberFilter(gte=100)},
        ),
        order_by={"userId": "asc"},
        take=10,
        _count={"_all": True, "user_id": True},
        _sum={"total": True},
    )
)
# [{"userId": "...", "_count": {"_all": 3, "userId": 3}, "_sum": {"total": 120.0}}, ...]
```

A few Python-specific details are worth knowing:

- **Structured aggregates match TypeScript.** `aggregate()` returns nested dicts such
  as `stats["_count"]["_all"]` and `stats["_sum"]["total"]`, and `group_by()` returns
  nested `_sum`/`_avg`/`_min`/`_max` dicts alongside scalar `_count` (or a dict with
  `_all` plus per-field keys when `_count` is a list/dict).
- **`find_many` requires `take` to apply `skip`.** Always pass `take` when paging
  `find_many`; `group_by` supports `skip` on its own as well as `skip` + `take`.
- **Both schema names and `snake_case` aliases work.** `createdAt`/`created_at`,
  `startsWith`/`starts_with`, and `notIn`/`not_in` (plus `mode="insensitive"`) are
  resolved through generated metadata. Unknown field or operator keys raise `ValueError`.

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

The generated .NET client provides typed `*WhereInput`, `*OrderByInput`,
`*FindManyArgs`, `*AggregateHavingInput`, and `*GroupByArgs` classes alongside
relational `ListRelationFilter<T>` / `RelationFilter<T>` filters:

```csharp
using System;
using System.Collections.Generic;
using An5Orm;
using An5Orm.Entities;

var db = new An5DbContext();  // reads DATABASE_URL

var users = db.User.FindMany(new UserFindManyArgs
{
    Where = new UserWhereInput
    {
        Email = new StringFilter { Contains = "@example.com", Mode = "insensitive" },
        CreatedAt = new DateTimeFilter { Gte = new DateTime(2026, 1, 1) },
    },
    OrderBy = new UserOrderByInput { CreatedAt = "desc" },
    Skip = 0,
    Take = 10,
    Select = new List<string> { "id", "email", "createdAt" },
});

var activeCount = db.User.Count(new UserCountArgs
{
    Where = new UserWhereInput
    {
        Email = new StringFilter { Contains = "@example.com" },
    },
});
```

`Aggregate` and typed `GroupBy` (including `Having` and per-field `_count`) are
available directly on `TableClient<T>` and `ViewClient<T>`:

```csharp
var stats = db.Order.Aggregate(
    count: true,
    sum: new List<string> { "total" },
    avg: new List<string> { "total" });
// Flat keys on Aggregate: stats["_count"], stats["_sum_total"], stats["_avg_total"]

var byUser = db.Order.GroupBy(new OrderGroupByArgs
{
    By = new List<string> { "userId" },
    Having = new OrderAggregateHavingInput
    {
        _sum = new OrderNumericAggregateFilter { Total = new NumberFilter { Gte = 400 } },
    },
    Count = new Dictionary<string, bool> { { "_all", true }, { "userId", true } },
    Sum = new List<string> { "total" },
    OrderBy = new OrderOrderByInput { UserId = "asc" },
    Take = 10,
});
// Typed GroupBy shapes nested sections: byUser[0]["_count"], byUser[0]["_sum"]
```

A few .NET-specific details are worth knowing:

- **Eager `Include` is not on `*FindManyArgs`.** Filter across relations with
  `ListRelationFilter<T>` / `RelationFilter<T>` inside `Where`, or use `QueryRaw`
  when you need custom joins.
- **`Aggregate(...)` returns flat keys (`_sum_total`), while typed
  `GroupBy(OrderGroupByArgs)` returns nested dictionaries (`_sum["total"]`).**
- **The client is synchronous throughout** — there is no `FindManyAsync` — and
  parameterized SQL predicates remain available as overloads on `FindMany`, `Count`,
  and `QueryRaw`:

```csharp
var revenue = db.Order.QueryRaw(
    "SELECT * FROM orders WHERE total >= @min",
    new Dictionary<string, object> { ["min"] = 10 });
```

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

users, err := db.User.FindMany(ctx, &an5.UserFindManyArgs{
	Where: &an5.UserWhereInput{
		Email:     &an5.StringFilter{Contains: an5.StringPtr("@example.com"), Mode: "insensitive"},
		CreatedAt: &an5.DateTimeFilter{Gte: &since},
	},
	OrderBy: &an5.UserOrderByInput{
		CreatedAt: an5.SortOrderPtr(an5.SortOrderDesc),
	},
	Take:   an5.IntPtr(10),
	Skip:   an5.IntPtr(0),
	Select: []string{"id", "email", "created_at"},
})
```

Every call takes a `context.Context` and returns `([]T, error)`. `Take` and `Skip`
are `*int` pointers, and `Skip` works either on its own or paired with `Take`.

Counting, aggregations, typed `GroupBy` (with `Having`), and raw SQL are all
built into `TableClient[T]`:

```go
stats, err := db.Order.Aggregate(ctx, an5.AggregateArgs{
	Count: true,
	Sum:   []string{"total"},
	Avg:   []string{"total"},
})
// Flat keys: stats["_count"], stats["_sum_total"], stats["_avg_total"]

byUser, err := db.Order.GroupBy(ctx, an5.OrderGroupByArgs{
	By: []string{"user_id"},
	Having: &an5.OrderAggregateHavingInput{
		Count: &an5.OrderCountAggregateFilter{All: &an5.IntFilter{Gte: an5.IntPtr(1)}},
		Sum:   &an5.OrderNumericAggregateFilter{Total: &an5.NumberFilter{Gte: an5.Float64Ptr(500)}},
	},
	OrderBy: &an5.OrderOrderByInput{UserId: an5.SortOrderPtr(an5.SortOrderAsc)},
	Take:    an5.IntPtr(10),
	Count:   []string{"_all", "user_id"},
	Sum:     []string{"total"},
})

rows, err := db.Order.QueryRaw(ctx,
	"SELECT * FROM orders WHERE total >= $1", 10)
```

Two things to know about the Go client:

- It defaults column identifiers to `snake_case` (`created_at`), while generated
  metadata resolves schema field names across SQLite, PostgreSQL, and SQL Server.
- `Include` is not on `*FindManyArgs`; use typed `ListRelationFilter[T]` /
  `RelationFilter[T]` in `Where` for correlated relation filtering, and `In` /
  `NotIn` work across string, numeric, integer, and datetime filters.

{% endif %}

{% if code == "rust" %}

### Rust

```rust
use an5_client::{
    An5Client, DateTimeFilter, SortOrder, StringFilter,
    UserFindManyArgs, UserOrderByInput, UserWhereInput,
};

let db = An5Client::connect(&conn_str).await?;

let users = db.user().find_many(&UserFindManyArgs {
    where_: Some(UserWhereInput {
        email: Some(StringFilter {
            contains: Some("@example.com".to_string()),
            mode: Some("insensitive".to_string()),
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

Everything is `async`, and every call returns a `Result`. Typed `group_by` (with
`OrderAggregateHavingInput` and per-field `_count`) is available directly on
each model handle (`db.order().group_by(...)`), while `aggregate`, `include`
eager loading, and raw SQL go through `db.table("Order")` or `db.adapter()`:

```rust
use an5_adapters::AggregateArgs;
use an5_client::{
    NumberFilter, OrderAggregateHavingInput, OrderGroupByArgs,
    OrderNumericAggregateFilter, OrderOrderByInput, SortOrder,
};
use serde_json::json;

let by_user = db.order().group_by(&OrderGroupByArgs {
    by: vec!["user_id".to_string()],
    having: Some(OrderAggregateHavingInput {
        sum: Some(OrderNumericAggregateFilter {
            total: Some(NumberFilter { gte: Some(200.0), ..Default::default() }),
        }),
        ..Default::default()
    }),
    order_by: Some(OrderOrderByInput { user_id: Some(SortOrder::Asc), ..Default::default() }),
    count: Some(json!({ "_all": true, "user_id": true })),
    sum: Some(vec!["total".to_string()]),
    take: Some(10),
    ..Default::default()
}).await?;

println!("count={} sum={}", by_user[0]["_count_user_id"], by_user[0]["sum_total"]);

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

- `aggregate()` returns flat keys like `agg["_sum_total"]`, while `group_by()`
  returns `_count`, `_count_<field>`, and unprefixed `<op>_<field>` keys such as
  `sum_total` / `avg_total`.
- Filter fields use Rust-safe names such as `in_list` and `not_in` (serialized
  with `#[serde(rename = "in")]` / `#[serde(rename = "notIn")]`), and `where_`
  is passed by reference (`&UserFindManyArgs`).

{% endif %}

{% if code == "java" %}

### Java

```java
import an5.adapters.An5Aggregate;
import an5.adapters.An5Query;
import an5.client.An5DbContext;
import an5.client.An5OrmTypes.NumberFilter;
import an5.client.An5OrmTypes.OrderAggregateHaving;
import an5.client.An5OrmTypes.OrderGroupBy;
import an5.client.An5OrmTypes.OrderNumericAggregateFilter;
import an5.client.An5OrmTypes.StringFilter;
import an5.client.An5OrmTypes.UserWhere;
import an5.client.User;

import java.util.List;
import java.util.Map;

try (An5DbContext db = new An5DbContext(System.getenv("DATABASE_URL"))) {
  UserWhere where = new UserWhere();
  where.Email = StringFilter.has("@example.com").insensitive();

  List<User> users = db.getUser().findMany(new An5Query()
      .where(where.toMap())
      .orderBy("createdAt", "desc")
      .skip(0)
      .take(10)
      .select("id", "email", "createdAt"));
}
```

Every model shares one `An5Query`: `where` takes the map `UserWhere.toMap()` produces,
and `orderBy`, `skip`, `take`, `select` and `include` chain onto it. `StringFilter`
also provides `.insensitive()` / `.mode("insensitive")` (or `Filters.insensitive(...)` on
raw maps). Calls are synchronous and throw `SQLException`.

Aggregates and typed `GroupBy` (including `Having` and per-field `count`) live on
the same client:

```java
Map<String, Object> stats = db.getOrder().aggregate(
    new An5Aggregate().count().sum("total").avg("total"));

OrderAggregateHaving having = new OrderAggregateHaving();
having._sum = new OrderNumericAggregateFilter();
having._sum.Total = NumberFilter.atLeast(400);

List<Map<String, Object>> byUser = db.getOrder().groupBy(
    new OrderGroupBy()
        .by("userId")
        .having(having)
        .count("_all", "userId")
        .sum("total")
        .orderBy("userId", "asc")
        .take(10));
```

`count()`, `sum()`, `avg()`, `min()` and `max()` all come back flat and as `Number`
values: `stats.get("_count")`, `stats.get("_sum_total")`. Per-field counts in
`groupBy` appear as `_count_<field>` (and `_count` for `*`).

Raw SQL goes through the context, or through `db.adapter()` for anything the typed
clients miss:

```java
List<Map<String, Object>> rows = db.queryRaw(
    "SELECT userId, SUM(total) AS revenue FROM orders GROUP BY userId");
```

{% endif %}

{% if code == "kotlin" %}

### Kotlin

```kotlin
import an5.adapters.Sort
import an5.client.An5Config
import an5.client.An5Db
import an5.client.An5Orm

An5Db(An5Config.connectionString()).use { db ->
    val users = db.user.findMany {
        where(
            An5Orm.UserWhere(
                email = An5Orm.StringFilter.has("@example.com").insensitive()
            ).build()
        )
        orderBy("createdAt", Sort.DESC)
        skip(0)
        take(10)
        select("id", "email", "createdAt")
    }

    val stats = db.order.aggregate {
        count()
        sum("total")
        avg("total")
    }

    val byUser = db.order.groupBy(
        An5Orm.OrderGroupBy()
            .by("userId")
            .having(
                An5Orm.OrderAggregateHaving(
                    _sum = An5Orm.OrderNumericAggregateFilter(
                        total = An5Orm.NumberFilter.atLeast(400)
                    )
                )
            )
            .count("_all", "userId")
            .sum("total")
            .orderBy("userId", Sort.ASC)
            .take(10)
    )

    val rows = db.query(
        "SELECT userId, SUM(total) AS revenue FROM orders GROUP BY userId")
}
```

`findMany { ... }` uses a `QueryBuilder` block while typed `*GroupBy` /
`*AggregateHaving` builders compile checked `HAVING` clauses and per-field
`count("_all", "userId")`. Aggregate keys are flat — `stats["_count"]`,
`stats["_sum_total"]` — and `db.query` is the raw-SQL escape hatch.

{% endif %}

{% if code == "swift" %}

### Swift

```swift
import An5Adapters
import An5Client

let db = try An5Db(connectionString: try An5Config.connectionString())

var byEmail = An5Orm.UserWhere()
byEmail.email = An5Orm.StringFilter.has("@example.com").insensitive()

let users = try db.user.findMany(Query(
    filter: byEmail.build(),
    orderBy: [["createdAt": "desc"]],
    skip: 0,
    take: 10,
    select: ["id", "email", "createdAt"]
))

var orders = Aggregate()
orders.count = true
orders.sum = ["total"]
orders.average = ["total"]
let stats = try db.order.aggregate(orders)

var having = An5Orm.OrderAggregateHaving()
var sumFilter = An5Orm.OrderNumericAggregateFilter()
sumFilter.total = An5Orm.NumberFilter.atLeast(400)
having._sum = sumFilter

let byUser = try db.order.groupBy(
    An5Orm.OrderGroupBy()
        .by("userId")
        .having(having)
        .count("_all", "userId")
        .sum("total")
        .orderBy([["userId": "asc"]])
        .take(10)
)

let rows = try db.query(
    "SELECT userId, SUM(total) AS revenue FROM orders GROUP BY userId")
```

`Query` and `Aggregate` are value types, and generated `*GroupBy` /
`*AggregateHaving` builders add type-safe `HAVING` filtering and per-field
`count`. Aggregate keys are flat — `stats["_count"]`, `stats["_sum_total"]` —
and `db.query` is the raw-SQL escape hatch.

{% endif %}
{% endif %}

## Next Steps

- [Relations]({{ '/guides/relations/' | relative_url }}) - Model relationships & nested writes
- [Deployment]({{ '/guides/deployment/' | relative_url }}) - Production configuration
