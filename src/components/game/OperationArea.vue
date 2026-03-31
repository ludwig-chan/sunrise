<template>
  <div class="operation-area">
    <InventoryPanel />
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

/* 让背包栏撑满剩余高度 */
:deep(.inventory-panel) {
  flex: 1;
  min-height: 0;
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
