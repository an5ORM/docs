---
layout: default
title: AN5 ORM Documentation - Type-Safe Database Access
description: A modern, type-safe ORM for SQL Server, PostgreSQL, MySQL, SQLite, Google Sheets, and NBase
---

{% assign code = page.docs_code | default: 'typescript' %}
{% assign provider = page.docs_provider | default: 'sqlite' %}

<div class="hero">
  <div class="hero-content">
    <h1>an5 ORM</h1>
    <p class="hero-subtitle">A modern, type-safe ORM for <span class="hero-target-lang"><strong>{{ code | capitalize }}</strong></span> with <span class="hero-target-prov"><strong>{{ provider | capitalize }}</strong></span></p>
    <p class="hero-description">
      Build data-driven applications with an intuitive API, type-safe queries, 
      and powerful features like vector search and AI agent integration across TypeScript, Python, .NET, Golang, Rust, Java, Kotlin, and Swift.
    </p>
    <div class="hero-buttons">
      <a href="{{ '/' | append: code | append: '/' | append: provider | append: '/guides/getting-started/' | relative_url }}" class="btn btn-primary" id="heroGetStartedBtn">Get Started with {{ code | capitalize }}</a>
      <a href="{{ '/guides/examples/' | relative_url }}" class="btn btn-secondary">Examples</a>
      <a href="{{ '/guides/providers/' | relative_url }}" class="btn btn-secondary">Providers</a>
      <a href="{{ '/guides/client-languages/' | relative_url }}" class="btn btn-secondary">Languages</a>
      <a href="https://github.com/an5ORM/" class="btn btn-outline" target="_blank" rel="noopener">
        <i class="fab fa-github"></i> GitHub
      </a>
    </div>
  </div>
  <div class="hero-code" id="heroCodeBlock">
    <!-- TypeScript Snippet -->
    <div class="hero-lang-snippet" data-lang="typescript" {% unless code == 'typescript' %}style="display:none"{% endunless %}>
      <pre><code class="language-typescript">import { createAn5Adapter } from '@an5/adapters';

const db = createAn5Adapter({
  connectionString: process.env.DATABASE_URL!,
});
await db.$connect();

// Type-safe model queries
const users = await db.user.findMany({
  where: { email: { contains: '@example.com' } },
  orderBy: { createdAt: 'desc' },
  take: 10,
});

// Create record
const user = await db.user.create({
  data: { email: 'john@example.com', name: 'John' }
});</code></pre>
    </div>

    <!-- Python Snippet -->
    <div class="hero-lang-snippet" data-lang="python" {% unless code == 'python' %}style="display:none"{% endunless %}>
      <pre><code class="language-python">from an5_client import An5Client

db = An5Client()  # reads DATABASE_URL

# Type-safe model queries
users = db.user.find_many(
    where={"email": {"contains": "@example.com"}},
    order_by={"created_at": "desc"},
    take=10,
)

# Create record
user = db.user.create(data={
    "email": "john@example.com",
    "name": "John"
})</code></pre>
    </div>

    <!-- .NET (C#) Snippet -->
    <div class="hero-lang-snippet" data-lang="dotnet" {% unless code == 'dotnet' %}style="display:none"{% endunless %}>
      <pre><code class="language-csharp">using An5Orm;

var db = new An5DbContext();

// Type-safe model queries
var users = await db.Users.FindManyAsync(new UserFindManyArgs
{
    Where = new UserWhereInput { Email = new StringFilter { Contains = "@example.com" } },
    OrderBy = new UserOrderByInput { CreatedAt = SortOrder.Desc },
    Take = 10
});

// Create record
var user = await db.Users.CreateAsync(new UserCreateInput
{
    Email = "john@example.com",
    Name = "John"
});</code></pre>
    </div>

    <!-- Go Snippet -->
    <div class="hero-lang-snippet" data-lang="golang" {% unless code == 'golang' %}style="display:none"{% endunless %}>
      <pre><code class="language-go">import (
    "context"
    "os"
    "an5client"
)

ctx := context.Background()
db, _ := an5client.NewAn5DbContext(ctx, os.Getenv("DATABASE_URL"))

// Type-safe model queries
users, _ := db.User.FindMany(ctx, &an5client.UserFindManyArgs{
    Where: &an5client.UserWhereInput{
        Email: &an5client.StringFilter{Contains: "@example.com"},
    },
    Take: 10,
})

// Create record
user, _ := db.User.Create(ctx, &an5client.UserCreateInput{
    Email: "john@example.com",
    Name:  "John",
})</code></pre>
    </div>

    <!-- Rust Snippet -->
    <div class="hero-lang-snippet" data-lang="rust" {% unless code == 'rust' %}style="display:none"{% endunless %}>
      <pre><code class="language-rust">use an5_client::{An5Client, UserCreateInput, UserFindManyArgs, StringFilter};

let db = An5Client::from_env().await?;

// Type-safe model queries
let users = db.user().find_many(UserFindManyArgs {
    where_clause: Some(UserWhereInput {
        email: Some(StringFilter { contains: Some("@example.com".into()), ..Default::default() }),
        ..Default::default()
    }),
    take: Some(10),
    ..Default::default()
}).await?;

// Create record
let user = db.user().create(UserCreateInput {
    email: "john@example.com".to_string(),
    name: Some("John".to_string()),
}).await?;</code></pre>
    </div>
  </div>
</div>

## Why an5 ORM?

Install the published package with `npm install @an5/orm`, then use the CLI tools for schema generation and database commands.

<div class="features-grid">
  <div class="feature-card">
    <div class="feature-icon">🎯</div>
    <h3>Type-Safe</h3>
    <p>Full typing with autocompletion and compile-time checking for all queries across 5 client languages.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">📝</div>
    <h3>Intuitive API</h3>
    <p>Syntax that's easy to learn and powerful enough for complex nested relations and joins.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🔗</div>
    <h3>6 Providers</h3>
    <p>Native adapters for PostgreSQL, SQL Server, MySQL, SQLite, Google Sheets, and NBase vector database.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🔍</div>
    <h3>Vector Search</h3>
    <p>Built-in semantic vector search with pgvector, SQL Server 2025, and NBase integration.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🤖</div>
    <h3>AI Agent & MCP</h3>
    <p>7 intelligent tools for natural language database queries and VS Code MCP server.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🔄</div>
    <h3>Multi-Language</h3>
    <p>One unified <code>.an5</code> schema generates native clients for TypeScript, Python, C#, Go, and Rust.</p>
  </div>
</div>

## Quick Example

<div class="example-tabs">
  <div class="example-tabs-header">
    <button class="tab-btn" id="tabBtn-schema" onclick="showTab('schema')">Schema</button>
    <button class="tab-btn {% if code == 'typescript' %}active{% endif %}" id="tabBtn-typescript" onclick="showTab('query')">TypeScript</button>
    <button class="tab-btn {% if code == 'python' %}active{% endif %}" id="tabBtn-python" onclick="showTab('python')">Python</button>
    <button class="tab-btn {% if code == 'dotnet' %}active{% endif %}" id="tabBtn-dotnet" onclick="showTab('dotnet')">.NET (C#)</button>
    <button class="tab-btn {% if code == 'golang' %}active{% endif %}" id="tabBtn-golang" onclick="showTab('golang')">Golang</button>
    <button class="tab-btn {% if code == 'rust' %}active{% endif %}" id="tabBtn-rust" onclick="showTab('rust')">Rust</button>
    <button class="tab-btn" id="tabBtn-result" onclick="showTab('result')">Result</button>
  </div>
  <div class="tab-content" id="schema">
    <pre><code class="language-an5">model User {
  id        NVARCHAR(1000) @id @default(uuid())
  email     NVARCHAR(255)  @unique
  name      NVARCHAR(255)?
  createdAt DATETIME2      @default(now())
  orders    Order[]

  @@map("users")
}

model Order {
  id     NVARCHAR(1000) @id @default(uuid())
  total  INT            @default(0)
  user   User           @relation(fields: [userId], references: [id])
  userId NVARCHAR(1000)

  @@map("orders")
}</code></pre>
  </div>
  <div class="tab-content {% if code == 'typescript' %}active{% endif %}" id="query">
    <pre><code class="language-typescript">const users = await db.user.findMany({
  where: { email: { contains: '@example.com' } },
  include: {
    orders: {
      select: { total: true },
      orderBy: { total: 'desc' }
    }
  },
  take: 10
});</code></pre>
  </div>
  <div class="tab-content {% if code == 'python' %}active{% endif %}" id="python">
    <pre><code class="language-python">users = db.user.find_many(
    where={"email": {"contains": "@example.com"}},
    include={"orders": {"order_by": {"total": "desc"}}},
    take=10
)</code></pre>
  </div>
  <div class="tab-content {% if code == 'dotnet' %}active{% endif %}" id="dotnet">
    <pre><code class="language-csharp">var users = await db.Users.FindManyAsync(new UserFindManyArgs
{
    Where = new UserWhereInput { Email = new StringFilter { Contains = "@example.com" } },
    Take = 10
});</code></pre>
  </div>
  <div class="tab-content {% if code == 'golang' %}active{% endif %}" id="golang">
    <pre><code class="language-go">users, err := db.User.FindMany(ctx, &an5client.UserFindManyArgs{
    Where: &an5client.UserWhereInput{
        Email: &an5client.StringFilter{Contains: "@example.com"},
    },
    Take: 10,
})</code></pre>
  </div>
  <div class="tab-content {% if code == 'rust' %}active{% endif %}" id="rust">
    <pre><code class="language-rust">let users = db.user().find_many(UserFindManyArgs {
    where_clause: Some(UserWhereInput {
        email: Some(StringFilter { contains: Some("@example.com".into()), ..Default::default() }),
        ..Default::default()
    }),
    take: Some(10),
    ..Default::default()
}).await?;</code></pre>
  </div>
  <div class="tab-content" id="result">
    <pre><code class="language-json">[
  {
    "id": "uuid-1",
    "email": "john@example.com",
    "name": "John",
    "createdAt": "2026-01-15T10:30:00Z",
    "orders": [
      { "total": 500 },
      { "total": 150 }
    ]
  }
]</code></pre>
  </div>
</div>

<div class="cta-section">
  <h2>Ready to get started?</h2>
  <p>Get up and running with an5 ORM in under 5 minutes.</p>
  <a href="{{ '/' | append: code | append: '/' | append: provider | append: '/guides/getting-started/' | relative_url }}" class="btn btn-primary btn-large">
    Start Building →
  </a>
</div>

<script>
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(tabId);
  if (target) target.classList.add('active');
  const btn = document.getElementById('tabBtn-' + (tabId === 'query' ? 'typescript' : tabId));
  if (btn) btn.classList.add('active');
}
</script>
