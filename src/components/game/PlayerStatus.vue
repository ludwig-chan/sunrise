<template>
  <div class="player-status translucent-white">
    <div class="basic-info" @click="handleInfoClick">
      <div class="avatar" :style="temperatureBorderStyle" @click.stop="handleAvatarClick">👤</div>
      <div class="info-text">
        <div class="info-item name">{{ character.name }}</div>
        <div class="info-item equip-icons" v-if="mainHandIcon">
          <span>{{ mainHandIcon }}</span>
        </div>
      </div>
    </div>
    <div class="stats-container" @click="handleStatsClick">
      <div class="main-stats">
        <div class="status-item">
          <StatusIcon type="health" style="color: rgb(220, 53, 69)" />
          <ProgressBar :value="character.health" color="rgb(220, 53, 69)" statusMode />
        </div>
        <div class="status-item">
          <StatusIcon type="energy" style="color: rgb(0, 123, 255)" />
          <ProgressBar :value="character.energy" color="rgb(0, 123, 255)" statusMode />
        </div>
        <div class="status-item">
          <StatusIcon type="satiety" style="color: rgb(255, 152, 0)" />
          <ProgressBar :value="character.satiety" color="rgb(255, 152, 0)" statusMode />
        </div>
        <div class="status-item">
          <StatusIcon type="mood" style="color: rgb(147, 112, 219)" />
          <ProgressBar :value="character.mood" color="rgb(147, 112, 219)" statusMode />
        </div>
        <div class="status-item">
          <StatusIcon type="hygiene" style="color: rgb(32, 178, 170)" />
          <ProgressBar :value="character.hygiene" color="rgb(32, 178, 170)" statusMode />
        </div>
        <div class="status-item">
          <StatusIcon type="mana" style="color: rgb(138, 43, 226)" />
          <ProgressBar :value="character.mana" color="rgb(138, 43, 226)" statusMode />
        </div>
        <div class="status-item temperature-item">
          <span class="temperature-icon">🌡️</span>
          <span class="temperature-value" :class="temperatureClass">{{ temperatureDisplay }}</span>
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

const temperatureDisplay = computed(() => {
  const temp = character.temperature ?? 37
  return `${temp.toFixed(1)}°C`
})

const temperatureClass = computed(() => {
  const temp = character.temperature ?? 37
  if (temp < 33) return 'temp-freezing'
  if (temp < 35) return 'temp-cold'
  if (temp > 38.5) return 'temp-fever'
  if (temp > 38) return 'temp-warm'
  return 'temp-normal'
})

const temperatureBorderStyle = computed(() => {
  const temp = character.temperature ?? 37
  let color: string
  let animation = ''
  if (temp < 33) {
    color = '#4299e1'
    animation = 'pulse-cold 1.5s ease-in-out infinite'
  } else if (temp < 35) {
    color = '#63b3ed'
  } else if (temp > 38.5) {
    color = '#e53e3e'
    animation = 'pulse-hot 1.5s ease-in-out infinite'
  } else if (temp > 38) {
    color = '#ed8936'
  } else {
    color = '#48bb78'
  }
  return {
    border: `3px solid ${color}`,
    animation: animation || undefined,
    boxShadow: `0 0 6px ${color}40`
  }
})

const handleInfoClick = () => {
  router.push('/character/profile')
}

const handleAvatarClick = () => {
  router.push('/character/equipment')
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.3rem 0.8rem;
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

.avatar {
  font-size: 2rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  transition: background 0.15s;
}

.avatar:hover {
  background: rgba(0, 0, 0, 0.15);
}

.info-text {
  display: flex;
  flex-direction: column;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.status-item :deep(.progress-bar) {
  flex-grow: 1;
}

.temperature-item {
  grid-column: 1 / -1;
  gap: 0.3rem;
  justify-content: center;
}

.temperature-icon {
  font-size: 0.85rem;
  flex-shrink: 0;
}

.temperature-value {
  font-size: 0.78rem;
  font-weight: 600;
}

.temp-normal { color: #48bb78; }
.temp-warm { color: #ed8936; }
.temp-cold { color: #63b3ed; }
.temp-freezing { color: #4299e1; font-weight: bold; }
.temp-fever { color: #e53e3e; font-weight: bold; }

@keyframes pulse-cold {
  0%, 100% { box-shadow: 0 0 6px #4299e140; }
  50% { box-shadow: 0 0 14px #4299e1aa; }
}

@keyframes pulse-hot {
  0%, 100% { box-shadow: 0 0 6px #e53e3e40; }
  50% { box-shadow: 0 0 14px #e53e3eaa; }
}
</style>
