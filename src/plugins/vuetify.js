// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

// Define the dark theme colors
const darkTheme = {
  dark: true,
  colors: {
    primary: '#3498db',
    secondary: '#f1c40f',
    accent: '#8e44ad',
    error: '#e74c3c',
    warning: '#f1c40f',
    info: '#2ecc71',
    success: '#2ecc71',
    background: '#141414',
    surface: '#1f1f1f',
    'on-primary': '#ffffff',
    'on-secondary': '#ffffff',
    'on-accent': '#ffffff',
    'on-error': '#ffffff',
    'on-warning': '#ffffff',
    'on-info': '#ffffff',
    'on-success': '#ffffff',
    'on-surface': '#ffffff',
  },
}

// Create the Vuetify instance
export default createVuetify({
  theme: {
    defaultTheme: 'myDarkTheme',
    themes: {
      myDarkTheme: darkTheme,
    },
  },
})