<template>
  <div class="character-detail">
    <PageHeader title="个人信息" />
    <CharacterProfile />
  </div>
</template>

<script setup lang="ts">
import CharacterProfile from '../components/game/CharacterProfile.vue'
import PageHeader from '../components/common/PageHeader.vue'
</script>

<style scoped>
.character-detail {
  padding: 4rem 2rem 2rem;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
