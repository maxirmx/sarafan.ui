// Copyright (C) 2026 Maxim [maxirmx] Samsonov (www.sw.consulting)
// All rights reserved.
// This file is a part of the Sarafan application

import { version } from '../../package.json'
import { runtimeConfig } from '../config/runtime.js'
import { EVENTS, SEVERITY, isCatalogueEvent } from './catalogue.js'
import { createConsoleSink } from './console-sink.js'
import { sanitizeAttributes, sanitizeTraceContext } from './sanitize.js'

const DEFAULT_RATE_LIMIT = Object.freeze({ maximum: 5, windowMilliseconds: 60_000 })

function createRecord(definition, attributes, context, now, environment) {
  const trace = sanitizeTraceContext(context)
  const body = definition.body(attributes).replace(/[\r\n]+/gu, ' ')
  return Object.freeze({
    timestamp: now().toISOString(),
    severityText: definition.severity.text,
    severityNumber: definition.severity.number,
    eventName: definition.name,
    body,
    ...trace,
    resource: Object.freeze({
      'service.name': 'sarafan.ui',
      'service.version': version,
      'deployment.environment.name': environment
    }),
    instrumentationScope: 'sarafan.ui.observability',
    attributes
  })
}

export function createLogger({
  enabled = runtimeConfig.loggingEnabled,
  minimumSeverity = runtimeConfig.minimumSeverity,
  sink = createConsoleSink(),
  now = () => new Date(),
  environment = import.meta.env.MODE || 'unknown',
  rateLimit = DEFAULT_RATE_LIMIT
} = {}) {
  const minimumNumber = SEVERITY[minimumSeverity]?.number ?? SEVERITY.WARN.number
  const limits = new Map()

  function emit(definition, attributes = {}, context = {}) {
    try {
      if (!enabled || !isCatalogueEvent(definition) || definition.severity.number < minimumNumber) {
        return false
      }
      const sanitized = sanitizeAttributes(definition, attributes)
      sink.emit(createRecord(definition, sanitized, context, now, environment))
      return true
    } catch {
      return false
    }
  }

  function emitDropped(eventName, count) {
    if (count > 0) {
      emit(EVENTS.eventsDropped, {
        'event.name': eventName,
        'event.dropped_count': count
      })
    }
  }

  function log(definition, attributes = {}, context = {}) {
    try {
      if (!enabled || !isCatalogueEvent(definition) || definition.severity.number < minimumNumber) {
        return false
      }
      if (!definition.rateLimited) return emit(definition, attributes, context)

      const currentTime = now().getTime()
      const current = limits.get(definition.name)
      if (!current || currentTime - current.startedAt >= rateLimit.windowMilliseconds) {
        if (current) emitDropped(definition.name, current.dropped)
        limits.set(definition.name, { startedAt: currentTime, emitted: 1, dropped: 0 })
        return emit(definition, attributes, context)
      }
      if (current.emitted >= rateLimit.maximum) {
        current.dropped += 1
        return false
      }
      current.emitted += 1
      return emit(definition, attributes, context)
    } catch {
      return false
    }
  }

  function flushDropped() {
    for (const [eventName, limit] of limits) {
      emitDropped(eventName, limit.dropped)
      limit.dropped = 0
    }
  }

  return Object.freeze({ log, flushDropped })
}

export const uiLogger = createLogger()
