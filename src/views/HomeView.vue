<template>
  <main class="game-container">
    <header class="header">
      <GameDateTime />
      <PlayerStatus />
    </header>
    <div class="middle-section">
      <OperationArea />
    </div>
    <footer class="footer">
      <ScenePanel v-model="scenesStore.currentSceneId" :scenes="scenesList" />
    </footer>
  </main>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useTimeStore } from '@/stores/time'
import { useCharacterStore } from '@/stores/character'
import { useScenesStore } from '@/stores/scenes'
import { useBaseSceneStore } from '@/stores/scenes/base'
import { useForestSceneStore } from '@/stores/scenes/forest'
import { emitter, gameLog } from '@/utils/eventBus'
import GameDateTime from '@/components/game/GameDateTime.vue'
import PlayerStatus from '@/components/game/PlayerStatus.vue'
import OperationArea from '@/components/game/OperationArea.vue'
import ScenePanel from '@/components/game/ScenePanel.vue'

const timeStore = useTimeStore()
const characterStore = useCharacterStore()
const scenesStore = useScenesStore()
const baseStore = useBaseSceneStore()
const forestStore = useForestSceneStore()

// 组合已解锁场景信息
const scenesList = computed(() => {
  const allScenes = [
    { id: baseStore.scene.id, name: baseStore.scene.name },
    { id: forestStore.scene.id, name: forestStore.scene.name }
  ];
  return allScenes.filter(scene => scenesStore.unlockedScenes.includes(scene.id));
});

// 无操作超时自动暂停（5分钟）
const INACTIVITY_TIMEOUT = 5 * 60 * 1000
let inactivityTimer: ReturnType<typeof setTimeout> | null = null
const wasAutoPaused = ref(false)
let lastActivityTime = 0

function resetInactivityTimer() {
  const now = Date.now()
  // 节流：mousemove 触发非常频繁，最多每秒处理一次
  if (now - lastActivityTime < 1000) return
  lastActivityTime = now

  if (inactivityTimer) clearTimeout(inactivityTimer)

  // 如果是因无操作自动暂停，用户操作后自动恢复
  if (wasAutoPaused.value && timeStore.paused) {
    timeStore.resumeGame()
    wasAutoPaused.value = false
  }

  inactivityTimer = setTimeout(() => {
    if (!timeStore.paused) {
      timeStore.pauseGame()
      wasAutoPaused.value = true
      gameLog({ text: '游戏已因长时间无操作自动暂停', type: 'SYSTEM' })
      emitter.emit('game-auto-paused')
    }
  }, INACTIVITY_TIMEOUT)
}

const inactivityEvents = ['mousemove', 'keydown', 'click', 'touchstart'] as const

// hourly 事件处理器引用，用于卸载时清除
function onHourPassed() {
  characterStore.hourlyUpdate()
}

// 当进入游戏页面时启动时间系统
onMounted(() => {
  timeStore.startTime()
  timeStore.resumeGame()

  // 连接 hour-passed 事件到角色每小时更新
  emitter.on('hour-passed', onHourPassed)

  // 启动无操作监听
  inactivityEvents.forEach(ev => window.addEventListener(ev, resetInactivityTimer, { passive: true }))
  resetInactivityTimer()
})

// 当离开游戏页面时停止时间系统
onUnmounted(() => {
  timeStore.stopTime()

  // 清除 hour-passed 事件监听
  emitter.off('hour-passed', onHourPassed)

  // 清除无操作监听和定时器
  inactivityEvents.forEach(ev => window.removeEventListener(ev, resetInactivityTimer))
  if (inactivityTimer) {
    clearTimeout(inactivityTimer)
    inactivityTimer = null
  }
})
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  padding: 1rem;
  gap: 1rem;
}

.header {
  flex: 0 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
}

.middle-section {
  flex: 1;
  display: flex;
  overflow: auto;
  gap: 1rem;
}

.footer {
  flex: 0 0 auto;
  width: 100%;
}
</style>
