---
layout: page
title: Browser connections owned by each user
description: Google Sheets authorization and SQLite local data in an AN5 web application
---

# Browser connections owned by each user

AN5 already exports browser-facing adapters from `@an5/adapters/browser`. Google Sheets supports access-token-based fetch requests. SQLite supports a sql.js database instance or a custom browser/WASM driver. These adapters do not supply the application's account picker, storage, file import/export or connection-profile UI.

## Google Sheets

Configure a Google OAuth **Web application** client for the web app's authorized origins. The app developer sets up the client; each user authorizes their own account and chooses a spreadsheet. An advanced bring-your-own-client option still needs that client to allow the application's origin. A Desktop OAuth client used by the VS Code extension does not serve this browser flow.

Use Google Identity Services `google.accounts.oauth2.initTokenClient()` from a user-triggered sign-in button. Use Google Picker with `drive.file` to select the spreadsheet, rather than requesting access to list every Drive file. Check granted scopes before initializing the adapter. Keep the access token in memory; persist only the selected spreadsheet ID, a display name and non-secret profile metadata. When the token expires, offer a Reconnect action and obtain a new token through a user gesture. Do not open an authorization popup automatically inside a database request.

```ts
import { createAn5SheetsAdapter } from '@an5/adapters/browser';

// Values come from the user's Google authorization and file picker.
const db = createAn5SheetsAdapter({
  spreadsheetId: selectedSpreadsheetId,
  accessToken: userAccessToken,
});
```

The application must replace/reinitialize the adapter when its web token changes. An API key alone does not authorize private spreadsheets. Desktop refresh tokens, client secrets and service account private keys are rejected in browser connections. If background/offline Google access is required, use a backend authorization-code flow with per-user credentials stored there.

References: [Google web token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model), [Google Picker](https://developers.google.com/workspace/drive/api/guides/picker), [Drive scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth).

## SQLite

A browser cannot open an arbitrary desktop path such as `sqlite:./dev.sqlite`. Offer **Create local database** or **Import SQLite file**. The selected file's bytes initialize a sql.js database; importing normally creates an in-memory copy and does not update the original file automatically.

```ts
import initSqlJs from 'sql.js';
import { createBrowserSqliteAdapter } from '@an5/adapters/browser';

const SQL = await initSqlJs({ locateFile: name => `/assets/${name}` });
const bytes = new Uint8Array(await selectedFile.arrayBuffer());
const sqliteDb = new SQL.Database(bytes);
const db = createBrowserSqliteAdapter({ db: sqliteDb });
```

For a first implementation, store exported database bytes in IndexedDB under an application-user/profile key, restore them on the next visit, and expose an Export/backup action. Persist after successful writes or transaction commits and surface quota/write failures. An imported database must match the application's schema; do not overwrite or migrate arbitrary user files without a reviewed action.

For larger databases, use an SQLite WASM worker driver with OPFS. The required storage, worker and isolation configuration depends on the selected SQLite VFS. Verify the actual browser support and the interaction with Google login popups before adopting cross-origin isolation. The `opfs-sahpool` VFS avoids COOP/COEP headers, but it does not transparently support concurrent connections from multiple tabs. SQLite data remains local to the browser/origin/device and does not synchronize across devices automatically.

Reference: [SQLite WASM persistence](https://www.sqlite.org/wasm/doc/trunk/persistence.md).

## Proposed connection UI and lifecycle

Use a per-user profile containing `id`, provider, display name, and either spreadsheet ID or local storage key. Credentials are session state, not part of a persisted profile or project config. Import generated AN5 metadata once for the application's expected schema; browser metadata is explicitly supplied with `setAdapterMetadata`, rather than read from filesystem config.

The UI should offer:

- Google Sheets: Connect Google, choose a spreadsheet, reconnect, and disconnect/revoke access.
- SQLite: Create local database, import file, show save status, export backup, and delete the local copy explicitly.
- Common: choose an active profile, check expected schema, show connection state, and report errors without credentials.

Before switching users or profiles, complete pending writes, flush local SQLite state and dispose the previous adapter. Use distinct storage keys for users sharing a browser. Logout clears tokens and in-memory credentials; deleting stored database data is a separate explicit action. Sheets and SQLite have different consistency and transaction capabilities, so expose capabilities rather than promising equivalent transaction behavior.

This guide describes the remaining application layer. AN5's adapters exist; a reusable browser connection manager and persistent SQLite storage are not yet implemented by this change.
