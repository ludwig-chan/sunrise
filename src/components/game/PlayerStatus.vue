<template>
  <div class="player-status translucent-white" @click="goToCharacterView">
    <div class="avatar-section">
      <div class="avatar">
        <div class="avatar-placeholder">
          <span class="emoji">{{ character.avatar }}</span>
        </div>
      </div>
    </div>
    <div class="basic-info">
      <div class="info-item name">{{ character.name }}</div>
      <div class="info-item">{{ character.age }}岁 · {{ character.gender === 'male' ? '♂' : '♀' }}</div>
    </div>
    <div class="stats-container">
      <div class="main-stats">
        <div class="status-item">
          <ProgressBar :value="character.health" label="❤️" color="rgb(220, 53, 69)" />
        </div>
        <div class="status-item">
          <ProgressBar :value="character.energy" label="💪" color="rgb(0, 123, 255)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCharacterStore } from '../../stores/character'
import ProgressBar from '../common/ProgressBar.vue'
import { emitter } from '../../utils/eventBus'
import { onMounted, onUnmounted } from 'vue'

const router = useRouter()
const character = useCharacterStore()

const goToCharacterView = () => {
  router.push('/character')
}

// 监听每小时事件
onMounted(() => {
  emitter.on('hour-passed', () => {
    character.hourlyUpdate()
  })
})

onUnmounted(() => {
  emitter.off('hour-passed')
})
</script>

<style scoped>
.player-status {
  padding: 0.6rem;  /* 减小内边距 */
  border-radius: 6px;
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 1rem;  /* 减小间距 */
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.stats-container {
  display: flex;
  align-items: center;
}

.main-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;  /* 减小状态条之间的间距 */
  flex-grow: 1;
  padding: 0.3rem;  /* 减小内边距 */
}

.avatar-section, .basic-info {
  cursor: default;
}

.health-bar {
  display: flex;
  align-items: center;
}

.avatar-section {
  flex-shrink: 0;
}

.basic-info {
  font-size: 0.85rem;  /* 稍微减小字体 */
  color: #666;
  padding: 0 0.3rem;  /* 减小内边距 */
}

.info-item.name {
  font-size: 1rem;  /* 减小名字字体 */
  font-weight: bold;
  color: #333;
  margin-bottom: 0.1rem;  /* 减小间距 */
}

.info-item {
  white-space: nowrap;
}

.avatar {
  width: 50px;  /* 减小头像尺寸 */
  height: 50px;  /* 减小头像尺寸 */
  border-radius: 50%;
  overflow: hidden;
  background-color: #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji {
  font-size: 28px;  /* 减小表情符号大小 */
  line-height: 1;
}
</style>
