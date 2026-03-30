<template>
  <div class="background-layer" :class="backgroundClass">
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTimeStore } from '../../stores/time'

const timeStore = useTimeStore()

// 根据时间段计算背景样式（仅昼夜渐变，不含天气效果）
const backgroundClass = computed(() => {
  const period = timeStore.currentPeriod.toLowerCase()
  return {
    'period-dawn': period === 'dawn',
    'period-day': period === 'day',
    'period-dusk': period === 'dusk',
    'period-night': period === 'night',
  }
})
</script>

<style scoped>
.background-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  transition: all 1s ease-in-out;
}

/* 时段样式 */
.period-dawn {
  background: linear-gradient(to bottom, #ff7e5f, #feb47b);
}

.period-day {
  background: linear-gradient(to bottom, #4CA1AF, #C4E0E5);
}

.period-dusk {
  background: linear-gradient(to bottom, #FF512F, #F09819);
}

.period-night {
  background: linear-gradient(to bottom, #1a2a6c, #2a3c7c);
}

</style>
