// Copyright (C) 2026 Maxim [maxirmx] Samsonov (www.sw.consulting)
// All rights reserved.
// This file is a part of Sarafan application

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import App from '../src/App.vue'
import { createSarafanVuetify } from '../src/plugins/vuetify.js'

describe('App', () => {
  it('renders the empty-project welcome screen', () => {
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
  })

  it('prevents brand links from changing the page hash', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createSarafanVuetify()]
      }
    })

    for (const brand of wrapper.findAll('a.brand')) {
      const { MouseEvent } = brand.element.ownerDocument.defaultView
      const click = new MouseEvent('click', { bubbles: true, cancelable: true })

      brand.element.dispatchEvent(click)

      expect(click.defaultPrevented).toBe(true)
    }
  })
})
