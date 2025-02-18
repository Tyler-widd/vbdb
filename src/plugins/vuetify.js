// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

// Define the dark theme colors
const darkTheme = {
  dark: true,
  colors: {
    primary: '#adbac7',
    secondary: '#768390',
    accent: '#539bf5',
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