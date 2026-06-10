import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { netlifyFunctions } from './vite-plugin-netlify-functions.js';

export default defineConfig({
  plugins: [react(), netlifyFunctions()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: true,
    allowedHosts: ['.ngrok-free.app'],
  },
});
