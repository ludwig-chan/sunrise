<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { useScenesStore } from './stores/scenes'
import { onMounted, ref, onUnmounted } from 'vue'
import Toast from './components/common/Toast.vue'
import FloatingText from './components/common/FloatingText.vue'
import Background from './components/common/Background.vue'
import WeatherEffect from './components/game/WeatherEffect.vue'
import { emitter } from './utils/toast'
import { emitter as gameEmitter } from './utils/eventBus'

const scenesStore = useScenesStore()
const router = useRouter()
const toastVisible = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'info' | 'warning' | 'error'>('info')
let toastTimer: number | null = null

// 监听 toast 事件
emitter.on('showToast', (data: any) => {
  // 如果已经有正在显示的 toast，先清除它的定时器
  if (toastTimer) {
    clearTimeout(toastTimer)
    toastTimer = null
  }
  
  toastMessage.value = data.message
  toastType.value = data.type || 'info'
  toastVisible.value = true
  
  // 2秒后自动隐藏
  toastTimer = window.setTimeout(() => {
    toastVisible.value = false
    toastTimer = null
  }, 2000)
})

emitter.on('hideToast', () => {
  if (toastTimer) {
    clearTimeout(toastTimer)
    toastTimer = null
  }
  toastVisible.value = false
})

gameEmitter.on('battle-start', () => {
  router.push('/battle')
})

onUnmounted(() => {
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
  emitter.all.clear()
})

onMounted(() => {
  // 初始化所有场景
  scenesStore.initializeScenes()
})
</script>

<template>
  <WeatherEffect />
  <Background />
  <RouterView />
  <Toast
    :visible="toastVisible"
    :message="toastMessage"
    :type="toastType"
  />
  <FloatingText />
</template>

<style scoped>
</style>
