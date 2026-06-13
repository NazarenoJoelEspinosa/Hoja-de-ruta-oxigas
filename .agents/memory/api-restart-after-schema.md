---
name: API server restart after schema changes
description: Drizzle's prepared statement cache causes 500 errors on newly added columns until the API server process is restarted.
---

After adding a new column to the DB schema and running `drizzle push`, the API server (running as a long-lived Node process) may still have stale prepared statement caches. The query will fail with "Failed query: select ... column_name ..." even though `drizzle push` says "No changes detected" and the column truly exists in the DB.

**Why:** Drizzle caches prepared statements at the session/connection level. Old connections prepared before the column existed won't see it.

**How to apply:** Any time a DB schema column is added and the API shows 500 errors on that endpoint, restart the `artifacts/api-server: API Server` workflow. No code changes needed.
