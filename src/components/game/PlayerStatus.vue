<template>
  <div class="player-status translucent-white">
    <div class="avatar-section" @click="handleAvatarClick">
      <div class="avatar">
        <div class="avatar-placeholder">
          <span class="emoji">{{ character.avatar }}</span>
        </div>
      </div>
    </div>
    <div class="basic-info">
      <div class="info-item name">{{ character.name }}</div>
      <div class="info-item">{{ character.age }}岁 · {{ character.gender === 'male' ? '♂' : '♀' }}</div>
      <div class="info-item equip-icons" v-if="mainHandIcon || offHandIcon">
        <span v-if="mainHandIcon">{{ mainHandIcon }}</span>
        <span v-if="offHandIcon">{{ offHandIcon }}</span>
      </div>
    </div>
    <div class="stats-container">
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
  <PlayerMenuModal v-model="showMenu" @resume="timeStore.resumeGame()" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCharacterStore } from '../../stores/character'
import { useEquipmentStore } from '../../stores/equipment'
import { useTimeStore } from '../../stores/time'
import ProgressBar from '../common/ProgressBar.vue'
import PlayerMenuModal from './PlayerMenuModal.vue'
import StatusIcon from '../common/StatusIcon.vue'
import { emitter } from '../../utils/eventBus'
import { onMounted, onUnmounted, computed } from 'vue'

const character = useCharacterStore()
const equipment = useEquipmentStore()
const timeStore = useTimeStore()
const mainHandIcon = computed(() => equipment.mainHandIcon)
const offHandIcon = computed(() => equipment.offHandIcon)

const showMenu = ref(false)

const handleAvatarClick = () => {
  timeStore.pauseGame()
  showMenu.value = true
}

// 监听自动暂停事件
const onAutoPaused = () => { showMenu.value = true }

onMounted(() => {
  emitter.on('game-auto-paused', onAutoPaused)
})

onUnmounted(() => {
  emitter.off('game-auto-paused', onAutoPaused)
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

.avatar-section {
  cursor: pointer;
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

.info-item.equip-icons {
  font-size: 0.9rem;
  line-height: 1.2;
  letter-spacing: 0.1rem;
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

.status-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.status-item :deep(.progress-bar) {
  flex-grow: 1;
}
</style>
