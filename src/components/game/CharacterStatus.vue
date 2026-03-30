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
    </div>
  </div>
</template>

<script setup lang="ts">
import ProgressBar from '../common/ProgressBar.vue'
import { useCharacterStore } from '../../stores/character'
import StatusIcon from '../common/StatusIcon.vue'

const character = useCharacterStore()
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
</style>
