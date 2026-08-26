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
    expect(wrapper.findAll('.order-card')).toHaveLength(2)
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
      let defaultPrevented = false
      brand.element.addEventListener('click', (event) => {
        defaultPrevented = event.defaultPrevented
      })

      brand.element.click()

      expect(defaultPrevented).toBe(true)
    }
  })
})
