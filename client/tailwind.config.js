/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        containerBg: '#f5f5f5',
        headerBg: '#e0e0e0',
        border: '#999999',
        text: '#333333',
        button: '#cccccc',
        accent: '#1976d2',
        error: '#d32f2f',
        success: '#388e3c',
      },
    },
  },
  plugins: [],
}
