// Copyright (C) 2026 Maxim [maxirmx] Samsonov (www.sw.consulting)
// All rights reserved.
// This file is a part of the Sarafan application

import { readonly, ref } from 'vue'

export class ApiError extends Error {
  constructor(message, status, code = '') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

const accessToken = ref('')
const customer = ref(null)
const restoring = ref(true)
let refreshPromise = null

async function parseError(response) {
  let problem = null
  try {
    problem = await response.json()
  } catch {
    // A proxy or an unavailable service may return an empty or non-JSON response.
  }

  const validationMessage = problem?.errors
    ? Object.values(problem.errors).flat().join(' ')
    : ''
  return new ApiError(
    problem?.detail || validationMessage || problem?.title || 'Не удалось выполнить запрос',
    response.status,
    problem?.code || ''
  )
}

function applySession(session) {
  accessToken.value = session.accessToken
  customer.value = session.customer
  return session.customer
}

function clearSession() {
  accessToken.value = ''
  customer.value = null
}

async function fetchSession(path, options = {}, authorize = false, retry = true) {
  const headers = new globalThis.Headers(options.headers)
  if (authorize && accessToken.value) {
    headers.set('Authorization', `Bearer ${accessToken.value}`)
  }

  const response = await globalThis.fetch(path, {
    ...options,
    headers,
    credentials: 'include'
  })

  if (response.status === 401 && authorize && retry) {
    await refreshSession()
    return fetchSession(path, options, true, false)
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) return null
  return response.json()
}

function jsonOptions(method, body) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }
}

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetchSession('/api/auth/refresh', { method: 'POST' })
      .then(applySession)
      .catch((error) => {
        clearSession()
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

async function restoreSession() {
  restoring.value = true
  try {
    await refreshSession()
  } catch {
    // An absent or expired refresh cookie simply means that sign-in is required.
  } finally {
    restoring.value = false
  }
}

async function requestCode(phone, purpose) {
  return fetchSession('/api/auth/code/request', jsonOptions('POST', { phone, purpose }))
}

async function verifyCode(payload) {
  const session = await fetchSession('/api/auth/code/verify', jsonOptions('POST', payload))
  return applySession(session)
}

async function logout() {
  try {
    await fetchSession('/api/auth/logout', { method: 'POST' })
  } finally {
    clearSession()
  }
}

async function updateProfile(profile) {
  customer.value = await fetchSession(
    '/api/customers/me',
    jsonOptions('PUT', profile),
    true
  )
  return customer.value
}

async function uploadPhoto(file) {
  const body = new globalThis.FormData()
  body.append('file', file)
  await fetchSession('/api/customers/me/photo', { method: 'PUT', body }, true)
  customer.value = { ...customer.value, hasPhoto: true }
}

async function deletePhoto() {
  await fetchSession('/api/customers/me/photo', { method: 'DELETE' }, true)
  customer.value = { ...customer.value, hasPhoto: false }
}

async function getPhoto() {
  async function request(retry = true) {
    const response = await globalThis.fetch('/api/customers/me/photo', {
      credentials: 'include',
      headers: { Authorization: `Bearer ${accessToken.value}` }
    })
    if (response.status === 401 && retry) {
      await refreshSession()
      return request(false)
    }
    if (!response.ok) throw await parseError(response)
    return response.blob()
  }

  return request()
}

export function useSession() {
  return {
    customer: readonly(customer),
    restoring: readonly(restoring),
    restoreSession,
    requestCode,
    verifyCode,
    logout,
    updateProfile,
    uploadPhoto,
    deletePhoto,
    getPhoto
  }
}

export function resetSessionForTests() {
  clearSession()
  restoring.value = true
  refreshPromise = null
}
