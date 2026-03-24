import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import svgLoader from 'vite-svg-loader'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    svgLoader(),
    // vueDevTools(), // 临时禁用 vue-devtools
  ],
  server: {
    port: 5174,
  },
  base: process.env.NODE_ENV === 'production' 
    ? '/sunrise/' // 生产环境使用绝对路径
    : '/', // 开发环境使用根路径
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
