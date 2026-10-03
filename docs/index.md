---
layout: default
title: AN5 ORM Documentation - Type-Safe Database Access
description: A modern, type-safe ORM for SQL Server, PostgreSQL, MySQL, SQLite, Google Sheets, and NBase
---

<div class="hero">
  <div class="hero-content">
    <h1>an5 ORM</h1>
    <p class="hero-subtitle">A modern, type-safe ORM for Every Platform</p>
    <p class="hero-description">
      Build data-driven applications with an intuitive API, type-safe queries, 
      and powerful features like vector search and AI agent integration across TypeScript, Python, .NET & Golang.
    </p>
    <div class="hero-buttons">
      <a href="{{ '/guides/getting-started/' | relative_url }}" class="btn btn-primary">Get Started</a>
      <a href="{{ '/guides/examples/' | relative_url }}" class="btn btn-secondary">Examples</a>
      <a href="{{ '/guides/feature-status/' | relative_url }}" class="btn btn-secondary">Feature Status</a>
      <a href="{{ '/guides/schema/' | relative_url }}" class="btn btn-secondary">Documentation</a>
      <a href="https://github.com/an5ORM/" class="btn btn-outline">
        <i class="fab fa-github"></i> GitHub
      </a>
    </div>
  </div>
  <div class="hero-code">
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
data: {
email: 'john@example.com',
name: 'John',
}
});</code></pre>

  </div>
</div>

## Why an5 ORM?

Install the published package with `npm install @an5/orm`, then use the CLI tools for schema generation and database commands.

<div class="features-grid">
  <div class="feature-card">
    <div class="feature-icon">🎯</div>
    <h3>Type-Safe</h3>
    <p>Full TypeScript support with autocompletion and type checking for all queries.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">📝</div>
    <h3>Intuitive API</h3>
    <p>Syntax that's easy to learn and powerful enough for complex queries.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🔗</div>
    <h3>Relations</h3>
    <p>Define and query relations with nested includes and explicit joins.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🔍</div>
    <h3>Vector Search</h3>
    <p>Built-in vector search for AI and ML applications across supported dialects.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🤖</div>
    <h3>AI Agent</h3>
    <p>7 intelligent tools for natural language database queries and schema exploration.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🔄</div>
    <h3>Multi-Language</h3>
    <p>Generate type-safe clients for TypeScript, Python, .NET, Golang, and Rust.</p>
  </div>
</div>

## Quick Example

<div class="example-tabs">
  <div class="example-tabs-header">
    <button class="tab-btn active" onclick="showTab('schema')">Schema</button>
    <button class="tab-btn" onclick="showTab('query')">TypeScript</button>
    <button class="tab-btn" onclick="showTab('golang')">Golang</button>
    <button class="tab-btn" onclick="showTab('result')">Result</button>
  </div>
  <div class="tab-content active" id="schema">
    <pre><code class="language-an5">model User {
  id        NVARCHAR(1000) @id @default(uuid())
  email     NVARCHAR(255)  @unique
  name      NVARCHAR(255)?
  createdAt DATETIME2      @default(now())
  orders    Order[]

@@map("users")
}

model Order {
id NVARCHAR(1000) @id @default(uuid())
total INT @default(0)
user User @relation(fields: [userId], references: [id])
userId NVARCHAR(1000)

@@map("orders")
}</code></pre>

  </div>
  <div class="tab-content" id="query">
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
  <div class="tab-content" id="golang">
    <pre><code class="language-go">// Golang ORM client example
import an5client "github.com/an5ORM/an5Client/golang"

db := an5client.NewAn5DbContextWithConnStr(sqlDB, connStr)
users, err := db.User.FindMany(ctx, &an5client.UserFindManyArgs{
Where: &an5client.UserWhereInput{
Email: &an5client.StringFilter{Contains: an5client.Ptr("@example.com")},
},
Take: an5client.IntPtr(10),
})</code></pre>

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
  <a href="{{ '/guides/getting-started/' | relative_url }}" class="btn btn-primary btn-large">
    Start Building →
  </a>
</div>

<script>
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(tabId);
  if (target) target.classList.add('active');
  if (event && event.target) event.target.classList.add('active');
}
</script>
