// Copyright (C) 2026 Maxim [maxirmx] Samsonov (www.sw.consulting)
// All rights reserved.
// This file is a part of the Sarafan application

import {
  ProblemError,
  PROBLEM_TYPE_ROOT,
  createInternalProblem
} from '../errors/problem.js'

export const JSON_ACCEPT = 'application/json, application/problem+json'
export const PHOTO_ACCEPT = 'image/avif, image/webp, image/png, image/jpeg, application/problem+json'

const RUSSIAN_TEXT = /[А-ЯЁа-яё]/u
const CODE_PATTERN = /^[a-z][a-z0-9_]*$/u

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isRussianText(value) {
  return isNonEmptyString(value) && RUSSIAN_TEXT.test(value)
}

function isUriReference(value) {
  if (!isNonEmptyString(value)) return false
  return !/\s/u.test(value) && (/^[a-z][a-z0-9+.-]*:/iu.test(value) || value.startsWith('/'))
}

function validErrors(errors) {
  return isPlainObject(errors) && Object.entries(errors).every(([field, messages]) =>
    isNonEmptyString(field)
    && Array.isArray(messages)
    && messages.length > 0
    && messages.every(isRussianText)
  )
}

function protocolProblem(cause) {
  return createInternalProblem('protocolError', { cause })
}

function invalidProblemReason(document, responseStatus) {
  if (!isPlainObject(document)) return 'Problem document is not an object'
  if (!isNonEmptyString(document.type)
    || !document.type.startsWith(PROBLEM_TYPE_ROOT)
    || document.type.startsWith(`${PROBLEM_TYPE_ROOT}ui/`)
    || !isUriReference(document.type)) return 'Problem type is invalid'
  if (!Number.isInteger(document.status)
    || document.status < 400
    || document.status > 599
    || document.status !== responseStatus) return 'Problem status is invalid'
  if (!isRussianText(document.title)) return 'Problem title is invalid'
  if (!isRussianText(document.detail)) return 'Problem detail is invalid'
  if (!isUriReference(document.instance)) return 'Problem instance is invalid'
  if (!isNonEmptyString(document.code) || !CODE_PATTERN.test(document.code)) {
    return 'Problem code is invalid'
  }
  if (document.errors !== undefined && !validErrors(document.errors)) {
    return 'Problem errors extension is invalid'
  }
  if (document.traceId !== undefined && !isNonEmptyString(document.traceId)) {
    return 'Problem trace identifier is invalid'
  }
  return ''
}

export async function parseProblemResponse(response) {
  const contentType = response.headers?.get?.('Content-Type')
  if (contentType?.split(';', 1)[0].trim().toLowerCase() !== 'application/problem+json') {
    throw protocolProblem(new TypeError('Unexpected problem media type'))
  }

  let document
  try {
    document = await response.json()
  } catch (cause) {
    throw protocolProblem(cause)
  }

  const invalidReason = invalidProblemReason(document, response.status)
  if (invalidReason) throw protocolProblem(new TypeError(invalidReason))
  return new ProblemError(document)
}

async function parseSuccess(response, responseType) {
  if (response.status === 204) return null
  try {
    return responseType === 'blob' ? await response.blob() : await response.json()
  } catch (cause) {
    throw protocolProblem(cause)
  }
}

export function createApiClient({ getAccessToken, refreshSession }) {
  async function request(path, options = {}, policy = {}) {
    const {
      authorize = false,
      retry = true,
      responseType = 'json'
    } = policy
    const headers = new globalThis.Headers(options.headers)
    headers.set('Accept', responseType === 'blob' ? PHOTO_ACCEPT : JSON_ACCEPT)

    const token = getAccessToken()
    if (authorize && token) headers.set('Authorization', `Bearer ${token}`)

    let response
    try {
      response = await globalThis.fetch(path, {
        ...options,
        headers,
        credentials: 'include'
      })
    } catch (cause) {
      throw createInternalProblem('networkUnavailable', { cause })
    }

    if (response.status === 401 && authorize && retry) {
      await refreshSession()
      return request(path, options, { ...policy, authorize: true, retry: false })
    }

    if (!response.ok) throw await parseProblemResponse(response)
    return parseSuccess(response, responseType)
  }

  return Object.freeze({ request })
}
