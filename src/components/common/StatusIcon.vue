<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges">
    <!-- health: pixel heart -->
    <template v-if="type === 'health'">
      <rect x="1" y="3" width="4" height="2" fill="currentColor"/>
      <rect x="5" y="1" width="2" height="2" fill="currentColor"/>
      <rect x="9" y="1" width="2" height="2" fill="currentColor"/>
      <rect x="11" y="3" width="4" height="2" fill="currentColor"/>
      <rect x="1" y="5" width="14" height="4" fill="currentColor"/>
      <rect x="2" y="9" width="12" height="2" fill="currentColor"/>
      <rect x="3" y="11" width="10" height="2" fill="currentColor"/>
      <rect x="4" y="13" width="8" height="2" fill="currentColor"/>
      <rect x="6" y="15" width="4" height="1" fill="currentColor"/>
    </template>
    <!-- energy: pixel lightning -->
    <template v-else-if="type === 'energy'">
      <rect x="8" y="0" width="4" height="2" fill="currentColor"/>
      <rect x="6" y="2" width="4" height="2" fill="currentColor"/>
      <rect x="4" y="4" width="8" height="2" fill="currentColor"/>
      <rect x="3" y="6" width="10" height="2" fill="currentColor"/>
      <rect x="5" y="8" width="6" height="2" fill="currentColor"/>
      <rect x="4" y="10" width="6" height="2" fill="currentColor"/>
      <rect x="3" y="12" width="6" height="2" fill="currentColor"/>
      <rect x="2" y="14" width="4" height="2" fill="currentColor"/>
    </template>
    <!-- satiety: pixel drumstick -->
    <template v-else-if="type === 'satiety'">
      <rect x="10" y="0" width="4" height="2" fill="currentColor"/>
      <rect x="12" y="2" width="2" height="4" fill="currentColor"/>
      <rect x="10" y="4" width="4" height="2" fill="currentColor"/>
      <rect x="8" y="4" width="4" height="4" fill="currentColor"/>
      <rect x="6" y="6" width="6" height="4" fill="currentColor"/>
      <rect x="4" y="8" width="6" height="4" fill="currentColor"/>
      <rect x="2" y="10" width="6" height="4" fill="currentColor"/>
      <rect x="2" y="12" width="4" height="2" fill="currentColor"/>
    </template>
    <!-- mood: pixel smiley face -->
    <template v-else-if="type === 'mood'">
      <rect x="4" y="1" width="8" height="2" fill="currentColor"/>
      <rect x="2" y="3" width="4" height="2" fill="currentColor"/>
      <rect x="10" y="3" width="4" height="2" fill="currentColor"/>
      <rect x="1" y="5" width="14" height="6" fill="currentColor"/>
      <rect x="2" y="11" width="12" height="2" fill="currentColor"/>
      <rect x="4" y="13" width="8" height="2" fill="currentColor"/>
      <rect x="4" y="6" width="2" height="2" fill="white"/>
      <rect x="10" y="6" width="2" height="2" fill="white"/>
      <rect x="4" y="9" width="8" height="1" fill="white"/>
      <rect x="3" y="8" width="2" height="1" fill="white"/>
      <rect x="11" y="8" width="2" height="1" fill="white"/>
    </template>
    <!-- hygiene: pixel water drop -->
    <template v-else-if="type === 'hygiene'">
      <rect x="7" y="0" width="2" height="2" fill="currentColor"/>
      <rect x="6" y="2" width="4" height="2" fill="currentColor"/>
      <rect x="5" y="4" width="6" height="2" fill="currentColor"/>
      <rect x="3" y="6" width="10" height="2" fill="currentColor"/>
      <rect x="2" y="8" width="12" height="4" fill="currentColor"/>
      <rect x="3" y="12" width="10" height="2" fill="currentColor"/>
      <rect x="5" y="14" width="6" height="2" fill="currentColor"/>
    </template>
    <!-- mana: pixel gem -->
    <template v-else-if="type === 'mana'">
      <rect x="4" y="1" width="8" height="2" fill="currentColor"/>
      <rect x="2" y="3" width="12" height="2" fill="currentColor"/>
      <rect x="1" y="5" width="14" height="4" fill="currentColor"/>
      <rect x="2" y="9" width="12" height="2" fill="currentColor"/>
      <rect x="4" y="11" width="8" height="2" fill="currentColor"/>
      <rect x="6" y="13" width="4" height="2" fill="currentColor"/>
      <rect x="7" y="15" width="2" height="1" fill="currentColor"/>
    </template>
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  type: 'health' | 'energy' | 'satiety' | 'mood' | 'hygiene' | 'mana'
}>()
</script>
