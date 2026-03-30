<template>
  <div class="player-status translucent-white">
    <div class="basic-info" @click="handleInfoClick">
      <div class="info-item name">{{ character.name }}</div>
      <div class="info-item">{{ character.age }}岁 · {{ character.gender === 'male' ? '♂' : '♀' }}</div>
      <div class="info-item equip-icons" v-if="mainHandIcon">
        <span>{{ mainHandIcon }}</span>
      </div>
    </div>
    <div class="stats-container" @click="handleStatsClick">
      <div class="main-stats">
        <div class="status-item">
          <StatusIcon type="health" style="color: rgb(220, 53, 69)" />
          <ProgressBar :value="character.health" color="rgb(220, 53, 69)" />
        </div>
        <div class="status-item">
          <StatusIcon type="energy" style="color: rgb(0, 123, 255)" />
          <ProgressBar :value="character.energy" color="rgb(0, 123, 255)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCharacterStore } from '../../stores/character'
import { useEquipmentStore } from '../../stores/equipment'
import { useRouter } from 'vue-router'
import ProgressBar from '../common/ProgressBar.vue'
import StatusIcon from '../common/StatusIcon.vue'
import { computed } from 'vue'

const character = useCharacterStore()
const equipment = useEquipmentStore()
const router = useRouter()
const mainHandIcon = computed(() => equipment.mainHandIcon)

const handleInfoClick = () => {
  router.push('/character/profile')
}

const handleStatsClick = () => {
  router.push('/character/status')
}
</script>

<style scoped>
.player-status {
  padding: 0.6rem;
  border-radius: 6px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: center;
}

.basic-info {
  cursor: pointer;
  font-size: 0.85rem;
  color: #666;
  padding: 0.3rem;
  border-radius: 4px;
  transition: background 0.15s;
}

.basic-info:hover {
  background: rgba(0, 0, 0, 0.05);
}

.stats-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  border-radius: 4px;
  padding: 0.2rem;
  transition: background 0.15s;
}

.stats-container:hover {
  background: rgba(0, 0, 0, 0.05);
}

.main-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-grow: 1;
  padding: 0.3rem;
}

.info-item.name {
  font-size: 1rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.1rem;
}

.info-item {
  white-space: nowrap;
}

.info-item.equip-icons {
  font-size: 0.9rem;
  line-height: 1.2;
  letter-spacing: 0.1rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.status-item :deep(.progress-bar) {
  flex-grow: 1;
}
</style>
