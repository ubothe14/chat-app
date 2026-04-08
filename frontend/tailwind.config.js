/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wa-bg-deep': '#0b141a',
        'wa-bg-dark': '#111b21',
        'wa-bg-panel': '#202c33',
        'wa-bg-hover': '#2a3942',
        'wa-bg-active': '#2a3942',
        'wa-bg-input': '#2a3942',
        'wa-bg-msg-out': '#005c4b',
        'wa-bg-msg-in': '#202c33',
        'wa-bg-chat': '#0b141a',
        'wa-bg-icon-bar': '#1f2c34',
        'wa-border': '#2a3942',
        'wa-border-light': '#313d45',
        'wa-green': '#00a884',
        'wa-green-dark': '#025144',
        'wa-green-light': '#21c063',
        'wa-teal': '#008069',
        'wa-blue-check': '#53bdeb',
        'wa-text-primary': '#e9edef',
        'wa-text-secondary': '#8696a0',
        'wa-text-muted': '#667781',
        'wa-text-bubble': '#d1d7db',
        'wa-tab-active': '#0a332c',
        'wa-tab-border': '#00a884',
        'wa-separator': '#233138',
      },
      fontFamily: {
        'wa': ['Segoe UI', 'Helvetica Neue', 'Helvetica', 'Lucida Grande', 'Arial', 'Ubuntu', 'Cantarell', 'Fira Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
