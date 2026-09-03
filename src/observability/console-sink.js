// Copyright (C) 2026 Maxim [maxirmx] Samsonov (www.sw.consulting)
// All rights reserved.
// This file is a part of the Sarafan application

export function formatConsoleRecord(record) {
  const correlation = [
    record.traceId ? `trace_id=${record.traceId}` : '',
    record.spanId ? `span_id=${record.spanId}` : ''
  ].filter(Boolean).join(' ')
  return [
    record.timestamp,
    record.severityText,
    record.eventName,
    correlation,
    record.body
  ].filter(Boolean).join(' ')
}

export function createConsoleSink(consoleTarget = globalThis.console) {
  return Object.freeze({
    emit(record) {
      const line = formatConsoleRecord(record)
      if (record.severityNumber >= 17) consoleTarget.error(line)
      else if (record.severityNumber >= 13) consoleTarget.warn(line)
      else if (record.severityNumber >= 9) consoleTarget.info(line)
      else consoleTarget.debug(line)
    }
  })
}
