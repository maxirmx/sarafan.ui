// Copyright (C) 2026 Maxim [maxirmx] Samsonov (www.sw.consulting)
// All rights reserved.
// This file is a part of the Sarafan application

import { normalizeProblem } from '../errors/problem.js'
import { EVENTS } from './catalogue.js'
import { isHandled, markHandled } from './deduplication.js'
import { uiLogger } from './logger.js'
import { safeErrorType, validTraceId } from './sanitize.js'

export function reportBoundaryFailure(value, definition, logger = uiLogger) {
  if (isHandled(value)) return false

  const problem = normalizeProblem(value)
  const emitted = logger.log(
    definition,
    { 'error.type': safeErrorType(problem) },
    validTraceId(problem.traceId) ? { traceId: problem.traceId } : {}
  )
  markHandled(value)
  markHandled(problem)
  return emitted
}

export function installErrorBoundaries(app, target = globalThis, logger = uiLogger) {
  app.config.errorHandler = error => reportBoundaryFailure(error, EVENTS.applicationError, logger)

  const onError = event => reportBoundaryFailure(event.error, EVENTS.applicationError, logger)
  const onUnhandledRejection = event => reportBoundaryFailure(
    event.reason,
    EVENTS.promiseUnhandled,
    logger
  )
  target.addEventListener('error', onError)
  target.addEventListener('unhandledrejection', onUnhandledRejection)

  return () => {
    target.removeEventListener('error', onError)
    target.removeEventListener('unhandledrejection', onUnhandledRejection)
  }
}
