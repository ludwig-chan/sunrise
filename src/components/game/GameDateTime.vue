<template>
  <BlockWrapper>
    <div class="game-date-time">
      <span class="date-group">
        <span class="date-item year">第{{timeStore.year}}年</span>
        <span class="date-separator">·</span>
        <span class="date-item season">{{seasonNames[timeStore.season]}}</span>
        <span class="date-separator">·</span>
        <span class="date-item">{{timeStore.day}}日</span>
      </span>
      
      <span class="time-group">
        <span class="time-item">{{timeStore.hour}}时</span>
        <span class="time-separator">/</span>
        <span class="time-item">{{periodNames[timeStore.currentPeriod]}}</span>
        <span v-if="timeStore.paused" class="paused-badge">[已暂停]</span>
      </span>

      <span class="weather-text">
        {{weatherNames[timeStore.weather]}}
      </span>
    </div>
  </BlockWrapper>
</template>

<script setup lang="ts">
import { useTimeStore } from '../../stores/time'
import BlockWrapper from '../common/BlockWrapper.vue'
import { seasonNames, weatherNames, periodNames } from '../../utils/textMapping'

const timeStore = useTimeStore()
</script>

<style scoped>
.game-date-time {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0.5rem;
}

.date-group, .time-group {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.date-item, .time-item, .weather-text {
  font-size: 1rem;
  color: #486491;
}

.year, .season {
  font-size: 0.85rem;
  opacity: 0.85;
}

.date-separator, .time-separator {
  color: #666;
  font-weight: 300;
  margin: 0 0.1rem;
}

.paused-badge {
  font-size: 0.78rem;
  color: #e53e3e;
  margin-left: 0.25rem;
  font-weight: 600;
}
</style>
