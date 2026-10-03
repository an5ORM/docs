---
layout: default
title: Browser Support & In-Browser Databases
description: Learn how to use AN5 ORM adapters directly in Web Browsers with SQLite WASM, sql.js, OPFS, and Google Sheets.
---

# Browser Support & In-Browser Databases

AN5 ORM provides a dedicated, browser-safe entrypoint (`@an5/adapters/browser`) designed specifically for client-side applications. It contains **zero Node.js built-in dependencies** (no `fs`, `net`, `tls`, `crypto`, or `child_process`), making it fully compatible with bundlers like **Vite**, **Webpack**, **Next.js Client Components**, **Expo/React Native**, and **Web Workers**.

---

## Key Features

- **Zero Node.js Dependencies**: Clean bundle that imports only browser-compatible web standards.
- **In-Browser SQLite (`createBrowserSqliteAdapter`)**: Run type-safe SQL queries directly inside the browser using WebAssembly (`sql.js`), Origin Private File System (OPFS), or native mobile SQLite drivers.
- **Google Sheets Backend (`An5SheetsAdapter`)**: Use Google Sheets as a serverless database directly from the browser using OAuth 2.0 Access Tokens or API Keys.
- **Full Type Safety & AST Parsing**: Retains type-safe `TableClient` CRUD, in-memory SQL parsing, filtering, aggregation, and vector search.

---

## Installation & Import

Import directly from the `@an5/adapters/browser` subpath:

```typescript
// Import browser-safe entrypoint
import {
  createBrowserSqliteAdapter,
  createAn5SheetsAdapter,
  An5SheetsAdapter,
  SqliteBrowserEngine,
} from "@an5/adapters/browser";
```

---

## 1. In-Browser SQLite (`createBrowserSqliteAdapter`)

The `createBrowserSqliteAdapter` helper creates an AN5 ORM adapter that wraps any in-browser SQLite execution driver (such as `sql.js`, OPFS, Capacitor SQLite, or Expo SQLite).

### Driver Interface

Provide a driver object implementing a simple `exec(sql, params)` method:

```typescript
export interface SqliteDriver {
  exec(sql: string, params?: any[]): Promise<any[]> | any[];
}
```

### Quickstart Example (with `sql.js` / WASM)

```typescript
import initSqlJs from "sql.js";
import { createBrowserSqliteAdapter } from "@an5/adapters/browser";

// Initialize sql.js WebAssembly instance
const SQL = await initSqlJs({
  locateFile: (file) => `https://sql.js.org/dist/${file}`,
});
const db = new SQL.Database();

// Create driver bridge
const sqliteDriver = {
  exec: (sql: string, params: any[] = []) => {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  },
};

// Initialize AN5 Browser Adapter
const adapter = createBrowserSqliteAdapter({
  driver: sqliteDriver,
  dialect: "sqlite",
});

// Setup table schema
await adapter.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    active INTEGER DEFAULT 1
  );
`);

// Type-safe CRUD
await adapter.users.create({
  data: { id: "u1", name: "Alice", email: "alice@example.com", active: true },
});

const activeUsers = await adapter.users.findMany({
  where: { active: true },
  orderBy: { name: "asc" },
});

console.log("Active users:", activeUsers);
```

### In-Browser Vector Search

`createBrowserSqliteAdapter` includes built-in vector similarity search using Cosine, Euclidean, or Dot product metrics:

```typescript
const items = await adapter.product.vectorSearch({
  vector: [0.12, 0.85, 0.43, 0.91],
  vectorField: "embedding",
  take: 5,
  distanceMetric: "cosine",
});
```

---

## 2. Google Sheets Browser Database (`An5SheetsAdapter`)

The `An5SheetsAdapter` uses Google Sheets REST API as a serverless database backend directly from client-side Web apps.

### Setup with OAuth Token or API Key

```typescript
import { createAn5SheetsAdapter } from "@an5/adapters/browser";

// Initialize with OAuth Access Token or API Key
const sheetsDb = createAn5SheetsAdapter({
  spreadsheetId: "YOUR_GOOGLE_SPREADSHEET_ID",
  accessToken: "YOUR_OATH_ACCESS_TOKEN", // or apiKey: 'YOUR_API_KEY'
});

// Read rows (model/tab name)
const products = await sheetsDb.products.findMany({
  where: { category: "Electronics" },
});

// Insert new row (auto-creates headers if tab is empty)
await sheetsDb.products.create({
  data: {
    id: "prod_101",
    name: "Wireless Mouse",
    price: 29.99,
    category: "Electronics",
  },
});
```

---

## 3. Framework Integration

### Vite / React

```tsx
// App.tsx
import React, { useEffect, useState } from "react";
import { createAn5SheetsAdapter } from "@an5/adapters/browser";

const db = createAn5SheetsAdapter({
  spreadsheetId: import.meta.env.VITE_SHEETS_ID,
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
});

export function ProductList() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    db.products.findMany().then(setItems);
  }, []);

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          {item.name} - ${item.price}
        </li>
      ))}
    </ul>
  );
}
```

### Next.js (Client Component)

Add `'use client';` at top of file when importing `@an5/adapters/browser`:

```typescript
"use client";

import { createBrowserSqliteAdapter } from "@an5/adapters/browser";

// Safe to use in Client Components and custom hooks
```

---

## Summary

| Feature               | In-Browser SQLite                      | Google Sheets                  |
| :-------------------- | :------------------------------------- | :----------------------------- |
| **Import Subpath**    | `@an5/adapters/browser`                | `@an5/adapters/browser`        |
| **Node.js Built-ins** | None                                   | None                           |
| **Persistence**       | Memory / OPFS / IndexedDB              | Google Cloud / Sheets          |
| **Use Case**          | Offline PWA, Local-first apps, WASM DB | No-code admin dashboards, MVPs |
| **Vector Search**     | ✅ Built-in                            | ✅ Built-in                    |
