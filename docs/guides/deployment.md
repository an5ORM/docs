---
layout: page
title: Deployment
description: Production deployment guidelines, environment configuration, and container setups
---

# Deployment

Guidelines for deploying applications powered by an5 ORM across cloud providers and containerized environments.

{% assign code = page.docs_code | default: 'typescript' %}
{% assign provider = page.docs_provider | default: 'sqlite' %}

<p class="guide-note">
  <strong>Active Context:</strong> Deploying <strong>{{ code | capitalize }}</strong> application with <strong>{{ provider | capitalize }}</strong> database.
</p>

## Production Checklist

Before going live:

- [ ] Set `DATABASE_URL` securely via cloud environment secrets manager.
- [ ] Configure connection pooling limits appropriate for your container concurrency.
- [ ] Enable TLS/SSL connection encryption (`sslmode=require`, `encrypt=true`).
- [ ] Run automated health check before accepting traffic.
- [ ] Verify automated database backup and disaster recovery schedules.

---

## Environment Configuration

### Production Connection String

Set `DATABASE_URL` according to your target cloud database provider:

```ini
# Production DATABASE_URL (Active: {{ provider | capitalize }})
DATABASE_URL={% case provider %}{% when 'postgresql' %}postgres://prod_user:StrongPassword@db-cluster.us-east-1.rds.amazonaws.com:5432/prod_db?sslmode=require{% when 'sqlserver' %}sqlserver://sql-server.database.windows.net:1433;database=proddb;user=cloudsa;password=StrongPassword!;encrypt=true;trustServerCertificate=false{% when 'mysql' %}mysql://admin:StrongPassword@db.us-east-2.rds.amazonaws.com:3306/prod_db?ssl={"rejectUnauthorized":true}{% when 'sqlite' %}sqlite:///data/production.db{% when 'googlesheets' %}googlesheets://spreadsheetId;clientEmail=service-account@project.iam.gserviceaccount.com;privateKey=your-encoded-key{% when 'nbase' %}nbase://vector-cluster.internal:1307?token=secret-token{% endcase %}

# Application environment
NODE_ENV=production
LOG_LEVEL=warn
```

### Runtime Initialization

{% case code %}
{% when 'typescript' %}
```typescript
import { createAn5Adapter } from "@an5/adapters";

const db = createAn5Adapter({
  connectionString: process.env.DATABASE_URL!,
});

await db.$connect();
```

{% when 'python' %}
```python
import os
from an5_adapter import create_an5_adapter

db = create_an5_adapter(os.environ["DATABASE_URL"])
```

{% when 'dotnet' %}
```csharp
using an5Adapters.Dotnet;

var connStr = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? throw new InvalidOperationException("DATABASE_URL is not set");
var adapter = new An5Adapter(connStr);
```

{% when 'golang' %}
```go
package main

import (
    "os"
    "github.com/an5ORM/an5Adapters/golang"
)

func main() {
    adapter, err := an5adapters.NewAn5Adapter(os.Getenv("DATABASE_URL"))
    if err != nil {
        panic(err)
    }
    defer adapter.Close()
}
```

{% when 'rust' %}
```rust
use an5_adapters::An5Adapter;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let conn_str = std::env::var("DATABASE_URL")?;
    let adapter = An5Adapter::connect(&conn_str).await?;
    Ok(())
}
```

{% endcase %}

---

## Container Deployment (Docker)

Multi-stage Dockerfile tailored for your stack:

```dockerfile
{% case code %}
{% when 'typescript' %}
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
{% when 'python' %}
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
{% when 'dotnet' %}
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY *.csproj ./
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runner
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "App.dll"]
{% when 'golang' %}
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
{% when 'rust' %}
FROM rust:1.78-alpine AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/target/release/server .
EXPOSE 8080
CMD ["./server"]
{% endcase %}
```

---

## Next Steps

- [Troubleshooting]({{ '/' | append: code | append: '/' | append: provider | append: '/guides/troubleshooting/' | relative_url }}) - Connection diagnostics and common error resolutions
- [Configuration]({{ '/' | append: code | append: '/' | append: provider | append: '/guides/configuration/' | relative_url }}) - Full runtime options reference
