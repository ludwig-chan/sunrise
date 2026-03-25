<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">

    <!-- health: 爱心 -->
    <template v-if="type === 'health'">
      <path
        d="M8 13.5 C8 13.5 1.5 9 1.5 5.2 C1.5 3.2 3.1 1.5 5.2 1.5 C6.3 1.5 7.3 2 8 2.9 C8.7 2 9.7 1.5 10.8 1.5 C12.9 1.5 14.5 3.2 14.5 5.2 C14.5 9 8 13.5 8 13.5 Z"
        fill="currentColor"
      />
    </template>

    <!-- energy: 闪电 -->
    <template v-else-if="type === 'energy'">
      <path
        d="M10 1.5 L4.5 8.5 H8.2 L6 14.5 L13 7 H9.2 Z"
        fill="currentColor"
      />
    </template>

    <!-- satiety: 胃（肾形 + 上下管子） -->
    <template v-else-if="type === 'satiety'">
      <!-- 上方管子 -->
      <rect x="7" y="0.5" width="2.5" height="2.5" rx="1" fill="currentColor"/>
      <!-- 肾形主体：填充 -->
      <path
        d="M8.5 3
           C8.5 3 11.5 3 12.5 5
           C13.5 7 13 9.5 11.5 10.8
           C10.2 12 8.5 12.5 8.5 12.5
           C8.5 12.5 6.5 12.5 5.5 11.2
           C4.8 10.2 5 9 5.5 8
           C6 7 6.2 6.5 6 5.8
           C5.8 5 6 3.5 8.5 3 Z"
        fill="currentColor"
      />
      <!-- 下方管子 -->
      <rect x="7" y="12.5" width="2.5" height="2.5" rx="1" fill="currentColor"/>
    </template>

    <!-- mood: 笑脸 -->
    <template v-else-if="type === 'mood'">
      <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.3"/>
      <circle cx="5.5" cy="6.8" r="0.9" fill="currentColor"/>
      <circle cx="10.5" cy="6.8" r="0.9" fill="currentColor"/>
      <path
        d="M5.2 9.8 C5.8 11.2 6.8 12 8 12 C9.2 12 10.2 11.2 10.8 9.8"
        fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"
      />
    </template>

    <!-- hygiene: 泡泡（3个不重叠的圆圈，大中小） -->
    <template v-else-if="type === 'hygiene'">
      <!-- 大泡泡（左下） -->
      <circle cx="5" cy="11" r="3.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <!-- 中泡泡（右中） -->
      <circle cx="11" cy="8" r="2.5" fill="none" stroke="currentColor" stroke-width="1.1"/>
      <!-- 小泡泡（右上） -->
      <circle cx="10.5" cy="3" r="1.5" fill="none" stroke="currentColor" stroke-width="1"/>
    </template>

    <!-- mana: 四角星 -->
    <template v-else-if="type === 'mana'">
      <path
        d="M8 1 L9.2 6.8 L15 8 L9.2 9.2 L8 15 L6.8 9.2 L1 8 L6.8 6.8 Z"
        fill="currentColor"
      />
    </template>

  </svg>
</template>

<script setup lang="ts">
defineProps<{
  type: 'health' | 'energy' | 'satiety' | 'mood' | 'hygiene' | 'mana'
}>()
</script>
