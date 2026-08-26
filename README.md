# Sarafan UI

[![ci](https://github.com/maxirmx/sarafan.ui/actions/workflows/ci.yml/badge.svg)](https://github.com/maxirmx/sarafan.ui/actions/workflows/ci.yml)
[![publish](https://github.com/maxirmx/sarafan.ui/actions/workflows/publish.yml/badge.svg)](https://github.com/maxirmx/sarafan.ui/actions/workflows/publish.yml)

Empty Vue and Vuetify frontend for the Sarafan system. Vite builds the application and nginx serves the production image.

## Prerequisites

- Node.js 22.12 or newer
- npm 10 or newer
- Docker with Docker Compose

## Local development

```bash
npm ci
npm run dev
```

Vite serves the application at <http://localhost:5173>.

## Verification

```bash
npm run lint
npm test
npm run build
```

## Docker

```bash
docker compose up --build
```

nginx serves the containerized application at <http://localhost:8082>. Its health endpoint is <http://localhost:8082/health>.
