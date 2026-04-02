<template>
  <main class="game-container">
    <header class="header">
      <GameDateTime />
      <PlayerStatus />
      <GameLogPreview />
    </header>
    <div class="middle-section">
      <OperationArea />
    </div>
    <footer class="footer">
      <ScenePanel v-model="scenesStore.currentSceneId" :scenes="scenesList" />
    </footer>
  </main>
  <PlayerMenuModal v-model="showMenu" @resume="timeStore.resumeGame()" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useTimeStore } from '@/stores/time'
import { useCharacterStore } from '@/stores/character'
import { useScenesStore } from '@/stores/scenes'
import { useBaseSceneStore } from '@/stores/scenes/base'
import { useForestSceneStore } from '@/stores/scenes/forest'
import { useRiverSceneStore } from '@/stores/scenes/river'
import { useCaveSceneStore } from '@/stores/scenes/cave'
import { useGrasslandSceneStore } from '@/stores/scenes/grassland'
import { useLakesideSceneStore } from '@/stores/scenes/lakeside'
import { useSeasideSceneStore } from '@/stores/scenes/seaside'
import { emitter, gameLog } from '@/utils/eventBus'
import GameDateTime from '@/components/game/GameDateTime.vue'
import GameLogPreview from '@/components/game/GameLogPreview.vue'
import PlayerStatus from '@/components/game/PlayerStatus.vue'
import PlayerMenuModal from '@/components/game/PlayerMenuModal.vue'
import OperationArea from '@/components/game/OperationArea.vue'
import ScenePanel from '@/components/game/ScenePanel.vue'

const timeStore = useTimeStore()
const characterStore = useCharacterStore()
const scenesStore = useScenesStore()
const baseStore = useBaseSceneStore()
const forestStore = useForestSceneStore()
const riverStore = useRiverSceneStore()
const caveStore = useCaveSceneStore()
const grasslandStore = useGrasslandSceneStore()
const lakesideStore = useLakesideSceneStore()
const seasideStore = useSeasideSceneStore()

// 组合已解锁场景信息
const scenesList = computed(() => {
  const allScenes = [
    { id: baseStore.scene.id, name: baseStore.scene.name },
    { id: forestStore.scene.id, name: forestStore.scene.name },
    { id: grasslandStore.scene.id, name: grasslandStore.scene.name },
    { id: riverStore.scene.id, name: riverStore.scene.name },
    { id: lakesideStore.scene.id, name: lakesideStore.scene.name },
    { id: caveStore.scene.id, name: caveStore.scene.name },
    { id: seasideStore.scene.id, name: seasideStore.scene.name }
  ];
  return allScenes.filter(scene => scenesStore.unlockedScenes.includes(scene.id));
});

const showMenu = ref(false)

// 监听天气栏点击事件 → 暂停游戏并弹出菜单
const onOpenGameMenu = () => {
  timeStore.pauseGame()
  showMenu.value = true
}

// 监听自动暂停事件 → 弹出菜单
const onAutoPaused = () => { showMenu.value = true }

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

  // 监听菜单相关事件
  emitter.on('open-game-menu', onOpenGameMenu)
  emitter.on('game-auto-paused', onAutoPaused)

  // 启动无操作监听
  inactivityEvents.forEach(ev => window.addEventListener(ev, resetInactivityTimer, { passive: true }))
  resetInactivityTimer()
})

// 当离开游戏页面时停止时间系统
onUnmounted(() => {
  timeStore.stopTime()

  // 清除 hour-passed 事件监听
  emitter.off('hour-passed', onHourPassed)

  // 清除菜单相关事件监听
  emitter.off('open-game-menu', onOpenGameMenu)
  emitter.off('game-auto-paused', onAutoPaused)

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
