// src/main.js
// Plugins
import { registerPlugins } from '@/plugins'
import vuetify from './plugins/vuetify'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

// Router
import router from './router'

const app = createApp(App)

registerPlugins(app)
app.use(router)
app.use(vuetify)
app.mount('#app')