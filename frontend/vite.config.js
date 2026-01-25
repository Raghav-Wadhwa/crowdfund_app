import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  // Use /crowdfund_app/ for production (GitHub Pages)
  // Use / for development (local)
  const base = command === 'build' ? '/crowdfund_app/' : '/';
  
  return {
    plugins: [react()],
    base: base,
  };
})
