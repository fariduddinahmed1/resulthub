# Student Result Management System — Client

React + Vite frontend for the Student Result Management System. See the [root README](../README.md) for full setup instructions.

## Quick Start

```bash
npm install
cp .env.example .env   # set VITE_API_URL (default: http://localhost:5050/api)
npm run dev            # runs at http://localhost:5173
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Lint with Oxlint |

## Environment

Copy `.env.example` to `.env`:

```env
VITE_API_URL=http://localhost:5050/api
```

`VITE_API_URL` must point at the backend API (see `server/.env.example`).

## Notes

- Role-based portals: `/admin/*` (admin), `/teacher/*` (teacher), `/student/*` (student), plus `/change-password` for all signed-in roles.
- Student results can be downloaded as a formatted HTML file, generated client-side.
