<template>
  <section class="buildings-panel translucent-white">

    <!-- 建筑卡片网格 -->
    <div class="buildings-grid">
      <!-- 已建建筑卡片 -->
      <div
        v-for="building in buildings"
        :key="building.type"
        class="building-card"
        role="button"
        tabindex="0"
        @click="openBuildingModal(building)"
        @keydown.enter="openBuildingModal(building)"
      >
        <span class="building-card-icon">{{ building.icon || '🏗️' }}</span>
        <div class="building-card-info">
          <span class="building-card-name">{{ building.name }}</span>
          <span class="building-card-level">Lv.{{ building.level }}</span>
        </div>
      </div>

      <!-- 无建筑时的占位提示 -->
      <div v-if="buildings.length === 0" class="no-buildings">
        暂无建筑
      </div>
    </div>

    <!-- 建筑详情弹窗 -->
    <BuildingModal
      v-if="selectedBuilding"
      :building="selectedBuilding"
      :open="!!selectedBuilding"
      @close="selectedBuilding = null"
    />

  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BuildingModal from './BuildingModal.vue';
import type { GameBuilding } from '../../stores/scenes/types';

defineProps<{
  buildings: GameBuilding[]
}>();

const selectedBuilding = ref<GameBuilding | null>(null);

function openBuildingModal(building: GameBuilding) {
  selectedBuilding.value = building;
}
</script>

<style scoped>
.buildings-panel {
  border-radius: 8px;
  padding: 0.75rem;
  flex: 1;
}

.buildings-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.building-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  width: 68px;
  min-height: 72px;
  padding: 0.4rem 0.3rem;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  text-align: center;
}

.building-card:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-1px);
}

.building-card:active {
  transform: translateY(0);
}

.building-card-icon {
  font-size: 1.4rem;
  line-height: 1;
}

.building-card-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.05rem;
}

.building-card-name {
  font-size: 0.7rem;
  color: #2d3748;
  font-weight: 600;
  line-height: 1.2;
}

.building-card-level {
  font-size: 0.62rem;
  color: #718096;
}

.no-buildings {
  font-size: 0.78rem;
  color: #a0aec0;
  padding: 0.5rem 0.25rem;
}
</style>

