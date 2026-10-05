# Project Hub

Private Next.js project directory intended for Vercel.

## Architecture
- Vercel Authentication / deployment protection handles private access.
- Vercel Blob stores `project-hub/projects.json`.
- `/api/projects` loads and saves the canonical project list.
- All edits are shared across authenticated devices.
