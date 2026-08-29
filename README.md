<!-- Copyright (C) 2026 Maxim [maxirmx] Samsonov (www.sw.consulting) -->
<!-- All rights reserved. -->
<!-- This file is a part of the Sarafan application -->

# Sarafan UI

[![ci](https://github.com/maxirmx/sarafan.ui/actions/workflows/ci.yml/badge.svg)](https://github.com/maxirmx/sarafan.ui/actions/workflows/ci.yml)
[![publish](https://github.com/maxirmx/sarafan.ui/actions/workflows/publish.yml/badge.svg)](https://github.com/maxirmx/sarafan.ui/actions/workflows/publish.yml)

Vue and Vuetify customer application for Sarafan. It provides phone-code registration and login, consent capture, refreshable sessions, profile editing, and profile-photo management. Vite builds the application and nginx serves the production image.

## Prerequisites

- Node.js 22.12 or newer
- npm 10 or newer
- Docker

## Local development

```bash
npm ci
npm run dev
```

Vite serves the application at <http://localhost:5173>.
Requests under `/api` are proxied to Sarafan Core at <http://localhost:5080>. Start the Core development service and PostgreSQL before exercising authentication. The fixed code `1111` is shown only in development builds.

Access tokens are kept in memory. The browser receives the rotating refresh token only as an HttpOnly cookie, and the UI attempts one session refresh on startup and after an authorized request returns `401`.

## Verification

```bash
npm run lint
npm test
npm run build
```

## Docker

```bash
docker build --tag sarafan-ui:local .
docker run --rm --publish 8082:8080 sarafan-ui:local
```

nginx serves the containerized application at <http://localhost:8082>. Its health endpoint is <http://localhost:8082/health>.
