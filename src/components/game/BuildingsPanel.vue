<template>
  <section class="buildings-panel translucent-white">
    <div class="buildings-list" v-if="buildings && buildings.length > 0">
      <div v-for="building in buildings" :key="building.type" class="building-item">
        <div class="building-info">
          <h3>{{ building.name }}</h3>
          <div class="building-level">等级: {{ building.level }}</div>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>暂无已建建筑</p>
      <p class="empty-hint">通过「建造」按钮建造新建筑</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { GameBuilding } from '../../stores/scenes/types';

defineProps<{
  buildings: GameBuilding[]
}>();
</script>

<style scoped>
.buildings-panel {
  border-radius: 8px;
  padding: 1rem;
  flex: 1;
}

.buildings-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.building-item {
  padding: 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.building-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.building-info h3 {
  margin: 0;
  font-size: 1rem;
}

.building-level {
  font-size: 0.9rem;
  color: #666;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #666;
}

.empty-hint {
  font-size: 0.9rem;
  color: #999;
  margin-top: 0.5rem;
}
</style>
