import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const base = process.env.CI === 'true' && process.env.CI_PROJECT_NAME
  ? `/${process.env.CI_PROJECT_NAME}/`
  : '/'

export default defineConfig({
  base,
  plugins: [react()],
})
