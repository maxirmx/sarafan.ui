import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import 'vuetify/styles'

import App from './App.vue'
import './styles.css'

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'sarafanLight',
    themes: {
      sarafanLight: {
        dark: false,
        colors: {
          primary: '#5d3fd3',
          secondary: '#c53d68',
          background: '#f7f5ff',
          surface: '#ffffff'
        }
      }
    }
  }
})

createApp(App).use(vuetify).mount('#app')
