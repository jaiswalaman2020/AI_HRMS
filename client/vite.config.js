import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API + socket calls to the backend during development.
      '/api': 'http://localhost:5050',
      '/socket.io': { target: 'http://localhost:5050', ws: true },
    },
  },
});
