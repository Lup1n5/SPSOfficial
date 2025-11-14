import { defineConfig } from 'vite'

// Use GitHub Pages base so the built site works reliably in iOS PWA and when deployed to /SPSOfficial/
export default defineConfig({
  base: '/SPSOfficial/',
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
