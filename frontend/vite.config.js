import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set base path for GitHub Pages deployment
  // For repo: https://github.com/Raghav-Wadhwa/crowdfund_app
  // Deployed at: https://raghav-wadhwa.github.io/crowdfund_app/
  base: '/crowdfund_app/',
})
