<template>
  <main class="game-container">
    <header class="header">
      <GameDateTime />
      <PlayerStatus />
      <EquipmentBar />
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
import { onMounted, onUnmounted, computed } from 'vue'
import { useTimeStore } from '@/stores/time'
import { useScenesStore } from '@/stores/scenes'
import { useBaseSceneStore } from '@/stores/scenes/base'
import { useForestSceneStore } from '@/stores/scenes/forest'
import GameDateTime from '@/components/game/GameDateTime.vue'
import PlayerStatus from '@/components/game/PlayerStatus.vue'
import OperationArea from '@/components/game/OperationArea.vue'
import EquipmentBar from '@/components/game/EquipmentBar.vue'
import ScenePanel from '@/components/game/ScenePanel.vue'

const timeStore = useTimeStore()
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

// 当进入游戏页面时启动时间系统
onMounted(() => {
  timeStore.startTime()
})

// 当离开游戏页面时停止时间系统
onUnmounted(() => {
  timeStore.stopTime()
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
