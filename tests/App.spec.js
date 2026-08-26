import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { describe, expect, it } from 'vitest'

import App from '../src/App.vue'

describe('App', () => {
  it('renders the empty-project welcome screen', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createVuetify()]
      }
    })

    expect(wrapper.get('h1').text()).toBe('Sarafan')
    expect(wrapper.text()).toContain('Ready for development')
    expect(wrapper.text()).toContain('Vuetify 4')
  })
})
