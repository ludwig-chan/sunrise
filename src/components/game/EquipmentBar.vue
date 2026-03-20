<template>
  <div class="equipment-bar translucent-white">
    <div class="equipment-slot">
      <span class="slot-icon">🪓</span>
      <template v-if="equipment.axe.durability > 0">
        <span class="slot-name">石斧</span>
        <div class="slot-durability">
          <div
            class="durability-fill"
            :style="{ width: `${durabilityPercent}%`, backgroundColor: durabilityColor }"
          ></div>
        </div>
        <span class="slot-percent">{{ durabilityPercent }}%</span>
      </template>
      <span v-else class="slot-empty">-</span>
    </div>
    <div class="slot-divider"></div>
    <div class="equipment-slot">
      <span class="slot-icon">⛏</span>
      <span class="slot-empty">-</span>
    </div>
    <div class="slot-divider"></div>
    <div class="equipment-slot">
      <span class="slot-icon">🛡</span>
      <span class="slot-empty">-</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEquipmentStore } from '../../stores/equipment'

const equipment = useEquipmentStore()

const durabilityPercent = computed(() => {
  const dur = equipment.axe.durability
  return dur > 0 ? (dur % 100 || 100) : 0
})

const durabilityColor = computed(() => {
  const p = durabilityPercent.value
  if (p > 60) return 'rgba(76, 175, 80, 0.8)'
  if (p > 30) return 'rgba(255, 152, 0, 0.8)'
  return 'rgba(244, 67, 54, 0.8)'
})
</script>

<style scoped>
.equipment-bar {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
}

.equipment-slot {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex: 1;
  min-width: 0;
}

.slot-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.slot-name {
  color: #333;
  white-space: nowrap;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.slot-durability {
  flex: 1;
  height: 8px;
  background-color: #ddd;
  border-radius: 4px;
  overflow: hidden;
  min-width: 30px;
}

.durability-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.slot-percent {
  color: #666;
  font-size: 0.75rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.slot-empty {
  color: #aaa;
  font-size: 0.85rem;
}

.slot-divider {
  width: 1px;
  height: 1.2rem;
  background-color: rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}
</style>
