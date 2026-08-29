// Copyright (C) 2026 Maxim [maxirmx] Samsonov (www.sw.consulting)
// All rights reserved.
// This file is a part of the Sarafan application

import { createApp } from 'vue'
import 'vuetify/styles'

import App from './App.vue'
import { createSarafanVuetify } from './plugins/vuetify.js'
import './styles.css'

createApp(App).use(createSarafanVuetify()).mount('#app')
