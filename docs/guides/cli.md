---
layout: page
title: CLI Commands
description: Comprehensive guide for an5-cli workspace automation and an5Orm schema development commands
---

# CLI Commands

The AN5 ecosystem provides two sets of command-line tools:
1. **`an5-cli`**: The workspace orchestration, release automation, and local UI tool for monorepo development.
2. **`an5Orm` npm scripts**: Core ORM schema operations (generation, push, pull, migrations, seeding).

{% assign code = page.docs_code | default: 'typescript' %}
{% assign provider = page.docs_provider | default: 'sqlite' %}

<p class="guide-note">
  <strong>Active Context:</strong> Currently configuring commands for <strong>{{ code | capitalize }}</strong> with <strong>{{ provider | capitalize }}</strong>.
</p>

## Core Schema Commands (an5Orm)

Schema and database lifecycle operations run as npm scripts from the `an5Orm/` directory:

```bash
cd an5Orm
npm run <command>
```

### 1. Code Generation (`generate`)

Parses `.an5` schemas in `an5Schema/` and generates type-safe clients across all 5 target languages:

```bash
# Generate all clients (TypeScript, Python, .NET, Go, Rust, Java, Kotlin, Swift)
npm run generate
```

**Generated Artifacts:**
```text
an5Client/
├── typescript/     # TypeScript interfaces and metadata (an5Metadata.ts)
├── python/         # Python dataclasses (an5_client.py, an5_metadata.py)
├── dotnet/         # .NET entity classes and An5DbContext
├── golang/         # Go structs and TableClient[T]
└── rust/           # Rust models and client crate
```

### 2. Schema Push (`db:push`)

Compares `.an5` definitions with the target database and safely applies additive changes (creates tables, adds missing columns):

```bash
npm run db:push
```

### 3. Schema Pull (`db:pull`)

Introspects an existing relational database and reverse-engineers `.an5` model files:

```bash
npm run db:pull
```

### 4. Database Seeding (`db:seed`)

Populates the database with test and development data:

```bash
npm run db:seed
```

### 5. Migration Management (`db:migrate:*`)

Full lifecycle migration tooling with rollback and status reporting:

```bash
# Compare schema against database and preview diff
npm run db:migrate diff

# Generate timestamped SQL migration files
npm run db:migrate:generate

# Apply pending migrations and record checksums in _an5_migrations
npm run db:migrate:apply
npm run db:migrate:apply -- --preview

# Roll back migrations
npm run db:migrate:rollback
npm run db:migrate:rollback -- 3
npm run db:migrate:rollback -- --to 2026-08-11T10-00-00_migration.sql

# Inspect migration history
npm run db:migrate:status
```

---

## Workspace & Release CLI (an5-cli)

`an5-cli` automates changelog generation, cross-repo dependency synchronization, Git releases, and local dashboard management.

### Installation

```bash
cd an5Cli
npm install
npm run build
```

This registers the `an5-cli` executable:

```bash
npx an5-cli --help
```

### 1. Web UI Dashboard (`ui`)

Launches the development dashboard on port 5070 with repository statuses, diff inspectors, build/test buttons, and tunnel support:

```bash
# Start local UI on port 5070
npx an5-cli ui

# Launch UI and expose via localtunnel for mobile/remote access
npx an5-cli ui --tunnel --subdomain my-an5
```

### 2. Localtunnel Management (`tunnel`)

Expose local services securely for remote testing and webhook debugging:

```bash
# Start tunnel on default port 5070
npx an5-cli tunnel start

# Start tunnel with custom subdomain and port
npx an5-cli tunnel start --subdomain my-an5 --tunnel-port 5070

# Check tunnel status and stop
npx an5-cli tunnel status
npx an5-cli tunnel stop
```

### 3. Cross-Repo Impact Analysis (`impact`)

Analyzes which downstream repositories and packages are affected by changes in a given component:

```bash
npx an5-cli impact an5Adapters
```

### 4. Multi-Repo Synchronization (`sync`)

Rebuilds, runs tests, and updates documentation across all affected repositories:

```bash
# Sync and rebuild all repos affected by an5Orm
npx an5-cli sync an5Orm

# Skip docs or build steps during rapid iterations
npx an5-cli sync an5Orm --skip-docs
npx an5-cli sync an5Orm --skip-build
```

### 5. AI-Assisted Documentation (`doc` & `doc:diff`)

Generates or updates documentation using LLM analysis of code changes:

```bash
# Generate/improve documentation for a specific file or module
npx an5-cli doc an5Adapters/typescript/src/an5Adapter.ts

# Automatically update docs based on Git diff
npx an5-cli doc:diff an5Orm
```

### 6. Schema Formatting (`format`)

Enforces consistent column and attribute alignment across `.an5` files:

```bash
npx an5-cli format an5Schema/
```

### 7. Task Management (`tasks`)

Integrates with `an5-tasks` for managing development and review work:

```bash
# List tasks with optional status and priority filters
npx an5-cli tasks list
npx an5-cli tasks list --status todo
npx an5-cli tasks list --priority high

# Update or delete a task
npx an5-cli tasks update --id TASK-101 --status done
npx an5-cli tasks delete --id TASK-101
```

### 8. Release Automation (`release` & `ws`)

Automates changelog compilation, SemVer bumps, Git tags, and commits:

```bash
# Preview changes without modifying Git
npx an5-cli release --preview

# Release a single repository
npx an5-cli release an5Adapters --push --tag v0.2.13

# Release all modified submodules across the workspace
npx an5-cli ws . --push
```


Commit messages use current source changes and new files. Generic LLM output falls
back to file/API summaries; `--message` supplies an explicit message. Changelog
notes are generated separately. Ordinary commits accumulate `Unreleased` notes;
`--version` or `--tag` collects commits since the previous release and promotes
pending notes into a dated entry. For untagged workspace packages, the last
committed versioned changelog edit supplies the baseline. `--since <ref>` overrides
it with an ancestor of `HEAD`. Selected-file releases preserve unmatched pending
notes. `--changelog-file <path>` supplies reviewed notes instead of generated ones.

```bash
# Preview release notes from a specific previous release
npx an5-cli release . --version 1.1.0 --since v1.0.0 --preview --skip-llm
```

---

## Configuration

### CLI Configuration (`.an5cli.json`)

Configure default behaviors in `.an5cli.json`:

```json
{
  "defaultTarget": "./an5Orm",
  "defaultBranch": "main",
  "preview": false,
  "push": false,
  "skipPrompt": false,
  "tunnel": {
    "subdomain": "my-an5",
    "port": 5070
  }
}
```

### Environment Variables

Configure database connection and LLM keys in `.env`:

```ini
# Database Connection (Active: {{ provider | capitalize }})
DATABASE_URL={% case provider %}{% when 'postgresql' %}postgres://user:password@localhost:5432/mydb{% when 'mysql' %}mysql://user:password@localhost:3306/mydb{% when 'sqlite' %}sqlite:///path/to/database.db{% when 'googlesheets' %}googlesheets://spreadsheetId;clientEmail=sa@project.iam.gserviceaccount.com;privateKey=your-key{% when 'nbase' %}nbase://localhost:1307{% else %}sqlserver://localhost:1433;database=mydb;user=sa;password=yourpassword{% endcase %}

# LLM Provider for automated commit messages & docs
LLM_PROVIDER=openai
LLM_API_KEY=sk-your-api-key
LLM_MODEL=gpt-4o-mini
```

---

## Next Steps

- [Configuration]({{ '/' | append: code | append: '/' | append: provider | append: '/guides/configuration/' | relative_url }}) - Detail config file options and schema mapping
- [Getting Started]({{ '/' | append: code | append: '/' | append: provider | append: '/guides/getting-started/' | relative_url }}) - Quickstart guide for {{ code | capitalize }}
