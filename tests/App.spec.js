// Copyright (C) 2026 Maxim [maxirmx] Samsonov (www.sw.consulting)
// All rights reserved.
// This file is a part of the Sarafan application

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../src/App.vue'
import { createSarafanVuetify } from '../src/plugins/vuetify.js'
import { resetSessionForTests } from '../src/stores/session.js'

const customer = {
  id: 17,
  phone: '+79991234567',
  state: 'preliminary',
  hasPhoto: false,
  profile: {
    phone: '+79991234567',
    firstName: 'Мария',
    lastName: 'Ковалёва'
  }
}

function response(status, body = null) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body)
  }
}

function mountApp() {
  return mount(App, {
    global: { plugins: [createSarafanVuetify()] }
  })
}

describe('App authentication flow', () => {
  beforeEach(resetSessionForTests)

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows authentication when no refresh session is available', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url === '/api/v1/status/status') return Promise.resolve(response(200, { appVersion: '0.0.3' }))
      if (url === '/api/v1/auth/refresh') return Promise.resolve(response(401, { detail: 'expired' }))
      throw new Error(`Unexpected request: ${url}`)
    }))

    const wrapper = mountApp()
    await vi.waitFor(() => expect(wrapper.find('.auth-card').exists()).toBe(true))

    expect(wrapper.get('h1').text()).toBe('Рады видеть снова')
    expect(wrapper.text()).toContain('Регистрация')
  })

  it('restores a session and renders the customer dashboard', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url === '/api/v1/status/status') return Promise.resolve(response(200, { appVersion: '0.0.3' }))
      if (url === '/api/v1/auth/refresh') {
        return Promise.resolve(response(200, {
          accessToken: 'access-token',
          expiresAt: '2026-08-30T00:15:00Z',
          customer
        }))
      }
      throw new Error(`Unexpected request: ${url}`)
    }))

    const wrapper = mountApp()
    await vi.waitFor(() => expect(wrapper.find('.hero-section').exists()).toBe(true))

    expect(wrapper.get('.hero-kicker').text()).toContain('Мария')
    expect(wrapper.get('.profile-avatar').text()).toBe('МК')
    expect(wrapper.findAll('.order-card')).toHaveLength(2)
  })

  it('requests and verifies a one-time login code', async () => {
    const fetch = vi.fn((url) => {
      if (url === '/api/v1/status/status') return Promise.resolve(response(200, { appVersion: '0.0.3' }))
      if (url === '/api/v1/auth/refresh') return Promise.resolve(response(401, { detail: 'expired' }))
      if (url === '/api/v1/auth/code/request') return Promise.resolve(response(202, { message: 'sent' }))
      if (url === '/api/v1/auth/code/verify') {
        return Promise.resolve(response(200, {
          accessToken: 'access-token',
          expiresAt: '2026-08-30T00:15:00Z',
          customer
        }))
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    vi.stubGlobal('fetch', fetch)

    const wrapper = mountApp()
    await vi.waitFor(() => expect(wrapper.find('.auth-card').exists()).toBe(true))

    await wrapper.get('input[name="phone"]').setValue('+7 999 123-45-67')
    await wrapper.get('.auth-form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Введите код')

    await wrapper.get('input[name="code"]').setValue('1111')
    await wrapper.get('.auth-form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.find('.hero-section').exists()).toBe(true))

    const verificationCall = fetch.mock.calls.find(([url]) => url === '/api/v1/auth/code/verify')
    expect(JSON.parse(verificationCall[1].body)).toMatchObject({
      phone: '+7 999 123-45-67',
      purpose: 'login',
      code: '1111'
    })
    expect(verificationCall[1].credentials).toBe('include')
  })

  it('opens profile from every navigation entry and logs out if the server is offline', async () => {
    const preliminaryCustomer = {
      ...customer,
      profile: { phone: customer.phone }
    }
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url === '/api/v1/status/status') return Promise.resolve(response(503))
      if (url === '/api/v1/auth/refresh') {
        return Promise.resolve(response(200, {
          accessToken: 'access-token',
          expiresAt: '2026-08-30T00:15:00Z',
          customer: preliminaryCustomer
        }))
      }
      if (url === '/api/v1/auth/logout') return Promise.reject(new Error('offline'))
      throw new Error(`Unexpected request: ${url}`)
    }))

    const wrapper = mountApp()
    await vi.waitFor(() => expect(wrapper.find('.app-frame').exists()).toBe(true))
    expect(wrapper.get('.profile-avatar').text()).toBe('С')
    expect(wrapper.get('.profile-button').attributes('aria-label')).toContain('покупатель')

    const profileDialog = () => wrapper.findComponent({ name: 'ProfileDialog' })
    const desktopProfile = wrapper.findAll('.nav-item').find((button) => button.text().includes('Профиль'))
    await desktopProfile.trigger('click')
    await profileDialog().vm.$emit('update:modelValue', false)
    await wrapper.get('.profile-button').trigger('click')
    await profileDialog().vm.$emit('update:modelValue', false)
    await wrapper.findAll('.mobile-nav__item').at(-1).trigger('click')
    await profileDialog().vm.$emit('update:modelValue', false)

    await wrapper.get('.nav-item--muted').trigger('click')
    await vi.waitFor(() => expect(wrapper.find('.auth-card').exists()).toBe(true))
  })

  it('keeps running when the version request fails and completes server logout', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url === '/api/v1/status/status') throw new Error('status offline')
      if (url === '/api/v1/auth/refresh') {
        return Promise.resolve(response(200, {
          accessToken: 'access-token',
          expiresAt: '2026-08-30T00:15:00Z',
          customer
        }))
      }
      if (url === '/api/v1/auth/logout') return Promise.resolve(response(204))
      throw new Error(`Unexpected request: ${url}`)
    }))

    const wrapper = mountApp()
    await vi.waitFor(() => expect(wrapper.find('.app-frame').exists()).toBe(true))
    await wrapper.get('.nav-item--muted').trigger('click')
    await vi.waitFor(() => expect(wrapper.find('.auth-card').exists()).toBe(true))
  })
})
