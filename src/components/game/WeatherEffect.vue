<template>
  <div class="weather-overlay" :class="{ visible: visible }">
    <template v-if="weather === 'RAINY'">
      <span
        v-for="i in 30"
        :key="'rain-' + i"
        class="particle rain-drop"
        :style="rainStyle(i)"
      ></span>
    </template>
    <template v-else-if="weather === 'SNOWY'">
      <span
        v-for="i in 20"
        :key="'snow-' + i"
        class="particle snow-flake"
        :style="snowStyle(i)"
      ></span>
    </template>
    <template v-else-if="weather === 'WINDY'">
      <span
        v-for="i in 15"
        :key="'wind-' + i"
        class="particle wind-line"
        :style="windStyle(i)"
      ></span>
    </template>
    <template v-else-if="weather === 'HAIL'">
      <span
        v-for="i in 25"
        :key="'hail-' + i"
        class="particle hail-drop"
        :style="hailStyle(i)"
      ></span>
    </template>
    <template v-else-if="weather === 'SANDSTORM'">
      <span
        v-for="i in 20"
        :key="'sand-' + i"
        class="particle sand-line"
        :style="sandStyle(i)"
      ></span>
    </template>
    <template v-else-if="weather === 'HAZE'">
      <div class="haze-overlay"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { emitter } from '../../utils/eventBus'

const weather = ref<string | null>(null)
const visible = ref(false)
let hideTimer: number | null = null

function showEffect(newWeather: string) {
  if (newWeather === 'SUNNY') {
    visible.value = false
    weather.value = null
    return
  }
  weather.value = newWeather
  visible.value = true
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = window.setTimeout(() => {
    visible.value = false
  }, 4000)
}

emitter.on('weather-changed', (w: string) => {
  showEffect(w)
})

onUnmounted(() => {
  if (hideTimer) clearTimeout(hideTimer)
})

function randBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function rainStyle(i: number) {
  const left = ((i - 1) / 30) * 100 + randBetween(-1, 1)
  const delay = randBetween(0, 1.5)
  const duration = randBetween(0.6, 1.2)
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

function snowStyle(i: number) {
  const left = ((i - 1) / 20) * 100 + randBetween(-2, 2)
  const delay = randBetween(0, 3)
  const duration = randBetween(3, 6)
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

function windStyle(i: number) {
  const top = ((i - 1) / 15) * 100 + randBetween(-3, 3)
  const delay = randBetween(0, 2)
  const duration = randBetween(0.8, 1.5)
  return {
    top: `${top}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

function hailStyle(i: number) {
  const left = ((i - 1) / 25) * 100 + randBetween(-1, 1)
  const delay = randBetween(0, 0.8)
  const duration = randBetween(0.3, 0.6)
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

function sandStyle(i: number) {
  const top = ((i - 1) / 20) * 100 + randBetween(-3, 3)
  const delay = randBetween(0, 1.5)
  const duration = randBetween(0.5, 1)
  return {
    top: `${top}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}
</script>

<style scoped>
.weather-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.weather-overlay.visible {
  opacity: 1;
}

/* Rain */
.rain-drop {
  position: absolute;
  top: -10px;
  width: 2px;
  height: 20px;
  background: rgba(100, 160, 240, 0.7);
  border-radius: 1px;
  animation: rain-fall linear infinite;
}

@keyframes rain-fall {
  to { transform: translateY(110vh); }
}

/* Snow */
.snow-flake {
  position: absolute;
  top: -10px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  animation: snow-fall linear infinite;
}

@keyframes snow-fall {
  to { transform: translateY(110vh) translateX(20px); }
}

/* Wind */
.wind-line {
  position: absolute;
  left: -60px;
  width: 50px;
  height: 2px;
  background: rgba(200, 230, 255, 0.6);
  border-radius: 1px;
  animation: wind-blow linear infinite;
}

@keyframes wind-blow {
  to { transform: translateX(110vw); }
}

/* Hail */
.hail-drop {
  position: absolute;
  top: -8px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(220, 235, 255, 0.9);
  animation: hail-fall linear infinite;
}

@keyframes hail-fall {
  to { transform: translateY(110vh); }
}

/* Sandstorm */
.sand-line {
  position: absolute;
  left: -80px;
  width: 70px;
  height: 3px;
  background: rgba(210, 160, 60, 0.6);
  border-radius: 2px;
  animation: sand-blow linear infinite;
}

@keyframes sand-blow {
  to { transform: translateX(110vw); }
}

/* Haze */
.haze-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.25);
}
</style>
