import { defineConfig } from 'vite'

// Use a relative base so the built site works when deployed to GitHub Pages
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
        spin: './SPiN.html'
      }
    },
    copyPublicDir: true
  },
  publicDir: 'public',
  server: {
    port: 3000,
    open: true
  }
})
