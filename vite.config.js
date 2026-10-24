import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tutor from './server/tutor.js'

export default defineConfig({
  // GitHub Pages serves the site from /<repo>/; set by the deploy workflow.
  base: process.env.BASE_PATH || '/',
  plugins: [react(), tutor()],
})
