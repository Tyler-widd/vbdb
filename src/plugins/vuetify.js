// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

// Define the dark theme colors
const darkTheme = {
  dark: true,
  colors: {
    primary: '#adbac7',       // Primary color for buttons, links, etc.
    secondary: '#768390',    // Secondary color for less prominent elements
    accent: '#539bf5',       // Accent color for highlights or call-to-action elements
    background: '#22272e',
    surface: '#2d333b',
    'on-primary': '#ffffff',
    'on-secondary': '#ffffff',
    'on-accent': '#ffffff',
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