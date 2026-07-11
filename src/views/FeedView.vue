<template>
  <main class="feed-container">
    <GameFeed />
  </main>
</template>

<script setup lang="ts">
import GameFeed from '@/components/game/GameFeed.vue'
</script>

<style scoped>
.feed-container {
  height: 100vh;
  padding: 1rem;
}
</style>
