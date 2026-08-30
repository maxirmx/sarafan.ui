// Copyright (C) 2026 Maxim [maxirmx] Samsonov (www.sw.consulting)
// All rights reserved.
// This file is a part of the Sarafan application

import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  JSON_ACCEPT,
  PHOTO_ACCEPT,
  createApiClient,
  parseProblemResponse
} from '../src/api/client.js'
import { INTERNAL_PROBLEM_TYPES, ProblemError } from '../src/errors/problem.js'
import { problem, problemResponse, response } from './fixtures/http.js'

describe('RFC 9457 API client', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('preserves a complete domain and validation problem', async () => {
    const errors = { phone: ['Введите номер телефона'] }
    const result = await parseProblemResponse(problemResponse(400, 'validation-failed', {
      title: 'Некорректный запрос',
      detail: 'Исправьте указанные поля и повторите запрос',
      errors
    }))

    expect(result).toBeInstanceOf(ProblemError)
    expect(result).toMatchObject({
      type: 'https://sarafan.sw.consulting/problems/validation-failed',
      title: 'Некорректный запрос',
      status: 400,
      detail: 'Исправьте указанные поля и повторите запрос',
      instance: 'urn:sarafan:problem:validation-failed:400',
      code: 'validation_failed',
      errors,
      traceId: 'trace-validation-failed-400'
    })
  })

  it.each([
    ['missing body', null],
    ['missing type', { type: undefined }],
    ['foreign type', { type: 'https://example.test/problem' }],
    ['internal UI type', { type: 'https://sarafan.sw.consulting/problems/ui/protocol-error' }],
    ['invalid status', { status: 399 }],
    ['English title', { title: 'Bad request' }],
    ['missing detail', { detail: undefined }],
    ['invalid instance', { instance: '' }],
    ['invalid code', { code: 'Invalid-Code' }],
    ['invalid errors object', { errors: [] }],
    ['empty field messages', { errors: { phone: [] } }],
    ['English field message', { errors: { phone: ['Phone is required'] } }],
    ['invalid trace identifier', { traceId: '' }]
  ])('normalizes a malformed problem: %s', async (_label, overrides) => {
    const body = overrides === null ? null : problem(400, 'validation-failed', overrides)
    const invalid = response(400, body, 'application/problem+json')

    await expect(parseProblemResponse(invalid)).rejects.toMatchObject({
      type: INTERNAL_PROBLEM_TYPES.protocolError
    })
    await expect(parseProblemResponse(invalid)).rejects.not.toHaveProperty('status')
  })

  it('rejects status mismatches, wrong media types, and invalid JSON', async () => {
    const mismatch = problemResponse(400, 'validation-failed', { status: 422 })
    const wrongMedia = response(400, problem(400, 'validation-failed'), 'application/json')
    const invalidJson = response(400, null, 'application/problem+json')
    invalidJson.json.mockRejectedValue(new SyntaxError('invalid json'))

    for (const invalid of [mismatch, wrongMedia, invalidJson]) {
      await expect(parseProblemResponse(invalid)).rejects.toMatchObject({
        type: INTERNAL_PROBLEM_TYPES.protocolError
      })
    }
  })

  it('adds JSON negotiation, credentials, bearer auth, and retries once after refresh', async () => {
    let token = 'old-token'
    const refreshSession = vi.fn(async () => { token = 'new-token' })
    const fetch = vi.fn()
      .mockResolvedValueOnce(problemResponse(401, 'invalid-access-token', {
        title: 'Недействительный токен доступа',
        detail: 'Обновите сеанс и повторите запрос'
      }))
      .mockResolvedValueOnce(response(200, { ok: true }))
    vi.stubGlobal('fetch', fetch)
    const client = createApiClient({ getAccessToken: () => token, refreshSession })

    await expect(client.request('/resource', {}, { authorize: true })).resolves.toEqual({ ok: true })

    expect(refreshSession).toHaveBeenCalledOnce()
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch.mock.calls[0][1].headers.get('Accept')).toBe(JSON_ACCEPT)
    expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer old-token')
    expect(fetch.mock.calls[1][1].headers.get('Authorization')).toBe('Bearer new-token')
    expect(fetch.mock.calls[1][1].credentials).toBe('include')
  })

  it('negotiates photo responses and handles bodyless successes', async () => {
    const photo = new globalThis.Blob(['image'], { type: 'image/png' })
    const fetch = vi.fn()
      .mockResolvedValueOnce(response(200, photo, 'image/png'))
      .mockResolvedValueOnce(response(204))
    vi.stubGlobal('fetch', fetch)
    const client = createApiClient({ getAccessToken: () => '', refreshSession: vi.fn() })

    await expect(client.request('/photo', {}, { responseType: 'blob' })).resolves.toBe(photo)
    expect(fetch.mock.calls[0][1].headers.get('Accept')).toBe(PHOTO_ACCEPT)
    await expect(client.request('/empty', { method: 'DELETE' })).resolves.toBeNull()
  })

  it('normalizes rejected fetch and malformed success bodies', async () => {
    const malformed = response(200, null)
    malformed.json.mockRejectedValue(new SyntaxError('bad response'))
    const fetch = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(malformed)
    vi.stubGlobal('fetch', fetch)
    const client = createApiClient({ getAccessToken: () => '', refreshSession: vi.fn() })

    await expect(client.request('/offline')).rejects.toMatchObject({
      type: INTERNAL_PROBLEM_TYPES.networkUnavailable
    })
    await expect(client.request('/malformed')).rejects.toMatchObject({
      type: INTERNAL_PROBLEM_TYPES.protocolError
    })
  })
})
