// Copyright (C) 2026 Maxim [maxirmx] Samsonov (www.sw.consulting)
// All rights reserved.
// This file is a part of the Sarafan application

import { readonly, ref } from 'vue'

import { API_BASE_PATH } from '../api.js'
import { createApiClient } from '../api/client.js'
import {
  CORE_PROBLEM_TYPES,
  ProblemError,
  createInternalProblem
} from '../errors/problem.js'
import { EVENTS } from '../observability/catalogue.js'
import { uiLogger } from '../observability/logger.js'
import { problemAttributes, problemContext } from '../observability/problem-reporting.js'

const accessToken = ref('')
const customer = ref(null)
const restoring = ref(true)
const restoreProblem = ref(null)
let refreshPromise = null

function applySession(session) {
  accessToken.value = session.accessToken
  customer.value = session.customer
  return session.customer
}

function clearSession() {
  accessToken.value = ''
  customer.value = null
}

function jsonOptions(method, body) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }
}

const client = createApiClient({
  getAccessToken: () => accessToken.value,
  refreshSession: operationTrace => refreshSession(operationTrace)
})

async function refreshSession(operationTrace) {
  if (!refreshPromise) {
    refreshPromise = client.request(
      `${API_BASE_PATH}/auth/refresh`,
      { method: 'POST' },
      { operationTrace }
    )
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
  restoreProblem.value = null
  try {
    await refreshSession()
  } catch (error) {
    if (!(error instanceof ProblemError) || error.type !== CORE_PROBLEM_TYPES.invalidRefreshToken) {
      const problem = createInternalProblem('sessionRestoreUnavailable', { cause: error })
      restoreProblem.value = problem
      uiLogger.log(
        EVENTS.sessionRestoreFailed,
        problemAttributes(problem),
        problemContext(error)
      )
    }
  } finally {
    restoring.value = false
  }
}

async function requestCode(phone, purpose) {
  return client.request(
    `${API_BASE_PATH}/auth/code/request`,
    jsonOptions('POST', { phone, purpose })
  )
}

async function getStatus() {
  return client.request(`${API_BASE_PATH}/status/status`)
}

async function verifyCode(payload) {
  const session = await client.request(
    `${API_BASE_PATH}/auth/code/verify`,
    jsonOptions('POST', payload)
  )
  return applySession(session)
}

async function logout() {
  try {
    await client.request(`${API_BASE_PATH}/auth/logout`, { method: 'POST' })
  } finally {
    clearSession()
  }
}

async function updateProfile(profile) {
  customer.value = await client.request(
    `${API_BASE_PATH}/customers/me`,
    jsonOptions('PUT', profile),
    { authorize: true }
  )
  return customer.value
}

async function uploadPhoto(file) {
  const body = new globalThis.FormData()
  body.append('file', file)
  await client.request(
    `${API_BASE_PATH}/customers/me/photo`,
    { method: 'PUT', body },
    { authorize: true }
  )
  customer.value = { ...customer.value, hasPhoto: true }
}

async function deletePhoto() {
  await client.request(
    `${API_BASE_PATH}/customers/me/photo`,
    { method: 'DELETE' },
    { authorize: true }
  )
  customer.value = { ...customer.value, hasPhoto: false }
}

async function getPhoto() {
  return client.request(
    `${API_BASE_PATH}/customers/me/photo`,
    {},
    { authorize: true, responseType: 'blob' }
  )
}

export function useSession() {
  return {
    customer: readonly(customer),
    restoring: readonly(restoring),
    restoreProblem: readonly(restoreProblem),
    restoreSession,
    getStatus,
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
  restoreProblem.value = null
  refreshPromise = null
}
