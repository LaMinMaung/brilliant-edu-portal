# Brilliant Education Institute Portal

A web portal for the Brilliant Education Institute. It includes the public website, admissions forms, and a student and staff learning portal.

## Project layout

- `codebase/` — React, TypeScript, and Vite frontend.
- `pb_migrations/` — PocketBase collection schemas, access rules, and data migrations.
- `pb_hooks/` — PocketBase server hooks.
- `pb_data/` — local PocketBase database and uploaded files. This directory is ignored by Git and is not part of the repository.

## Technology

- React 19 and TypeScript
- Vite 6
- PocketBase JavaScript SDK
- Tailwind CSS 4

## Development setup

The frontend is in `codebase/`. The current development setup requires Node.js 22, npm, PocketBase access, and the local host tooling used by `vite.config.ts`. That Vite configuration calls `/usr/local/bin/sg-site main` to determine the PocketBase site URL. The package manifest also references two host-provided local packages under `/usr/lib/node_modules_22/`. Those tools and packages must be available before the frontend can be installed and started outside the configured host environment.

Once those prerequisites are available:

```sh
cd codebase
npm install
npm run dev
```

The Vite server prints its local URL when it starts. To create a production bundle, run `npm run build` from `codebase/`. To preview a bundle locally, run `npm run preview`.

## PocketBase

The repository contains PocketBase migrations, but does not include a PocketBase executable or the local database. Apply migrations using the PocketBase deployment process for the target instance. Keep production credentials, database files, backups, and uploaded user data out of Git.

Public application submissions are limited to the `pending` status and cannot set staff notes. CMS HTML is sanitized before it is rendered in the frontend. SMTP is disabled in the included settings migration; configure email credentials through the deployment environment if email delivery is needed.

## Additional guides

- [Deployment guide](codebase/DEPLOYMENT_GUIDE.md)
- [API integration guide](codebase/API_INTEGRATION_GUIDE.md)
- [Security and roles guide](codebase/SECURITY_RBAC_GUIDE.md)
- [QA testing plan](codebase/QA_TESTING_PLAN.md)
