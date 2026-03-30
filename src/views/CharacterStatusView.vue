<template>
  <div class="character-status-view">
    <PageHeader title="状态" />
    <CharacterStatus />
  </div>
</template>

<script setup lang="ts">
import CharacterStatus from '../components/game/CharacterStatus.vue'
import PageHeader from '../components/common/PageHeader.vue'
</script>

<style scoped>
.character-status-view {
  padding: 4rem 2rem 2rem;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
