import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path for GitHub Pages project site (repo name)
export default defineConfig({
  base: '/sub-track/',
  plugins: [react()],
})
