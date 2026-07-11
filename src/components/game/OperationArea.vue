<template>
  <div class="operation-area">
    <InventoryPanel />
    <EnvironmentCard />
    <div class="panels-container">
      <BuildingsPanel :buildings="scenesStore.currentScene.buildings" />
      <ActionsPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import ActionsPanel from './ActionsPanel.vue';
import BuildingsPanel from './BuildingsPanel.vue';
import InventoryPanel from './InventoryPanel.vue';
import EnvironmentCard from './EnvironmentCard.vue';
import { useScenesStore } from "../../stores/scenes";

const scenesStore = useScenesStore();
</script>

<style scoped>
.operation-area {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 1rem;
}

/* 背包栏：固定高度，不再撑满剩余高度 */
:deep(.inventory-panel) {
  flex: 0 0 auto;
}

.panels-container {
  flex: 0 0 auto;
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
