// Copyright (C) 2026 Maxim [maxirmx] Samsonov (www.sw.consulting)
// All rights reserved.
// This file is a part of Sarafan application

import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from '../src/App.vue'
import { createSarafanVuetify } from '../src/plugins/vuetify.js'

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the empty-project welcome screen', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    const wrapper = mount(App, {
      global: {
        plugins: [createSarafanVuetify()]
      }
    })

    expect(wrapper.get('h1').text()).toContain('Покупки по всему миру')
    expect(wrapper.get('[aria-labelledby="link-title"]').text()).toContain('Что хотите заказать?')
    const orderCards = wrapper.findAll('.order-card')
    expect(orderCards).toHaveLength(2)
    expect(
      orderCards.map((card) =>
        card.findComponent({ name: 'VProgressLinear' }).props('modelValue')
      )
    ).toEqual([46, 68])
    expect(wrapper.text()).toContain('SRF-000123')
    expect(wrapper.text()).toContain('От ссылки до двери')
    expect(wrapper.get('.brand-mark__icon').attributes('src')).toBe('/favicon.svg')
    const partnerLink = wrapper.get('.brand-partner')
    expect(partnerLink.text()).toBe('Совместно с GTC-Express')
    expect(partnerLink.attributes('href')).toBe('https://gtc.express/')
    expect(partnerLink.attributes('target')).toBe('_blank')
    expect(partnerLink.attributes('rel')).toBe('noopener')
  })

  it('prevents brand links from changing the page hash', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    const wrapper = mount(App, {
      global: {
        plugins: [createSarafanVuetify()]
      }
    })

    for (const brand of wrapper.findAll('a.brand-home')) {
      const { MouseEvent } = brand.element.ownerDocument.defaultView
      const click = new MouseEvent('click', { bubbles: true, cancelable: true })

      brand.element.dispatchEvent(click)

      expect(click.defaultPrevented).toBe(true)
    }
  })

  it('shows client and server application versions', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ appVersion: '0.0.1' })
    }))
    const wrapper = mount(App, {
      global: {
        plugins: [createSarafanVuetify()]
      }
    })

    await vi.waitFor(() => {
      expect(wrapper.get('.version-info').text()).toContain('Клиент 0.0.1')
      expect(wrapper.get('.version-info').text()).toContain('Сервер 0.0.1')
    })
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/status/status')
  })

  it('keeps the client version visible when the server version is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const wrapper = mount(App, {
      global: {
        plugins: [createSarafanVuetify()]
      }
    })

    await vi.waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledOnce()
    })
    expect(wrapper.get('.version-info').text()).toBe('Клиент 0.0.1')
  })
})
