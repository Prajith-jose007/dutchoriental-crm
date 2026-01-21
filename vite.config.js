import path from "path"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (id.includes('three')) {
              return 'three';
            }
            if (id.includes('lucide-react')) {
              return 'lucide-react';
            }
            if (id.includes('lodash')) {
              return 'lodash';
            }
            if (id.includes('recharts')) {
              return 'recharts';
            }
            if (id.includes('date-fns') || id.includes('moment')) {
              return 'date-utils';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});