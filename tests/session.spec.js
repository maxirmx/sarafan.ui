// Copyright (C) 2026 Maxim [maxirmx] Samsonov (www.sw.consulting)
// All rights reserved.
// This file is a part of the Sarafan application

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, resetSessionForTests, useSession } from '../src/stores/session.js'

function response(status, body = null) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
    blob: vi.fn().mockResolvedValue(body)
  }
}

describe('session store', () => {
  beforeEach(resetSessionForTests)

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses the bearer token for profile updates', async () => {
    const originalCustomer = {
      id: 1,
      phone: '+79990000001',
      state: 'preliminary',
      hasPhoto: false,
      profile: { phone: '+79990000001' }
    }
    const updatedCustomer = {
      ...originalCustomer,
      state: 'complete',
      profile: { ...originalCustomer.profile, firstName: 'Анна' }
    }
    const fetch = vi.fn((url) => {
      if (url === '/api/v1/auth/code/verify') {
        return Promise.resolve(response(200, {
          accessToken: 'jwt-value',
          expiresAt: '2026-08-30T00:15:00Z',
          customer: originalCustomer
        }))
      }
      if (url === '/api/v1/customers/me') return Promise.resolve(response(200, updatedCustomer))
      throw new Error(`Unexpected request: ${url}`)
    })
    vi.stubGlobal('fetch', fetch)

    const session = useSession()
    await session.verifyCode({ phone: originalCustomer.phone, purpose: 'login', code: '1111' })
    await session.updateProfile({ firstName: 'Анна' })

    const updateCall = fetch.mock.calls.find(([url]) => url === '/api/v1/customers/me')
    expect(updateCall[1].headers.get('Authorization')).toBe('Bearer jwt-value')
    expect(session.customer.value.profile.firstName).toBe('Анна')
  })

  it('refreshes once and retries an authorized request after a 401', async () => {
    const customer = {
      id: 2,
      phone: '+79990000002',
      state: 'complete',
      hasPhoto: false,
      profile: { phone: '+79990000002', firstName: 'Иван' }
    }
    let profileAttempts = 0
    const fetch = vi.fn((url) => {
      if (url === '/api/v1/auth/code/verify') {
        return Promise.resolve(response(200, {
          accessToken: 'old-token',
          expiresAt: '2026-08-30T00:15:00Z',
          customer
        }))
      }
      if (url === '/api/v1/customers/me') {
        profileAttempts += 1
        return Promise.resolve(profileAttempts === 1 ? response(401, {}) : response(200, customer))
      }
      if (url === '/api/v1/auth/refresh') {
        return Promise.resolve(response(200, {
          accessToken: 'new-token',
          expiresAt: '2026-08-30T00:30:00Z',
          customer
        }))
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    vi.stubGlobal('fetch', fetch)

    const session = useSession()
    await session.verifyCode({ phone: customer.phone, purpose: 'login', code: '1111' })
    await session.updateProfile({ firstName: 'Иван' })

    const profileCalls = fetch.mock.calls.filter(([url]) => url === '/api/v1/customers/me')
    expect(profileCalls).toHaveLength(2)
    expect(profileCalls[1][1].headers.get('Authorization')).toBe('Bearer new-token')
    expect(fetch.mock.calls.filter(([url]) => url === '/api/v1/auth/refresh')).toHaveLength(1)
  })

  it('restores one shared refresh request and clears an unavailable session', async () => {
    const customer = { id: 3, phone: '+79990000003', profile: { phone: '+79990000003' } }
    const fetch = vi.fn()
      .mockResolvedValueOnce(response(200, {
        accessToken: 'restored-token',
        expiresAt: '2026-08-30T00:15:00Z',
        customer
      }))
      .mockResolvedValueOnce(response(401, { detail: 'expired' }))
    vi.stubGlobal('fetch', fetch)

    const session = useSession()
    await Promise.all([session.restoreSession(), session.restoreSession()])
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(session.customer.value).toEqual(customer)
    expect(session.restoring.value).toBe(false)

    await session.restoreSession()
    expect(session.customer.value).toBeNull()
    expect(session.restoring.value).toBe(false)
  })

  it('returns validation details and a fallback for malformed error responses', async () => {
    const malformed = response(502)
    malformed.json.mockRejectedValue(new Error('not json'))
    const fetch = vi.fn()
      .mockResolvedValueOnce(response(400, {
        errors: { Phone: ['Phone is required'], Purpose: ['Purpose is invalid'] },
        code: 'validation_failed'
      }))
      .mockResolvedValueOnce(malformed)
    vi.stubGlobal('fetch', fetch)

    const session = useSession()
    await expect(session.requestCode('', 'bad')).rejects.toMatchObject({
      message: 'Phone is required Purpose is invalid',
      status: 400,
      code: 'validation_failed'
    })
    await expect(session.requestCode('+79990000004', 'login')).rejects.toEqual(
      new ApiError('Не удалось выполнить запрос', 502)
    )
  })

  it('uploads, refreshes, reads, and deletes a profile photo', async () => {
    const customer = {
      id: 4,
      phone: '+79990000004',
      state: 'preliminary',
      hasPhoto: false,
      profile: { phone: '+79990000004' }
    }
    const photo = new globalThis.Blob(['image'], { type: 'image/png' })
    let photoReads = 0
    const fetch = vi.fn((url) => {
      if (url === '/api/v1/auth/code/verify') {
        return Promise.resolve(response(200, {
          accessToken: 'photo-token',
          expiresAt: '2026-08-30T00:15:00Z',
          customer
        }))
      }
      if (url === '/api/v1/customers/me/photo') {
        const call = fetch.mock.calls.at(-1)[1]
        if (call.method === 'PUT') return Promise.resolve(response(204))
        if (call.method === 'DELETE') return Promise.resolve(response(204))
        photoReads += 1
        return Promise.resolve(photoReads === 1 ? response(401, {}) : response(200, photo))
      }
      if (url === '/api/v1/auth/refresh') {
        return Promise.resolve(response(200, {
          accessToken: 'refreshed-photo-token',
          expiresAt: '2026-08-30T00:30:00Z',
          customer: { ...customer, hasPhoto: true }
        }))
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    vi.stubGlobal('fetch', fetch)

    const session = useSession()
    await session.verifyCode({ phone: customer.phone, purpose: 'login', code: '1111' })
    const file = new globalThis.File(['png'], 'photo.png', { type: 'image/png' })
    await session.uploadPhoto(file)
    expect(session.customer.value.hasPhoto).toBe(true)
    const uploadCall = fetch.mock.calls.find(([, options]) => options.method === 'PUT')
    expect(uploadCall[1].body.get('file')).toEqual(file)

    expect(await session.getPhoto()).toBe(photo)
    expect(fetch.mock.calls.at(-1)[1].headers.Authorization).toBe('Bearer refreshed-photo-token')

    await session.deletePhoto()
    expect(session.customer.value.hasPhoto).toBe(false)
  })

  it('clears local state when logout fails and surfaces photo errors', async () => {
    const customer = { id: 5, phone: '+79990000005', profile: { phone: '+79990000005' } }
    const fetch = vi.fn((url) => {
      if (url === '/api/v1/auth/code/verify') {
        return Promise.resolve(response(200, {
          accessToken: 'token',
          expiresAt: '2026-08-30T00:15:00Z',
          customer
        }))
      }
      if (url === '/api/v1/customers/me/photo') {
        return Promise.resolve(response(415, { title: 'Unsupported photo', code: 'invalid_photo' }))
      }
      if (url === '/api/v1/auth/logout') throw new Error('offline')
      throw new Error(`Unexpected request: ${url}`)
    })
    vi.stubGlobal('fetch', fetch)

    const session = useSession()
    await session.verifyCode({ phone: customer.phone, purpose: 'login', code: '1111' })
    await expect(session.getPhoto()).rejects.toMatchObject({
      message: 'Unsupported photo',
      status: 415,
      code: 'invalid_photo'
    })
    await expect(session.logout()).rejects.toThrow('offline')
    expect(session.customer.value).toBeNull()
  })
})
