// Copyright (C) 2026 Maxim [maxirmx] Samsonov (www.sw.consulting)
// All rights reserved.
// This file is a part of the Sarafan application

let handled = new WeakSet()

function trackable(value) {
  return value !== null && (typeof value === 'object' || typeof value === 'function')
}

export function markHandled(value) {
  if (trackable(value)) handled.add(value)
  return value
}

export function isHandled(value) {
  return trackable(value) && handled.has(value)
}

export function resetHandledForTests() {
  handled = new WeakSet()
}
