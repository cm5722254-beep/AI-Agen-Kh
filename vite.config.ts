import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// vite-plugin-monaco-editor export is inconsistent across bundlers
// Use dynamic require to get the actual function
// eslint-disable-next-line @typescript-eslint/no-var-requires
const monacoEditorPlugin = require('vite-plugin-monaco-editor')
const monacoPlugin = monacoEditorPlugin.default ?? monacoEditorPlugin

export default defineConfig({
  plugins: [
    react(),
    monacoPlugin({
      languageWorkers: ['editorWorkerService', 'typescript', 'json', 'html', 'css'],
    }),
  ],
  base: './',
  root: 'src/renderer',
  publicDir: resolve(__dirname, 'src/renderer/public'),
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/renderer/index.html'),
      output: {
        manualChunks: {
          // Split Monaco into its own chunk (it's large)
          'monaco-editor': ['monaco-editor'],
          // React ecosystem
          'react-vendor': ['react', 'react-dom'],
          // Charts
          'recharts': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 2500,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@shared':   resolve(__dirname, 'src/shared'),
      '@renderer': resolve(__dirname, 'src/renderer'),
    },
  },
})
