import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss()
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'build',
    // Optimizaciones para build más rápido
    target: 'es2015',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-avatar', '@radix-ui/react-label', '@radix-ui/react-separator', '@radix-ui/react-slot'],
          utils: ['axios', 'clsx', 'tailwind-merge', 'zod'],
          icons: ['lucide-react'],
          forms: ['react-hook-form', '@hookform/resolvers'],
          query: ['@tanstack/react-query'],
          socket: ['socket.io-client'],
          store: ['zustand']
        }
      }
    },
    // Incrementar el límite de chunk para evitar warnings
    chunkSizeWarningLimit: 1000,
    // Usar más workers para builds paralelos
    ...(process.env.NODE_ENV === 'production' && {
      reportCompressedSize: false,
      sourcemap: false
    })
  },
  // Optimizaciones de dependencias
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'socket.io-client',
      'zustand',
      'zod',
      'react-hook-form',
      '@hookform/resolvers',
      'lucide-react'
    ]
  }
})