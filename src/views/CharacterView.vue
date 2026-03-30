<template>
  <div class="character-detail">
    <PageHeader :title="character.name" />

    <Tabs v-model="activeTab" :tabs="tabs" class="character-tabs">
      <template #profile>
        <CharacterProfile />
      </template>
      <template #equipment>
        <CharacterEquipment />
      </template>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCharacterStore } from '../stores/character'
import CharacterProfile from '../components/game/CharacterProfile.vue'
import CharacterEquipment from '../components/game/CharacterEquipment.vue'
import Tabs from '../components/common/Tabs.vue'
import PageHeader from '../components/common/PageHeader.vue'

const character = useCharacterStore()
const activeTab = ref('profile')
const tabs = [
  { key: 'profile', title: '状态' },
  { key: 'equipment', title: '装备' },
]
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

.character-tabs {
  flex: 1;
  min-height: 0;
}
</style>
