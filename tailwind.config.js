/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.php",
    "./*.html", 
    "./*.js"
  ],
  safelist: [
    'expanded',
    'hidden',
    'chat-container',
    'fade-in',
    'chat-item',
    'chat-item-title',
    'chat-item-delete',
    'active',
    'group',
    'group-hover:opacity-100'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'chat-bg': '#f6f8fa',
        'chat-border': '#d0d7de',
        'user-bg': '#e1ece6',
        'user-border': '#9ebdab',
        'bot-bg': '#f6f8fa',
        'bot-border': '#d0d7de',
        'sidebar-bg': '#f6f8fa',
        'quick-btn': '#f8fafc',
        'dark-primary': '#161b22',
        'dark-secondary': '#21262d',
        'dark-border': '#30363d',
        'dark-accent': '#404040'
      },
      width: {
        'sidebar': '260px',
        'sidebar-collapsed': '60px'
      },
      maxWidth: {
        '800': '800px'
      },
      margin: {
        'sidebar': '260px',
        'sidebar-collapsed': '60px'
      }
    }
  },
  plugins: [],
}
