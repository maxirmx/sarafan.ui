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
Requests under `/api/v1` are proxied to Sarafan Core at <http://localhost:8080>. Start the Core development service and PostgreSQL before exercising authentication. The demo verification code is the phone number's last four digits in every build; the UI does not disclose that rule.

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

## Observability

UI logging is disabled unless the runtime master switch is exactly `true`:

```bash
docker run --rm --publish 8082:8080 \
  --env SARAFAN_UI_LOGGING_ENABLED=true \
  sarafan-ui:local
```

The container writes `/runtime-config.js` when it starts and nginx serves that asset with `Cache-Control: no-store`. Change `SARAFAN_UI_LOGGING_ENABLED` and restart/recreate the container using the same image; no `npm run build` or image rebuild is needed. Missing, empty, or invalid values disable all Sarafan UI log records. Local development can use `VITE_SARAFAN_UI_LOGGING_ENABLED=true`.

When enabled, Production emits Warning and Error events; Development also permits Debug and Information events. Output is one concise human-readable line with an RFC 3339 UTC timestamp, OpenTelemetry severity, stable event name, W3C correlation identifiers, and an English diagnostic message. Logging and sink failure never changes application behavior.

Every API network attempt carries a W3C `traceparent` even when UI logging is disabled. A retry retains the logical trace ID and receives a new span ID. For Core failures, the validated RFC 9457 `traceId` and `instance` link the browser event to Core telemetry.

The allowlist excludes raw URLs/query strings, request/response bodies and headers, access/refresh tokens, cookies and verification codes, customer or device data, DOM/storage/history content, Error messages/stacks/causes, and localized Problem Details text. A remote browser exporter is intentionally not included.
