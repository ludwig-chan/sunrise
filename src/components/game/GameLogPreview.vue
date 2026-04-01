<template>
  <div class="log-preview" @click="router.push('/logs')">
    <!-- Log entries：最新在最下面，越往上越透明 -->
    <div class="log-content">
      <div v-if="displayEntries.length === 0" class="log-placeholder">暂无记录</div>
      <div
        v-for="(entry, index) in displayEntries"
        :key="entry.timestamp"
        class="log-entry"
        :class="`type-${entry.type.toLowerCase()}`"
        :style="{ opacity: entryOpacity(index, displayEntries.length) }"
      >
        【{{ entry.gameTimestamp % 24 }}时】{{ entry.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameLogStore } from '@/stores/gameLog'
import type { GameLogEntry } from '@/stores/gameLog'

const router = useRouter()
const gameLogStore = useGameLogStore()

// 最多显示6条，按时间从旧到新排列（最新在最下面）
const MAX_ENTRIES = 6
// 透明度范围：最旧条目 = MIN_OPACITY，最新条目 = 1.0
const MIN_OPACITY = 0.2
const OPACITY_RANGE = 1 - MIN_OPACITY

const displayEntries = computed<GameLogEntry[]>(() => {
  const entries = gameLogStore.entries
  if (entries.length === 0) return []

  // 取最新的 MAX_ENTRIES 条，然后按时间正序排列（旧在上，新在下）
  return entries
    .slice(-MAX_ENTRIES)
    .sort((a, b) => a.timestamp - b.timestamp)
})

// 透明度：最上面（旧）= MIN_OPACITY，最下面（新）= 1.0，线性插值
function entryOpacity(index: number, total: number): number {
  if (total <= 1) return 1
  return MIN_OPACITY + OPACITY_RANGE * index / (total - 1)
}
</script>

<style scoped>
/* ---- Container ---- */
.log-preview {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  transition: box-shadow 0.2s ease, opacity 0.2s ease;
  height: calc(6 * 1.5 * 0.8rem + 1.2rem);
  min-height: calc(6 * 1.5 * 0.8rem + 1.2rem);
  max-height: calc(6 * 1.5 * 0.8rem + 1.2rem);
}

.log-preview:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 0.92;
}

/* ---- Log content ---- */
.log-content {
  position: relative;
  z-index: 1;
}

.log-placeholder {
  color: rgba(0, 0, 0, 0.55);
  font-size: 0.8rem;
}

.log-entry {
  font-size: 0.8rem;
  line-height: 1.5;
  color: #486491;
  transition: opacity 0.3s ease;
}

.log-entry.type-system {
  color: #486491;
}

.log-entry.type-action,
.log-entry.type-item {
  color: #333;
}

.log-entry.type-combat {
  color: #c0392b;
}
</style>
