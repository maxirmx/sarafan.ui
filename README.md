<!-- Copyright (C) 2026 Maxim [maxirmx] Samsonov (www.sw.consulting) -->
<!-- All rights reserved. -->
<!-- This file is a part of the Sarafan application -->

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

## Cloud deployment

The cloud stack contains the UI and Sarafan Core without publishing either
container directly on the host. Choose exactly one deployment overlay:

- `edge` attaches the UI to the external `sw-consulting-edge` network using the
  alias `sarafan-ui`;
- `production` starts a dedicated TLS edge on ports 80 and 443 for
  `sarafan.sw.consulting`.

```bash
cp sarafan.env.example sarafan.env
chmod 600 sarafan.env
chmod +x scripts/bootstrap-cloud.sh scripts/update-cloud.sh

# Shared server
scripts/bootstrap-cloud.sh edge

# Dedicated production server
scripts/bootstrap-cloud.sh production
```

For a dedicated server, place `s.crt` and `s.key` in
`/srv/sarafan/certificate` (or set `SARAFAN_CERTIFICATE_DIR`). The certificate
must cover `sarafan.sw.consulting`. For the shared server, start the
`sw-consulting-edge` project before Sarafan so the external Docker network
exists.

Update the selected deployment with `scripts/update-cloud.sh edge` or
`scripts/update-cloud.sh production`. UI and Core image tags are independent so
the two repositories do not need synchronized release numbers.
