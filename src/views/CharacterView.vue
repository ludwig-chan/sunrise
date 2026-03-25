<template>
  <div class="character-detail">
    <BackButton />
    <div class="h1-wrapper"><h1>{{ character.name }}</h1></div>

    <Tabs v-model="activeTab" :tabs="tabs" class="character-tabs">
      <template #profile>
        <CharacterProfile />
      </template>
      <template #equipment>
        <CharacterEquipment />
      </template>
      <template #log>
        <CharacterLog />
      </template>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCharacterStore } from '../stores/character'
import CharacterProfile from '../components/game/CharacterProfile.vue'
import CharacterEquipment from '../components/game/CharacterEquipment.vue'
import CharacterLog from '../components/game/CharacterLog.vue'
import Tabs from '../components/common/Tabs.vue'
import BackButton from '../components/common/BackButton.vue'

const character = useCharacterStore()
const activeTab = ref('profile')
const tabs = [
  { key: 'profile', title: '状态' },
  { key: 'equipment', title: '装备' },
  { key: 'log', title: '日志' },
]
</script>

<style scoped>
.character-detail {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #fff;
  display: inline-block;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  padding: 0.2rem 1.2rem;
  border-radius: 20px;
  width: fit-content;
}

.h1-wrapper {
  text-align: center;
}

.character-tabs {
  flex: 1;
  min-height: 0;
}
</style>
