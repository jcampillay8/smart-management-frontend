import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0', // Permite acceso desde el celular en red local
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // Apunta al backend local de forma agnóstica a la red
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
