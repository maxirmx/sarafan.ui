import { createApp } from 'vue'
import 'vuetify/styles'

import App from './App.vue'
import { createSarafanVuetify } from './plugins/vuetify.js'
import './styles.css'

createApp(App).use(createSarafanVuetify()).mount('#app')
