---
layout: page
permalink: /genkit/
title: Genkit Integration
description: How the AI agent is built on Google Genkit, its tools and its RAG pipeline
---

# Google Genkit Integration

This workspace uses [Google Genkit](https://genkit.dev) for AI-powered features across multiple modules.

## Architecture

<div class="arch-grid-2">
  <div class="arch-module-card">
    <div class="arch-module-header">
      <div class="arch-module-title">
        <i class="fas fa-robot"></i> an5Agent
      </div>
      <span class="arch-module-badge">Genkit v1.39</span>
    </div>

    <div class="arch-subgroup">
      <div class="arch-subgroup-title">
        <i class="fas fa-brain"></i> RAG Pipeline
      </div>
      <ul class="arch-item-list">
        <li class="arch-item">
          <code>embedder.ts</code>
          <span class="arch-item-desc">OpenAI / Cohere / fallback</span>
        </li>
        <li class="arch-item">
          <code>indexer.ts</code>
          <span class="arch-item-desc">Schema + query indexer</span>
        </li>
        <li class="arch-item">
          <code>index.ts</code>
          <span class="arch-item-desc">Singleton vector store</span>
        </li>
      </ul>
    </div>

    <div class="arch-subgroup">
      <div class="arch-subgroup-title">
        <i class="fas fa-toolbox"></i> 7 Consolidated Tools
      </div>
      <ul class="arch-item-list">
        <li class="arch-item">
          <code>schema-tools.ts</code>
          <span class="arch-item-desc">list, describe, relations</span>
        </li>
        <li class="arch-item">
          <code>query-tools.ts</code>
          <span class="arch-item-desc">generate, explain, validate</span>
        </li>
        <li class="arch-item">
          <code>database-tools.ts</code>
          <span class="arch-item-desc">execute, describe, health</span>
        </li>
        <li class="arch-item">
          <code>codegen-tools.ts</code>
          <span class="arch-item-desc">generateClientCode, analyze</span>
        </li>
        <li class="arch-item">
          <code>rag-tools.ts</code>
          <span class="arch-item-desc">retrieve schema & queries</span>
        </li>
        <li class="arch-item">
          <code>task-tools.ts</code>
          <span class="arch-item-desc">create, list, update, delete</span>
        </li>
      </ul>
    </div>

    <div class="arch-subgroup">
      <div class="arch-subgroup-title">
        <i class="fas fa-database"></i> RAG Persistent Data
      </div>
      <ul class="arch-item-list">
        <li class="arch-item">
          <code>__db_an5-schema.json</code>
          <span class="arch-item-desc">Schema vector index</span>
        </li>
        <li class="arch-item">
          <code>__db_an5-queries.json</code>
          <span class="arch-item-desc">Query sample index</span>
        </li>
      </ul>
    </div>
  </div>

  <div class="arch-module-card">
    <div class="arch-module-header">
      <div class="arch-module-title">
        <i class="fas fa-tasks"></i> an5Tasks
      </div>
      <span class="arch-module-badge">Genkit v1.39</span>
    </div>

    <div class="arch-subgroup">
      <div class="arch-subgroup-title">
        <i class="fas fa-bolt"></i> Genkit Flows
      </div>
      <ul class="arch-item-list">
        <li class="arch-item">
          <code>parseReviewToTasksFlow</code>
          <span class="arch-item-desc">Regex task extraction</span>
        </li>
        <li class="arch-item">
          <code>aiParseReviewToTasksFlow</code>
          <span class="arch-item-desc">LLM-powered extraction</span>
        </li>
      </ul>
    </div>

    <div class="arch-subgroup">
      <div class="arch-subgroup-title">
        <i class="fas fa-wrench"></i> Task Tools
      </div>
      <ul class="arch-item-list">
        <li class="arch-item">
          <code>createTaskTool</code>
          <span class="arch-item-desc">Create from review issues</span>
        </li>
        <li class="arch-item">
          <code>listTasksTool</code>
          <span class="arch-item-desc">List & filter tasks</span>
        </li>
        <li class="arch-item">
          <code>updateTaskTool</code>
          <span class="arch-item-desc">Update status / priority</span>
        </li>
        <li class="arch-item">
          <code>deleteTaskTool</code>
          <span class="arch-item-desc">Delete a task</span>
        </li>
      </ul>
    </div>
  </div>
</div>

## Setup

### Environment Variables

```bash
# LLM Provider (for aiParseReviewToTasksFlow)
LLM_PROVIDER=openai          # openai | gemini | custom
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
LLM_ENDPOINT=                # Optional: custom endpoint
```

> Embedding settings for the RAG pipeline are **not** read from `EMBEDDING_*` env
> vars. They are loaded from the `EmbeddingConfig` model/table via
> `getEmbeddingConfig()` in `an5Agent/src/rag/embedder.ts`.

### Initialize RAG Index

```bash
cd an5Agent
npm run rag:index
```

This indexes `.an5` schema files and `query-samples.json` into the local vector store.

## Usage

### an5Agent — RAG Retrieval

```typescript
import { retrieveSchema, retrieveQuerySamples } from '@an5/agent';

// Retrieve schema context for a user question
const schemaContext = await retrieveSchema('How do I find users with their orders?');

// Retrieve similar query samples
const querySamples = await retrieveQuerySamples('aggregate functions');
```

### an5Tasks — Task Extraction

```typescript
import { createTasksFromReview } from 'an5-tasks';

// Regex-based (fast, no LLM)
const tasks = await createTasksFromReview(reviewText, workspaceDir);

// AI-powered (smarter extraction)
const tasks = await createTasksFromReview(reviewText, workspaceDir, true);
```

### an5Tasks — Task Management

```typescript
import { getTasks, updateTask } from 'an5-tasks';

// List all todo tasks
const todoTasks = await getTasks(workspaceDir, { status: 'todo' });

// Mark task as done
await updateTask(workspaceDir, 'TASK-1234', { status: 'done' });
```

## Genkit Features Used

| Feature | Module | Purpose |
|---------|--------|---------|
| `genkit()` | an5Agent, an5Tasks | Initialize Genkit instance |
| `defineFlow()` | an5Tasks | Define typed task extraction flows |
| `defineTool()` | an5Tasks | Register task management tools |
| `runFlow()` | an5Tasks | Execute flows with type safety |
| `generate()` | an5Tasks | LLM-powered task extraction |
| `embedder()` | an5Agent | Custom embedding with fallback |
| `devLocalVectorstore` | an5Agent | Local filesystem vector store |
| `Document.fromText()` | an5Agent | Create indexed documents |
| `ai.index()` | an5Agent | Index documents to vector store |
| `ai.retrieve()` | an5Agent | Semantic retrieval from vector store |

## Genkit Features Available (Not Yet Used)

| Feature | Module | Potential Use |
|---------|--------|---------------|
| `definePrompt()` | an5Agent | Reusable prompt templates for code review |
| `@genkit-ai/firebase` | an5Agent | Production vector store (Firestore) |
| `@genkit-ai/google-cloud` | an5Agent | GCP telemetry, tracing, logging |
| Model plugins | an5Cli | Replace raw HTTP LLM calls |
| Session/memory | an5Agent | Multi-turn conversations |
| Streaming | an5Cli | Real-time LLM output in Web UI |
| Eval framework | an5Agent | Measure RAG quality |
| Reranking | an5Agent | Improve retrieval quality |

## Cross-Repo Integration

<div class="arch-grid-3">
  <div class="arch-module-card">
    <div class="arch-module-header">
      <div class="arch-module-title">
        <i class="fas fa-terminal"></i> an5Cli
      </div>
      <span class="arch-module-badge" style="background: rgba(251, 146, 60, 0.15); color: #fb923c; border-color: rgba(251, 146, 60, 0.3);">LLM Calls</span>
    </div>
    <div class="arch-subgroup-title">
      Uses <code>generate()</code> for:
    </div>
    <ul class="arch-item-list">
      <li class="arch-item">
        <span>Commit message generation</span>
      </li>
      <li class="arch-item">
        <span>Changelog generation</span>
      </li>
      <li class="arch-item">
        <span>Code review analysis</span>
      </li>
      <li class="arch-item">
        <span>Documentation generation</span>
      </li>
    </ul>
  </div>

  <div class="arch-module-card">
    <div class="arch-module-header">
      <div class="arch-module-title">
        <i class="fas fa-robot"></i> an5Agent
      </div>
      <span class="arch-module-badge">RAG & Tools</span>
    </div>
    <div class="arch-subgroup-title">
      Uses Genkit for:
    </div>
    <ul class="arch-item-list">
      <li class="arch-item">
        <span>Schema & query indexing</span>
      </li>
      <li class="arch-item">
        <span>Semantic retrieval (RAG)</span>
      </li>
      <li class="arch-item">
        <span>Intelligent tool execution</span>
      </li>
      <li class="arch-item">
        <span>Natural language routing</span>
      </li>
    </ul>
  </div>

  <div class="arch-module-card">
    <div class="arch-module-header">
      <div class="arch-module-title">
        <i class="fas fa-tasks"></i> an5Tasks
      </div>
      <span class="arch-module-badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border-color: rgba(56, 189, 248, 0.3);">Task Mgmt</span>
    </div>
    <div class="arch-subgroup-title">
      Uses Genkit for:
    </div>
    <ul class="arch-item-list">
      <li class="arch-item">
        <span>Task extraction flows</span>
      </li>
      <li class="arch-item">
        <span>AI review task parser</span>
      </li>
      <li class="arch-item">
        <span>Task management tools</span>
      </li>
      <li class="arch-item">
        <span>Bridge tool integration</span>
      </li>
    </ul>
  </div>
</div>

## Vector Store

The local vector store persists to `.genkit/vectorstore/` in each module. Index data is also saved as `__db_*.json` files for portability.

### Re-indexing

After schema changes, re-run:
```bash
npm run rag:index -w an5Agent
```

### Production Vector Store

For production, replace `devLocalVectorstore` with:
- `@genkit-ai/firebase` (Firestore)
- Pinecone plugin
- Weaviate plugin
