import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'
import ActionButton from './components/common/ActionButton.vue'
import BlockWrapper from './components/common/BlockWrapper.vue'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.component('ActionButton', ActionButton)
app.component('BlockWrapper', BlockWrapper)

// 禁用移动端长按菜单
document.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  return false
})

// 禁用移动端下拉刷新
let startY: number
document.addEventListener('touchstart', (e) => {
  startY = e.touches[0].pageY
}, { passive: true })

document.addEventListener('touchmove', (e) => {
  // 检查事件源是否是最外层容器或 body/document
  const target = e.target as HTMLElement
  const isTopLevelContainer = 
    target === document.documentElement ||
    target === document.body ||
    target === document.getElementById('app')

  // 如果不是顶层容器的事件，让子组件自行处理
  if (!isTopLevelContainer) {
    return
  }

  const currentY = e.touches[0].pageY
  const direction = currentY - startY
  
  // 只有在顶部下拉时才阻止默认行为
  if (document.documentElement.scrollTop === 0 && direction > 0) {
    e.preventDefault()
  }
}, { passive: false })

app.mount('#app')
