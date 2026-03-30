<template>
  <div
    class="game-date-time-wrapper"
    :class="[`period-${timeStore.currentPeriod.toLowerCase()}`, `weather-${timeStore.weather.toLowerCase()}`]"
  >
    <!-- Weather animation particles -->
    <template v-if="timeStore.weather === 'RAINY'">
      <span v-for="i in 10" :key="i" class="rain-drop" :style="rainStyle(i)" />
    </template>
    <template v-else-if="timeStore.weather === 'SNOWY'">
      <span v-for="i in 8" :key="i" class="snow-flake" :style="snowStyle(i)" />
    </template>
    <template v-else-if="timeStore.weather === 'WINDY'">
      <span v-for="i in 6" :key="i" class="wind-line" :style="windStyle(i)" />
    </template>
    <template v-else-if="timeStore.weather === 'HAIL'">
      <span v-for="i in 10" :key="i" class="hail-drop" :style="hailStyle(i)" />
    </template>
    <div v-else-if="timeStore.weather === 'SANDSTORM'" class="sandstorm-overlay" />
    <div v-else-if="timeStore.weather === 'HAZE'" class="haze-overlay" />

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
      </span>

      <span class="weather-text">
        {{weatherNames[timeStore.weather]}}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTimeStore } from '../../stores/time'
import { seasonNames, weatherNames, periodNames } from '../../utils/textMapping'

const timeStore = useTimeStore()

function rainStyle(i: number): Record<string, string> {
  const left = ((i * 37 + 11) % 100)
  const delay = ((i * 0.17) % 1.2).toFixed(2)
  const duration = (0.6 + (i % 5) * 0.1).toFixed(2)
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  }
}

function snowStyle(i: number): Record<string, string> {
  const left = ((i * 43 + 7) % 100)
  const delay = ((i * 0.3) % 3).toFixed(2)
  const duration = (2.5 + (i % 4) * 0.5).toFixed(2)
  const size = (3 + (i % 3)).toFixed(0)
  return {
    left: `${left}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  }
}

function windStyle(i: number): Record<string, string> {
  const top = ((i * 31 + 5) % 90)
  const delay = ((i * 0.2) % 1.5).toFixed(2)
  const width = (20 + (i % 5) * 8).toFixed(0)
  const duration = (0.8 + (i % 4) * 0.15).toFixed(2)
  return {
    top: `${top}%`,
    width: `${width}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  }
}

function hailStyle(i: number): Record<string, string> {
  const left = ((i * 41 + 13) % 100)
  const delay = ((i * 0.12) % 0.9).toFixed(2)
  const duration = (0.35 + (i % 4) * 0.05).toFixed(2)
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  }
}
</script>

<style scoped>
/* ---- Wrapper with period gradient and weather filter ---- */
.game-date-time-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
  width: 100%;
  background: linear-gradient(to bottom, #4CA1AF, #C4E0E5);
  transition: all 1s ease-in-out;
}

.game-date-time-wrapper.period-dawn  { background: linear-gradient(to bottom, #ff7e5f, #feb47b); }
.game-date-time-wrapper.period-day   { background: linear-gradient(to bottom, #4CA1AF, #C4E0E5); }
.game-date-time-wrapper.period-dusk  { background: linear-gradient(to bottom, #FF512F, #F09819); }
.game-date-time-wrapper.period-night { background: linear-gradient(to bottom, #1a2a6c, #2a3c7c); }

.game-date-time-wrapper.weather-rainy     { filter: brightness(0.8) saturate(0.8); }
.game-date-time-wrapper.weather-windy     { filter: contrast(1.1) brightness(1.1); }
.game-date-time-wrapper.weather-snowy     { filter: brightness(1.2) contrast(0.9); }
.game-date-time-wrapper.weather-hail      { filter: brightness(0.7) contrast(1.2); }
.game-date-time-wrapper.weather-sandstorm { filter: sepia(0.5) brightness(0.9); }
.game-date-time-wrapper.weather-haze      { filter: blur(1px) brightness(0.9); }

/* ---- Rain ---- */
.rain-drop {
  position: absolute;
  top: -10px;
  width: 2px;
  height: 10px;
  background: rgba(180, 210, 255, 0.7);
  border-radius: 1px;
  animation: rain-fall linear infinite;
}
@keyframes rain-fall {
  from { transform: translateY(-10px); opacity: 0.8; }
  to   { transform: translateY(calc(100% + 50px)); opacity: 0.3; }
}

/* ---- Snow ---- */
.snow-flake {
  position: absolute;
  top: -10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  animation: snow-fall linear infinite;
}
@keyframes snow-fall {
  from { transform: translateY(-10px) translateX(0); opacity: 0.9; }
  50%  { transform: translateY(50%) translateX(6px); }
  to   { transform: translateY(calc(100% + 20px)) translateX(-4px); opacity: 0.4; }
}

/* ---- Wind ---- */
.wind-line {
  position: absolute;
  left: -60px;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.55), transparent);
  animation: wind-blow linear infinite;
}
@keyframes wind-blow {
  from { transform: translateX(-10px); opacity: 0.7; }
  to   { transform: translateX(calc(100vw + 80px)); opacity: 0; }
}

/* ---- Hail ---- */
.hail-drop {
  position: absolute;
  top: -8px;
  width: 4px;
  height: 6px;
  background: rgba(210, 235, 255, 0.85);
  border-radius: 1px;
  animation: hail-fall linear infinite;
}
@keyframes hail-fall {
  from { transform: translateY(-8px) translateX(0); opacity: 0.9; }
  to   { transform: translateY(calc(100% + 30px)) translateX(8px); opacity: 0.4; }
}

/* ---- Sandstorm overlay ---- */
.sandstorm-overlay {
  position: absolute;
  inset: 0;
  background: rgba(180, 140, 60, 0.35);
  backdrop-filter: blur(1.5px);
}

/* ---- Haze overlay ---- */
.haze-overlay {
  position: absolute;
  inset: 0;
  background: rgba(180, 180, 180, 0.30);
  backdrop-filter: blur(1px);
}

/* ---- Content ---- */
.game-date-time {
  position: relative;
  z-index: 1;
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
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

.year, .season {
  font-size: 0.85rem;
  opacity: 0.85;
}

.date-separator, .time-separator {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
  margin: 0 0.1rem;
}
</style>
