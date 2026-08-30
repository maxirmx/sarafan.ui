// Copyright (C) 2026 Maxim [maxirmx] Samsonov (www.sw.consulting)
// All rights reserved.
// This file is a part of the Sarafan application

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AuthView from '../src/components/AuthView.vue'
import { createSarafanVuetify } from '../src/plugins/vuetify.js'
import { resetSessionForTests, useSession } from '../src/stores/session.js'

function response(status, body = null) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body)
  }
}

function mountView() {
  return mount(AuthView, {
    global: { plugins: [createSarafanVuetify()] }
  })
}

describe('AuthView', () => {
  beforeEach(resetSessionForTests)

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('validates registration, consent, and server errors before authenticating', async () => {
    const customer = { id: 9, phone: '+79991234567', profile: { phone: '+79991234567' } }
    let requestAttempts = 0
    let verifyAttempts = 0
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url === '/api/v1/auth/code/request') {
        requestAttempts += 1
        return Promise.resolve(requestAttempts === 1
          ? response(404, { detail: 'Код для регистрации недоступен' })
          : response(202, { message: 'sent' }))
      }
      if (url === '/api/v1/auth/code/verify') {
        verifyAttempts += 1
        return Promise.resolve(verifyAttempts === 1
          ? response(401, { detail: 'Неверный код' })
          : response(200, {
              accessToken: 'token',
              expiresAt: '2026-08-30T00:15:00Z',
              customer
            }))
      }
      throw new Error(`Unexpected request: ${url}`)
    }))

    const wrapper = mountView()
    await wrapper.get('.auth-form').trigger('submit')
    expect(wrapper.get('.form-error').text()).toBe('Введите номер телефона')

    await wrapper.findAll('[role="tab"]')[1].trigger('click')
    expect(wrapper.get('h1').text()).toBe('Создайте аккаунт')
    await wrapper.get('input[name="phone"]').setValue('+7 999 123-45-67')
    await wrapper.get('.auth-form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('.form-error').text()).toBe('Код для регистрации недоступен')

    await wrapper.get('.auth-form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Введите код')
    expect(wrapper.text()).toContain('используйте 1111')

    await wrapper.get('.auth-form').trigger('submit')
    expect(wrapper.get('.form-error').text()).toBe('Введите код подтверждения')
    await wrapper.get('input[name="code"]').setValue('1111')
    await wrapper.get('.auth-form').trigger('submit')
    expect(wrapper.get('.form-error').text()).toContain('принять оба согласия')

    const consents = wrapper.findAll('input[type="checkbox"]')
    await consents[0].setValue(true)
    await wrapper.get('.auth-form').trigger('submit')
    expect(wrapper.get('.form-error').text()).toContain('принять оба согласия')
    await consents[1].setValue(true)

    await wrapper.get('.auth-form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('.form-error').text()).toBe('Неверный код')
    await wrapper.get('.auth-form').trigger('submit')
    await flushPromises()
    expect(useSession().customer.value).toEqual(customer)

    await wrapper.get('.auth-back').trigger('click')
    expect(wrapper.get('input[name="phone"]').element.value).toBe('+7 999 123-45-67')
    await wrapper.findAll('[role="tab"]')[0].trigger('click')
    expect(wrapper.get('h1').text()).toBe('Рады видеть снова')
  })

  it('trims authentication values before sending them to the API', async () => {
    const customer = { id: 10, phone: '+79991234567', profile: { phone: '+79991234567' } }
    const fetch = vi.fn((url) => {
      if (url === '/api/v1/auth/code/request') return Promise.resolve(response(202, { message: 'sent' }))
      if (url === '/api/v1/auth/code/verify') {
        return Promise.resolve(response(200, {
          accessToken: 'token',
          expiresAt: '2026-08-30T00:15:00Z',
          customer
        }))
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    vi.stubGlobal('fetch', fetch)

    const wrapper = mountView()
    await wrapper.get('input[name="phone"]').setValue('  +7 999 123-45-67  ')
    await wrapper.get('.auth-form').trigger('submit')
    await flushPromises()
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      phone: '+7 999 123-45-67',
      purpose: 'login'
    })

    await wrapper.get('input[name="code"]').setValue('  1111  ')
    await wrapper.get('.auth-form').trigger('submit')
    await flushPromises()
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({
      phone: '+7 999 123-45-67',
      purpose: 'login',
      code: '1111'
    })
  })

  it('explains a missing login account and handles an unavailable service', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(response(404, { detail: 'not found' }))
      .mockRejectedValueOnce()
    vi.stubGlobal('fetch', fetch)

    const wrapper = mountView()
    await wrapper.get('input[name="phone"]').setValue('+7 999 000-00-00')
    await wrapper.get('.auth-form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('.form-error').text()).toContain('Пользователь с таким телефоном не найден')

    await wrapper.get('.auth-form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('.form-error').text()).toBe('Сервис временно недоступен')
  })
})
