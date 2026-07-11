<template>
  <div class="character-detail">
    <PageHeader title="装备" />
    <CharacterEquipment />
  </div>
</template>

<script setup lang="ts">
import CharacterEquipment from '../components/game/CharacterEquipment.vue'
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
