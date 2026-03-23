<template>
  <div class="operation-area">
    <div class="panels-container">
      <BuildingsPanel :buildings="scenesStore.currentScene.buildings" />
      <ActionsPanel :actions="scenesStore.currentActions" />
    </div>
    <ScenePanel v-model="scenesStore.currentSceneId" :scenes="scenesList" />
  </div>
</template>

<script setup lang="ts">
import ActionsPanel from './ActionsPanel.vue';
import BuildingsPanel from './BuildingsPanel.vue';
import ScenePanel from './ScenePanel.vue';
import { useScenesStore } from "../../stores/scenes";
import { useBaseSceneStore } from "../../stores/scenes/base";
import { useForestSceneStore } from "../../stores/scenes/forest";
import { computed } from 'vue';

const scenesStore = useScenesStore();
const baseStore = useBaseSceneStore();
const forestStore = useForestSceneStore();

// 组合已解锁场景信息
const scenesList = computed(() => {
  const allScenes = [
    { id: baseStore.scene.id, name: baseStore.scene.name },
    { id: forestStore.scene.id, name: forestStore.scene.name }
  ];
  return allScenes.filter(scene => scenesStore.unlockedScenes.includes(scene.id));
});
</script>

<style scoped>
.operation-area {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 1rem;
}

.panels-container {
  display: flex;
  gap: 1rem;
  width: 100%;
}

:deep(.buildings-panel) {
  flex: 1;
}

:deep(.actions-panel) {
  flex: 1;
}
</style>
