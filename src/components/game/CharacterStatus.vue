<template>
  <div class="character-status">
    <h2>状态详情</h2>
    <div class="status-grid">
      <div class="status-item">
        <label><StatusIcon type="health" style="color: rgb(220, 53, 69)" /></label>
        <span class="status-label">血量</span>
        <ProgressBar :value="character.health" color="rgb(220, 53, 69)" />
        <span>{{ character.health }}%</span>
      </div>
      <div class="status-item">
        <label><StatusIcon type="energy" style="color: rgb(0, 123, 255)" /></label>
        <span class="status-label">体力</span>
        <ProgressBar :value="character.energy" color="rgb(0, 123, 255)" />
        <span>{{ character.energy }}%</span>
      </div>
      <div class="status-item">
        <label><StatusIcon type="satiety" style="color: rgb(255, 153, 0)" /></label>
        <span class="status-label">饱食度</span>
        <ProgressBar :value="character.satiety" color="rgb(255, 153, 0)" />
        <span>{{ character.satiety }}%</span>
      </div>
      <div class="status-item">
        <label><StatusIcon type="mood" style="color: rgb(147, 112, 219)" /></label>
        <span class="status-label">心情</span>
        <ProgressBar :value="character.mood" color="rgb(147, 112, 219)" />
        <span>{{ character.mood }}%</span>
      </div>
      <div class="status-item">
        <label><StatusIcon type="hygiene" style="color: rgb(32, 178, 170)" /></label>
        <span class="status-label">卫生</span>
        <ProgressBar :value="character.hygiene" color="rgb(32, 178, 170)" />
        <span>{{ character.hygiene }}%</span>
      </div>
      <div class="status-item">
        <label><StatusIcon type="mana" style="color: rgb(138, 43, 226)" /></label>
        <span class="status-label">魔法值</span>
        <ProgressBar :value="character.mana" color="rgb(138, 43, 226)" />
        <span>{{ character.mana }}%</span>
      </div>
      <!-- 体温条 -->
      <div class="status-item temperature-bar-item">
        <label>🌡️</label>
        <span class="status-label">体温</span>
        <div class="temperature-bar-container">
          <div class="temperature-bar-track">
            <div class="temperature-bar-center-line"></div>
            <div
              class="temperature-bar-indicator"
              :style="temperatureIndicatorStyle"
            ></div>
          </div>
          <div class="temperature-bar-labels">
            <span class="temp-label-left">冷</span>
            <span class="temp-label-center">37°C</span>
            <span class="temp-label-right">热</span>
          </div>
        </div>
        <span class="temperature-value-text" :class="temperatureClass">{{ temperatureDisplay }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProgressBar from '../common/ProgressBar.vue'
import { useCharacterStore } from '../../stores/character'
import StatusIcon from '../common/StatusIcon.vue'

const character = useCharacterStore()

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

const temperatureIndicatorStyle = computed(() => {
  const temp = character.temperature ?? 37
  // range: 28°C (left) to 42°C (right), center at 37°C
  let offsetPercent: number
  if (temp >= 37) {
    offsetPercent = ((temp - 37) / (42 - 37)) * 50
  } else {
    offsetPercent = -((37 - temp) / (37 - 28)) * 50
  }
  // Clamp to -50% to +50%
  offsetPercent = Math.max(-50, Math.min(50, offsetPercent))

  let color: string
  if (temp < 33) color = '#4299e1'
  else if (temp < 35) color = '#63b3ed'
  else if (temp > 38.5) color = '#e53e3e'
  else if (temp > 38) color = '#ed8936'
  else color = '#48bb78'

  return {
    left: `calc(50% + ${offsetPercent}% - 6px)`,
    background: color,
    boxShadow: `0 0 6px ${color}`
  }
})
</script>

<style scoped>
.character-status {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #444;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-item label {
  min-width: 30px;
  font-size: 1.2rem;
  display: flex;
  justify-content: center;
}

.status-item :deep(.progress-bar) {
  flex-grow: 1;
}

.status-item span {
  min-width: 45px;
  text-align: right;
  color: #666;
}

.status-label {
  min-width: 44px;
  font-size: 0.8rem;
  color: #555;
}

.temperature-bar-item {
  grid-column: 1 / -1;
}

.temperature-bar-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.temperature-bar-track {
  position: relative;
  height: 8px;
  background: linear-gradient(90deg, #4299e1, #63b3ed 35%, #48bb78 50%, #ed8936 65%, #e53e3e);
  border-radius: 4px;
  overflow: visible;
}

.temperature-bar-center-line {
  position: absolute;
  left: 50%;
  top: -2px;
  bottom: -2px;
  width: 2px;
  background: rgba(0,0,0,0.3);
  transform: translateX(-50%);
  border-radius: 1px;
}

.temperature-bar-indicator {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transform: translateY(-50%);
  transition: left 0.5s ease, background 0.5s ease;
  border: 2px solid white;
  z-index: 1;
}

.temperature-bar-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: #999;
  position: relative;
}

.temp-label-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.temperature-value-text {
  min-width: 55px;
  text-align: right;
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
}

.temp-normal { color: #48bb78 !important; }
.temp-warm { color: #ed8936 !important; }
.temp-cold { color: #63b3ed !important; }
.temp-freezing { color: #4299e1 !important; font-weight: bold; }
.temp-fever { color: #e53e3e !important; font-weight: bold; }
</style>
