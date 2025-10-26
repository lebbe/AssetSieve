import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        background: './src/background.ts',
        devtools: './src/devtools.ts',
        panel: './src/panel.tsx',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'panel.css'
          }
          return '[name].[ext]'
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false, // Bundle all CSS into a single file
  },
  publicDir: 'public',
})
