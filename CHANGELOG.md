# Changelog

## [Unreleased]

### Added
- Java, Kotlin and Swift coverage in the `crud`, `getting-started`, `configuration`, `queries`, `relations` and `transactions` guides. Those guides previously fell through to the TypeScript branch for those languages, so a Java, Kotlin or Swift reader was shown the wrong runtime: `getting-started` even led with "TypeScript 5.0+". Each language branch is now written against the generated client, and `configuration` gates its two TypeScript-only sections so a reader cannot copy an API their runtime does not export.
- The Java and Kotlin `vector_strategy` / `setVectorStrategy` spelling to `vector-search` and the matching runtime-adapter rows, alongside the existing TypeScript, Python, .NET, Go, Rust and Swift spellings.
- The Java, Kotlin and Swift adapters and generated clients to the adapters and generated-clients tables in `feature-status`, naming the Maven Central artifacts, the surface each client exposes, and the gates that build and run them.
- A guard in `test/context-browser.mjs` that renders all six guides in all eight languages and fails when a page shows a runtime the reader did not choose, or shows no example at all. Its example check now uses a word boundary, so a page carrying only `language-javascript` no longer passes a check for `language-java`.

### Changed
- Reconcile language/provider guides, query examples, connection configuration, CLI preview commands and Agent/MCP code-generation documentation with the implementation.
- Improve language/provider chooser behavior and browser coverage.
- Document Google Desktop OAuth setup and the proposed browser connection lifecycle for per-user Sheets and SQLite; browser profile UI/persistence is not yet implemented.
- Check brand assets against a pinned an5Brand revision in the standalone Pages workflow.
- Update `docs/guides/configuration.md`.
- Update `docs/guides/vector-search.md`.

### Fixed
- The published-packages table now matches the registries: npm `@an5/orm` `1.3.0`, `@an5/adapters` `0.2.13`, `@an5/agent` `0.3.0`, `an5-client` `0.1.5` and `an5-cli` `0.2.0`; Marketplace `an5-orm-vscode` `1.3.1`; PyPI `an5-adapters` `0.2.13`, `an5-orm` `1.3.0` and `an5-client` `0.1.5`; Maven Central `an5-adapters-java` and `an5-adapters-kotlin` `0.2.13`. The Python packages were still listed as "Build-ready" behind versions that have since been published, and `an5-client` was missing altogether. The "PyPI upload" gap, which said credentials were not configured, no longer applies.
- `feature-status` no longer presents the TypeScript API as though every runtime had it. Relation filters (`some`/`none`/`every`/`is`/`isNot`) are TypeScript-only and the other runtimes filter from the related side; the interactive `$begin()`/`$commit()`/`$rollback()` transaction API is TypeScript-only; the `*Unsafe` raw variants are TypeScript-only. The relations, transactions and raw-SQL rows now name each runtime's own entry points, verified against the adapters, and the related gap records that the other runtimes silently ignore an unsupported relation filter rather than raising.
- Two new gaps record limits the guides previously hid: the Python `where`/`order_by` dictionaries are read by quoting each key verbatim, so keys must be the schema field names (`createdAt`, not `authorId` spelled snake_case) even though the generated dataclasses are snake_case, and the Python typed filter dataclasses are emitted but not accepted by the adapter. A third records that the generated Swift client's `.package(url: ..., from: "0.2.11")` dependency cannot resolve, because the runtime's `Package.swift` is in `swift/` inside the repository rather than at its root and no matching tag exists.
- The Python relation-filter example in `relations.md` used `where={"posts": {"some": {...}}}`, which the Python `where` parser drops, leaving an empty `WHERE` that matches every row rather than failing. It now filters from the child side and says why, matching the warning the Java, Kotlin and Swift sections already carry.
- `crud.md` and `client-languages.md` ordered Python queries by `created_at` and filtered on `is_active`. Because the SQL builder quotes a key verbatim, those compiled to columns that do not exist; both now use `createdAt` and `isActive`, and `crud.md` states the rule.
- The `Post` model in `relations.md` did not declare the `content`, `published` and `createdAt` fields its own examples use.
- The Swift install snippets in `getting-started.md` and `client-languages.md` pointed a `.package(url: ...)` dependency at a version tag that does not exist, and the runtime package lives in a subdirectory, so the dependency could not resolve. Both now use a path dependency and explain that SwiftPM identifies a package by its directory's last path component, which is why the generated client needs a differently named directory.
- The `release` example in `cli.md` used `v0.2.5`, which is well behind the adapter's current version.
