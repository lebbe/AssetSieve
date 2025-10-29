import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    minify: mode === 'production',
    sourcemap: mode === 'development' ? 'inline' : false,
    rollupOptions: {
      input: {
        background: './src/background.ts',
        devtools: './src/devtools.ts',
        panel: './src/panel.tsx',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'ch_[name].js',
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
}))
