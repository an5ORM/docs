# AN5 VS Code 1.1.0 — connection and workspace UI

## Delivered

The extension contributes an AN5 Activity Bar icon and three native views: Connections,
Schema Explorer and Project Actions. The connection manager webview supports multiple
workspace folders, adding/editing/deleting profiles, importing the project connection,
selecting an active connection, checking connectivity, configuration shortcuts and
Generate/Push/Pull/MCP actions. It follows VS Code theme colors and adapts to narrow layouts.

Connection strings are stored with VS Code SecretStorage. Workspace state holds only
profile IDs, names and providers. Existing secrets are never populated into the edit form;
a blank credential field preserves them. Workspace switches clear unsaved credential drafts.
Profile writes are serialized and roll back secret replacement if metadata persistence fails.

Active connections are passed via DATABASE_URL to AN5 tasks and extension-provided MCP at
launch. Clearing the override also removes a previously resolved MCP credential override.
Secrets are never persisted to MCP JSON, a config file or settings. Manually configured MCP
servers use their own environment/project config, rather than extension SecretStorage.
Import reads a copy and does not remove secrets already present in a user's source config.

Connection tests use an isolated Node process and SELECT 1. They have connection/request
limits plus a 15-second process timeout, disconnect on failure and success, and suppress
raw driver errors that could include passwords. Relative SQLite paths resolve against the
workspace. The supported profile formats are SQL Server, PostgreSQL, MySQL and SQLite.

Schema Explorer reads declarations without automatically opening database connections.
The schema reader normalizes the generator's `type` relation target into the MCP `target`
contract, preserves unique attributes, supports files in nested folders and omits a leading
period for tables with no schema. Model navigation opens the relevant declaration.

Project commands run in the chosen workspace and use that workspace's scripts or an
available local ORM entry point. A failed command is not retried with an unrelated CLI.
Push/Pull require confirmation; Generate/Push reject a missing schema. MCP generation
honors the selected language and output directory and rejects output that escapes the
workspace, including through symlinks. The MCP server version comes from package.json.

Node resolution prefers an absolute configured an5.nodePath or Node on PATH. The editor
runtime is a fallback with ELECTRON_RUN_AS_NODE, so it does not open another editor window.
Database operations and execution of project configuration require Workspace Trust.

## Validation

- Full extension build/test suite passes, including 7 MCP regression tests, 8 connection/runtime tests and a Chromium browser test, alongside the existing protocol, grammar and snippets suites.
- Browser tests check form editing, literal rendering of HTML in profile names, credential drafts on workspace switches, disabled buttons while busy and a narrow 420-pixel layout.
- Actual VS Code 1.140.0 Extension Host smoke test passed under Xvfb with isolated user data, extensions and a disposable workspace: activation, Activity Bar registration, manager webview, config defaults and MCP command availability.
- Actual SQLite probe succeeds through the installed adapter; failed external connection errors are redacted.
- VSIX packaging and extracted-package MCP initialize/tools-list smoke checks pass. No node_modules or credentials are included in the extension package.

The new UI was not tested against live SQL Server/PostgreSQL/MySQL, on Windows/macOS or in
a remote workspace. Marketplace publishing was not performed. The built VSIX must be
installed and the editor reloaded before these features appear in the user's installed extension.

## Design references

The implementation uses the native [Tree View API](https://code.visualstudio.com/api/extension-guides/tree-view),
[Workspace Trust guidance](https://code.visualstudio.com/api/extension-guides/workspace-trust),
[Webview API](https://code.visualstudio.com/api/extension-guides/webview) and
[extension SecretStorage API](https://code.visualstudio.com/api/references/vscode-api#SecretStorage).

Further work can extend this foundation with a live table explorer, a SELECT editor with
pagination, saved queries and migration previews. Those are not claimed as implemented in 1.1.0.

## 1.1.2: automatic project connections

Connections now appear directly from the project's config, `.env` or `DATABASE_URL`, without importing credentials into saved profiles. Configuration changes refresh the sidebar. Nested AN5 projects are discovered, and the manager follows the active editor's project. The schema explorer, task working directory and MCP definitions use the selected project as well. Parent-installed ORM/adapters resolve correctly for nested projects.

Validation: the full extension suite passes (42 MCP checks, 7 regression tests, 10 connection/runtime tests and the Chromium webview test). The isolated VS Code Extension Host also passes automatic project connection discovery and nearest-project selection alongside the existing activation/UI checks. Config evaluation restores the process environment, and virtual profile metadata contains no connection string.
