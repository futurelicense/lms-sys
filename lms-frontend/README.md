# LMS Frontend

React 19 + Vite single-page application for a multi-tenant learning management
system. Feature-sliced architecture, role- and permission-aware routing, React
Query for server state and Redux Toolkit for session state.

## Quick start

```bash
npm ci
cp .env.example .env.local   # then fill in VITE_API_BASE_URL
npm run dev                  # http://localhost:3000
```

## Scripts

| Script                            | Purpose                         |
| --------------------------------- | ------------------------------- |
| `npm run dev`                     | Dev server with HMR             |
| `npm run build`                   | Production bundle into `dist/`  |
| `npm run preview`                 | Serve the built bundle locally  |
| `npm run lint`                    | ESLint (fails on any warning)   |
| `npm run format` / `format:check` | Prettier write / verify         |
| `npm test`                        | Vitest unit + integration run   |
| `npm run test:coverage`           | Same, with a v8 coverage report |

## Architecture

```
src/
  app/          bootstrap: providers, store, router
  components/   design system (common, layout, navigation, feedback)
  features/     one folder per domain: pages, components, hooks, services, validation, constants
  layouts/      role shells (auth, admin, instructor, student, error)
  guards/       ProtectedRoute, GuestRoute, RoleGuard, PermissionGuard
  services/     axios client + interceptors, storage, websocket
  hooks/        cross-feature hooks
  utils/        pure helpers
  constants/    routes, roles, permissions, endpoints
  config/       environment + app configuration
  styles/       CSS custom properties and global styles
```

Rules of thumb:

- A feature may import from `components/`, `hooks/`, `utils/`, `services/`,
  `constants/`. **Features should not import from each other** - lift anything
  shared into `components/` or `utils/`.
- Never hardcode a URL: paths live in `constants/routes.js`, API paths in
  `constants/apiEndpoints.js`.
- Server state belongs in React Query; Redux holds only session/client state.

## Environment variables

Every `VITE_*` variable is **inlined into the client bundle and is public**.
Never put a secret in one. `src/config/environment.js` is the single reader and
fails the build in production when a required variable is missing.

| Variable                | Required | Description                              |
| ----------------------- | -------- | ---------------------------------------- |
| `VITE_API_BASE_URL`     | yes      | REST API base URL                        |
| `VITE_WS_BASE_URL`      | no       | Websocket endpoint                       |
| `VITE_APP_NAME`         | no       | Display name                             |
| `VITE_APP_ENV`          | no       | `development` / `staging` / `production` |
| `VITE_ENABLE_ANALYTICS` | no       | `true` to enable analytics               |
| `VITE_SENTRY_DSN`       | no       | Error reporting DSN                      |
| `VITE_DEV_PROXY_TARGET` | no       | Dev-only `/api` proxy target             |

## Docker

```bash
docker build -t lms-frontend --build-arg VITE_API_BASE_URL=https://api.example.com/api .
docker run -p 8080:8080 lms-frontend
```

The image serves the static bundle through nginx on port 8080 as an
unprivileged user, with `/healthz` for liveness probes.

## Testing

- `tests/unit` - pure functions and hooks
- `tests/integration` - components rendered with providers, API mocked
- `tests/e2e` - Playwright specs (see `tests/e2e/README.md`; not installed yet)

## Known gaps before production

See the "Known gaps" section of the handover notes; the main ones are token
storage (move to httpOnly cookies), a real error-reporting integration, and
filling in the deploy step of the CD workflows.
