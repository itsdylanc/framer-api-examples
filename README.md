# framer-api-examples

## Table of contents (`src/`)

| File              | Description                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `index.ts`        | Connects to a Framer project and logs project info; minimal API connection example.                                            |
| `changes.ts`      | Fetches and prints file changes since last deployment (added/modified/removed) and change contributors.                        |
| `translate.ts`    | Localization: lists locales and localization groups, and can bulk-update translations via the API.                             |
| `update-cms.ts`   | Managed collections: find or create a "Users" collection, define fields, populate from randomuser.me, then publish and deploy. |
| `sync-scripts.ts` | Syncs local `.ts`/`.tsx` files from `src/codeFiles` to the project’s code files (creates or updates).                          |
