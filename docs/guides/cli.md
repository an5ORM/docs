---
layout: page
title: CLI Commands
description: Command-line interface for schema management and development
---

# CLI Commands

`an5-cli` is a workspace/release automation tool for the monorepo. ORM and database operations are run as npm scripts from the `an5Orm/` repository (no standalone `an5` ORM CLI binary is shipped).

Use [Feature Status]({{ '/guides/feature-status/' | relative_url }}) to see which commands are stable and which migration workflows are still evolving.

## Installation

The workspace/release CLI lives in the `an5Cli/` repository:

```bash
cd an5Cli
npm install
npm run build
```

This exposes the `an5-cli` binary:

```bash
npx an5-cli --help
```

ORM schema/database commands (generate, db:push, …) are npm scripts in `an5Orm/`:

```bash
cd an5Orm
npm run <command>
```

## Schema Commands

Run from the `an5Orm/` repository directory.

### Generate Client Code

Generate type-safe client code from your schema files.

```bash
# Generate all clients (TypeScript, Python, .NET, Go)
npm run generate
```

**Output:**
```
an5Client/
├── typescript/     # TypeScript interfaces and metadata
├── python/         # Python dataclasses
├── dotnet/         # .NET entity classes
└── golang/         # Go structs and client
```

### Push Schema to Database

Create or update database tables based on your schema.

```bash
# Push schema to database
npm run db:push
```

**What it does:**
- Compares schema with existing database
- Creates new tables
- Adds missing columns
- Preserves existing data

### Pull Schema from Database

Reverse-engineer schema from existing database.

```bash
# Pull schema from database
npm run db:pull
```

**Output:** Creates `.an5` files in `an5Schema/` directory.

### Seed Database

Populate database with sample data.

```bash
# Run seed script
npm run db:seed
```

### Migrations

```bash
# Compare schema with database
npm run db:migrate diff

# Generate migration SQL
npm run db:migrate:generate

# Apply pending migration files and record them in _an5_migrations
npm run db:migrate:apply
npm run db:migrate:apply -- --dry-run

# Roll back the latest applied migration with a -- migrate:down section
npm run db:migrate:rollback
npm run db:migrate:rollback -- --dry-run

# Roll back multiple steps, or through a named applied file
npm run db:migrate:rollback -- 3
npm run db:migrate:rollback -- --to 2026-08-11T10-00-00_migration.sql

# Show migration status
npm run db:migrate:status
```

## Development Commands

The development commands below are **workspace-root** scripts — run them from the
monorepo root (where the root `package.json` lives), not from `an5Orm/`. Only the
schema/database commands earlier in this page run inside `an5Orm/`.

### Build All Packages

```bash
npm run build
```

### Run Tests

```bash
# Run the full workspace test suite
npm test

# Run a specific workspace package
npm run test -w an5Orm
npm run test -w an5Agent
```

### Start Local UI

Launch the local development UI.

```bash
# Start UI on port 5070
npm run ui
```

**Features:**
- Repository status dashboard
- Git diff viewer
- Build and test buttons
- Commit and release workflow
- LLM configuration

## Release Commands

### Dry Run Release

Preview release changes without committing.

```bash
npm run dryrun
```

### Release Workspace

Compile, test, tag, commit, and push submodules.

```bash
npm run release
```

Or invoke the workspace automation CLI directly:

```bash
npx an5-cli ws . --push
```

## an5-cli Commands

### Impact Analysis

Analyze cross-repo impact from changes.

```bash
npx an5-cli impact [repo]
```

### Documentation

Auto-update docs based on changed files.

```bash
npx an5-cli doc:diff [repo]
```

### Format Schema Files

Auto-format `.an5` files.

```bash
npx an5-cli format [path]
```

### Task Management

```bash
# List tasks
npx an5-cli tasks list

# Update task
npx an5-cli tasks update

# Delete task
npx an5-cli tasks delete
```

## Environment Configuration

### Interactive Setup

```bash
npx an5-cli config
```

### Direct Configuration

Edit `.env` file:

```ini
# Database (required)
DATABASE_URL=sqlserver://localhost:1433;database=mydb;user=sa;password=yourpassword

# Optional
LOG_LEVEL=info
```

### LLM Configuration

```bash
# Configure via CLI
npx an5-cli config

# Or set environment variables
export LLM_PROVIDER=openai
export LLM_API_KEY=sk-your-api-key
export LLM_MODEL=gpt-4o-mini
```

## Common Workflows

### New Project Setup

```bash
# 1. Install package
npm install @an5/orm

# 2. Configure database
# Create .env and set DATABASE_URL

# 3. Generate code (from the an5Orm/ repository)
npm run generate

# 4. Push schema (from the an5Orm/ repository)
npm run db:push
```

### Daily Development

```bash
# Pull latest changes
git pull

# Build
npm run build

# Run tests
npm test

# Start UI
npm run ui
```

### Release Process

```bash
# 1. Dry run
npm run dryrun

# 2. Release
npm run release
```

### Auto Version Bump

For maintainers publishing npm packages under the `@an5` organization:

```bash
# Apply patch bumps based on latest npm versions
node scripts/auto-bump-version.js

# Bump minor or major
node scripts/auto-bump-version.js minor
node scripts/auto-bump-version.js major
```

The default package set is `@an5/adapters` and `@an5/orm`. The script also updates internal dependency ranges, for example `@an5/orm` depending on the new `@an5/adapters` version.

## Tips

- Use `npm run ui` for visual feedback during development
- Run `npx an5-cli format` to keep schema files consistent
- Use `npm run generate` (in the `an5Orm/` repo) instead of calling files under `node_modules/@an5/orm`
- Check `npm run dryrun` before releases
