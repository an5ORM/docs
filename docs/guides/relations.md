---
layout: page
title: Relations
description: Define and query relationships between models across client languages and providers
---

# Relations

an5 ORM supports relations between models using foreign keys and declarative schemas.

{% assign code = page.docs_code | default: 'typescript' %}
{% assign provider = page.docs_provider | default: 'sqlite' %}

<p class="guide-note">
  <strong>{{ provider | capitalize }} note:</strong>
  {% case provider %}
  {% when 'postgresql' %}PostgreSQL enforces relational constraints via foreign key indexes. Relations compile to SQL <code>LEFT JOIN</code> or correlated <code>EXISTS</code> / <code>NOT EXISTS</code> subqueries.
  {% when 'sqlserver' %}SQL Server enforces foreign keys via clustered/non-clustered indexes. Relations translate to optimal <code>LEFT JOIN</code> and <code>OUTER APPLY</code> execution plans.
  {% when 'sqlite' %}SQLite foreign keys must be active on the connection (AN5 executes <code>PRAGMA foreign_keys = ON;</code> automatically when opening SQLite connections).
  {% when 'mysql' %}MySQL (InnoDB) enforces foreign keys with automatic index creation on referenced columns.
  {% when 'googlesheets' %}The Google Sheets adapter resolves relations by cross-referencing matching ID columns across individual sheet tabs in memory.
  {% when 'nbase' %}NBase is a neural vector store without native relational foreign keys. When using NBase alongside a relational database, store foreign keys and metadata in your relational tables while referencing vector IDs.
  {% endcase %}
</p>

## Defining Relations

### One-to-Many

```an5
model User {
  id    NVARCHAR(1000) @id @default(uuid())
  email NVARCHAR(255)  @unique
  
  posts Post[]         // One user has many posts
}

model Post {
  id        NVARCHAR(1000) @id @default(uuid())
  title     NVARCHAR(255)
  content   TEXT
  published BOOLEAN       @default(false)
  authorId  NVARCHAR(1000)
  createdAt DATETIME       @default(now())
  
  author   User @relation(fields: [authorId], references: [id])
}
```

### One-to-One

```an5
model User {
  id      NVARCHAR(1000) @id @default(uuid())
  email   NVARCHAR(255)  @unique
  profile Profile?
}

model Profile {
  id     NVARCHAR(1000) @id @default(uuid())
  bio    TEXT
  userId NVARCHAR(1000) @unique
  
  user   User @relation(fields: [userId], references: [id])
}
```

### Many-to-Many

Implicit many-to-many join tables are not generated automatically. Model many-to-many as an explicit join model with two foreign keys:

```an5
model PostTag {
  id     NVARCHAR(1000) @id @default(uuid())
  postId NVARCHAR(1000)
  tagId  NVARCHAR(1000)

  post   Post @relation(fields: [postId], references: [id])
  tag    Tag  @relation(fields: [tagId], references: [id])

  @@map("post_tags")
}
```

## Querying Relations

{% case code %}
{% when 'typescript' %}
### Include Relations

```typescript
// Include all posts for a user
const user = await db.user.findUnique({
  where: { id: 'user-id' },
  include: { posts: true }
});

// Include with filtering, ordering, pagination, and projection
const user = await db.user.findUnique({
  where: { id: 'user-id' },
  include: {
    posts: {
      select: { id: true, title: true },
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    }
  }
});
```

### Relation Filters

To-many filters (`some`, `none`, `every`) and to-one filters (`is`, `isNot`) compile to `EXISTS` / `NOT EXISTS` subqueries:

```typescript
// Find users with at least one published post
const users = await db.user.findMany({
  where: {
    posts: {
      some: { published: true }
    }
  }
});

// Find users where all posts are published
const users = await db.user.findMany({
  where: {
    posts: {
      every: { published: true }
    }
  }
});

// To-one: posts whose author is active
const posts = await db.post.findMany({
  where: {
    author: {
      is: { isActive: true }
    }
  }
});
```

### Nested Create & Connect

```typescript
const user = await db.user.create({
  data: {
    email: 'john@example.com',
    name: 'John',
    posts: {
      create: [
        { title: 'Post 1', content: 'Content 1' },
        { title: 'Post 2', content: 'Content 2' }
      ]
    }
  }
});
```

{% when 'python' %}
### Include Relations in Python

Query related models using dictionary specifications passed to `include`:

```python
# Fetch user with their posts
user = db.user.find_unique(
    where={"id": "user-id"},
    include={"posts": True}
)

# Filtered and ordered relation include
user = db.user.find_unique(
    where={"id": "user-id"},
    include={
        "posts": {
            "where": {"published": True},
            "order_by": {"createdAt": "desc"},
            "take": 5
        }
    }
)
```

Both schema field names (`createdAt`) and `snake_case` aliases (`created_at`)
resolve through generated metadata, and unknown field or relation filter keys
raise `ValueError`.

### Relation Filtering

Python supports `some` / `every` / `none` for to-many relations and `is` / `isNot`
(`is_not`) for to-one relations via correlated `EXISTS` / `NOT EXISTS`
subqueries:

```python
# Users who have at least one published post
users = db.user.find_many(
    where={"posts": {"some": {"published": True}}},
    order_by={"created_at": "desc"},
)

# Posts whose author matches a filter
posts = db.post.find_many(
    where={"author": {"is": {"email": "alice@example.com"}}},
)
```

### Nested Create

```python
user = db.user.create({
    "data": {
        "email": "sarah@example.com",
        "name": "Sarah",
        "posts": {
            "create": [
                {"title": "First Post", "content": "Hello World"}
            ]
        }
    }
})
```

{% when 'dotnet' %}
### Querying Relations in C#

In the generated .NET entity client:

```csharp
// Retrieve user with included posts
var users = db.Users.FindMany(
    where: u => u.Email.Contains("@example.com"),
    include: "Posts"
);

// Access child posts collection
foreach (var user in users)
{
    Console.WriteLine($"{user.Name} has {user.Posts.Count} posts");
}
```

### Creating Child Records

```csharp
var postTable = db.Table<Post>("Post");
postTable.Create(new Post {
    Id = Guid.NewGuid().ToString(),
    Title = "AN5 on .NET",
    AuthorId = authorId
});
```

{% when 'golang' %}
### Querying Relations in Go

In the generated Go client, `metadata.go` emits `RelationMap` and `ModelFields`, and
`*WhereInput` structs support typed `ListRelationFilter[T]` (`Some` / `None` / `Every`)
and `RelationFilter[T]` (`Is` / `IsNull` / `IsNot` / `IsNotNull`) correlated filters as
well as foreign-key filters:

```go
// Users who have at least one published post
users, err := db.User.FindMany(ctx, &an5client.UserFindManyArgs{
    Where: &an5client.UserWhereInput{
        Posts: &an5client.ListRelationFilter[an5client.PostWhereInput]{
            Some: &an5client.PostWhereInput{
                Published: &an5client.BoolFilter{Equals: an5client.BoolPtr(true)},
            },
        },
    },
})
if err != nil {
    return err
}

// Posts whose author has an example.com email (to-one relation filter)
posts, err := db.Post.FindMany(ctx, &an5client.PostFindManyArgs{
    Where: &an5client.PostWhereInput{
        Author: &an5client.RelationFilter[an5client.UserWhereInput]{
            Is: &an5client.UserWhereInput{
                Email: &an5client.StringFilter{EndsWith: an5client.StringPtr("@example.com")},
            },
        },
    },
})
if err != nil {
    return err
}

// Fetch related child posts directly by foreign key
fkPosts, err := db.Post.FindMany(ctx, &an5client.PostFindManyArgs{
    Where: &an5client.PostWhereInput{
        AuthorId: &an5client.StringFilter{Equals: &users[0].Id},
    },
})
for _, post := range fkPosts {
    fmt.Printf("Post: %s\n", post.Title)
}
```

{% when 'rust' %}
### Querying Relations in Rust

In the generated Rust client, `An5Client` registers `relation_map` metadata and
`*WhereInput` structs support typed `ListRelationFilter` (`some` / `none` /
`every`) and `RelationFilter` (`is` / `is_not`) relation filters, as well as
foreign-key filters:

```rust
// Users who have at least one published post
let users = db.user().find_many(&UserFindManyArgs {
    where_: Some(UserWhereInput {
        posts: Some(ListRelationFilter {
            some: Some(Box::new(PostWhereInput {
                published: Some(BoolFilter { equals: Some(true) }),
                ..Default::default()
            })),
            ..Default::default()
        }),
        ..Default::default()
    }),
    ..Default::default()
}).await?;

// Posts whose author has a given email
let posts = db.post().find_many(&PostFindManyArgs {
    where_: Some(PostWhereInput {
        author: Some(RelationFilter {
            is: Some(Some(Box::new(UserWhereInput {
                email: Some(StringFilter {
                    equals: Some("alice@example.com".to_string()),
                    ..Default::default()
                }),
                ..Default::default()
            }))),
            ..Default::default()
        }),
        ..Default::default()
    }),
    ..Default::default()
}).await?;
```

{% when 'java' %}
### Include Relations in Java

```java
import an5.adapters.An5Query;
import an5.client.An5OrmTypes.StringFilter;
import an5.client.An5OrmTypes.UserWhere;
import an5.client.Post;
import an5.client.User;

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

UserWhere byId = new UserWhere();
byId.Id = StringFilter.is(userId);

Map<String, Object> include = new LinkedHashMap<String, Object>();
include.put("posts", true);

User user = db.getUser().findUnique(
    new An5Query().where(byId.toMap()).include(include));
```

The value under the relation name is `true` or an options map. The options are the ones
a query takes — `where`, `orderBy`, `skip`, `take`, `select` and a nested `include`:

```java
Map<String, Object> options = new LinkedHashMap<String, Object>();
options.put("where", Collections.singletonMap("title",
    Collections.singletonMap("contains", "AN5")));
options.put("orderBy", Collections.singletonMap("id", "desc"));
options.put("take", 5);
options.put("select", Arrays.asList("id", "title"));

Map<String, Object> include = new LinkedHashMap<String, Object>();
include.put("posts", options);

User user = db.getUser().findUnique(
    new An5Query().where(byId.toMap()).include(include));
```

### Relation Filters

Java supports to-many (`some` / `every` / `none`) and to-one (`is` / `isNot`)
relation filters via correlated `EXISTS` / `NOT EXISTS` subqueries using
`An5OrmTypes.ListRelationFilter` and `An5OrmTypes.RelationFilter`, and throws
`IllegalArgumentException` for unsupported or mismatched filter operators:

```java
import an5.adapters.An5Query;
import an5.client.An5OrmTypes.BoolFilter;
import an5.client.An5OrmTypes.ListRelationFilter;
import an5.client.An5OrmTypes.PostWhere;
import an5.client.An5OrmTypes.RelationFilter;
import an5.client.An5OrmTypes.StringFilter;
import an5.client.An5OrmTypes.UserWhere;

PostWhere publishedPost = new PostWhere();
publishedPost.Published = BoolFilter.is(true);

UserWhere usersWithPublished = new UserWhere();
usersWithPublished.Posts = ListRelationFilter.some(publishedPost);

List<User> users = db.getUser().findMany(new An5Query().where(usersWithPublished.toMap()));

UserWhere byAuthor = new UserWhere();
byAuthor.Email = StringFilter.is("alice@example.com");

PostWhere postsByAlice = new PostWhere();
postsByAlice.Author = RelationFilter.is(byAuthor);

List<Post> posts = db.getPost().findMany(new An5Query().where(postsByAlice.toMap()));
```

### Nested Create & Connect

One row per call, so a nested create is two calls in one transaction:

```java
Post post = db.transaction(tx -> {
  User author = db.getUser().create(new User().withEmail("john@example.com"));
  return db.getPost().create(
      new Post().withTitle("Post 1").withAuthorId(author.getId()));
});
```

{% when 'kotlin' %}
### Include Relations in Kotlin

```kotlin
import an5.client.An5Orm
import an5.client.Post
import an5.client.User

val user = db.user.findFirst {
    where(An5Orm.UserWhere(id = An5Orm.StringFilter.`is`(userId)).build())
    include(mapOf("posts" to true))
}
```

`findFirst { ... }` takes the query block, so `include` sits next to `where`. The value
under the relation name is `true` or a map of the same options a query takes:

```kotlin
val user = db.user.findFirst {
    where(An5Orm.UserWhere(id = An5Orm.StringFilter.`is`(userId)).build())
    include(mapOf(
        "posts" to mapOf(
            "where" to mapOf("title" to mapOf("contains" to "AN5")),
            "orderBy" to mapOf("id" to "desc"),
            "take" to 5,
            "select" to listOf("id", "title"),
        )
    ))
}
```

### Relation Filters

Kotlin supports to-many (`some` / `every` / `none`) and to-one (`is` / `isNot`)
relation filters via correlated `EXISTS` / `NOT EXISTS` subqueries using
`An5Orm.ListRelationFilter` and `An5Orm.RelationFilter` (or the adapter DSL
`some` / `none` / `every` / `isRelated` / `isNotRelated`), and throws
`IllegalArgumentException` for unsupported or mismatched filter operators:

```kotlin
val publishedPost = An5Orm.PostWhere(published = An5Orm.BoolFilter.`is`(true))
val users = db.user.findMany(
    An5Orm.UserWhere(posts = An5Orm.ListRelationFilter.some(publishedPost)).build()
)

val byAuthor = An5Orm.UserWhere(email = An5Orm.StringFilter.`is`("alice@example.com"))
val posts = db.post.findMany(
    An5Orm.PostWhere(author = An5Orm.RelationFilter.`is`(byAuthor)).build()
)
```

### Nested Create & Connect

One row per call, so a nested create is two calls in one transaction:

```kotlin
val post = db.transaction {
    val author = db.user.create(User(email = "john@example.com"))
    db.post.create(Post(title = "Post 1", authorId = author.id))
}
```

{% when 'swift' %}
### Include Relations in Swift

```swift
import An5Client

var byId = An5Orm.UserWhere()
byId.id = An5Orm.StringFilter.`is`(userId)

let user = try db.user.findFirst(Query(
    filter: byId.build(),
    include: ["posts": true]
))
```

`Query` carries the whole call, and the value under the relation name is `true` or a
dictionary of the same options:

```swift
let user = try db.user.findFirst(Query(
    filter: byId.build(),
    include: ["posts": [
        "where": ["title": ["contains": "AN5"]],
        "orderBy": ["id": "desc"],
        "take": 5,
        "select": ["id", "title"],
    ]]
))
```

### Relation Filters

Swift supports to-many (`some` / `every` / `none`) and to-one (`is` / `isNot`)
relation filters via correlated `EXISTS` / `NOT EXISTS` subqueries using
`An5Orm.ListRelationFilter` and `An5Orm.RelationFilter`, and throws
`An5Error.invalidQuery` for unsupported or mismatched filter operators:

```swift
var publishedPost = An5Orm.PostWhere()
publishedPost.published = An5Orm.BoolFilter.`is`(true)

var usersWithPublished = An5Orm.UserWhere()
usersWithPublished.posts = .some(publishedPost)

let users = try db.user.findMany(filter: usersWithPublished.build())

var byAuthor = An5Orm.UserWhere()
byAuthor.email = An5Orm.StringFilter.`is`("alice@example.com")

var postsByAlice = An5Orm.PostWhere()
postsByAlice.author = .is(byAuthor)

let posts = try db.post.findMany(filter: postsByAlice.build())
```

### Nested Create & Connect

One row per call, so a nested create is two calls in one transaction:

```swift
let post = try db.transaction {
    let author = try db.user.create(User(email: "john@example.com"))
    return try db.post.create(Post(title: "Post 1", authorId: author.id))
}
```

{% endcase %}

## Cascade Operations

Configure cascade delete behavior in your `.an5` schema using `@cascade`:

```an5
model User {
  id    NVARCHAR(1000) @id @default(uuid())
  posts Post[]         @cascade
  
  @@map("users")
}

model Post {
  id       NVARCHAR(1000) @id @default(uuid())
  authorId NVARCHAR(1000)
  author   User           @relation(fields: [authorId], references: [id])
  
  @@map("posts")
}
```

## Next Steps

- [Advanced Queries]({{ '/' | append: code | append: '/' | append: provider | append: '/guides/queries/' | relative_url }}) - Complex filtering, aggregation and raw SQL
- [Transactions]({{ '/' | append: code | append: '/' | append: provider | append: '/guides/transactions/' | relative_url }}) - Atomic multi-table updates
