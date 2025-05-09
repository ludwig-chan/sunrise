<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useScenesStore } from './stores/scenes'
import { onMounted, ref, onUnmounted } from 'vue'
import Background from './components/common/Background.vue'
import Toast from './components/common/Toast.vue'
import { emitter } from './utils/toast'

const scenesStore = useScenesStore()
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
  <Background />
  <RouterView />
  <Toast
    :visible="toastVisible"
    :message="toastMessage"
    :type="toastType"
  />
</template>

<style scoped>
</style>
