<template>
  <div class="character-detail">
    <div class="back-button" @click="goBack">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges">
        <rect x="0" y="6" width="2" height="4" fill="currentColor"/>
        <rect x="2" y="4" width="2" height="8" fill="currentColor"/>
        <rect x="4" y="2" width="2" height="12" fill="currentColor"/>
        <rect x="6" y="0" width="2" height="16" fill="currentColor"/>
        <rect x="8" y="4" width="8" height="2" fill="currentColor"/>
        <rect x="8" y="10" width="8" height="2" fill="currentColor"/>
        <rect x="6" y="7" width="10" height="2" fill="currentColor"/>
      </svg>
    </div>
    <div class="h1-wrapper"><h1>{{ character.name }}</h1></div>

    <Tabs v-model="activeTab" :tabs="tabs">
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
import { useRouter } from 'vue-router'
import { useCharacterStore } from '../stores/character'
import CharacterProfile from '../components/game/CharacterProfile.vue'
import CharacterEquipment from '../components/game/CharacterEquipment.vue'
import CharacterLog from '../components/game/CharacterLog.vue'
import Tabs from '../components/common/Tabs.vue'

const router = useRouter()
const character = useCharacterStore()
const activeTab = ref('profile')
const tabs = [
  { key: 'profile', title: '状态' },
  { key: 'equipment', title: '装备' },
  { key: 'log', title: '日志' },
]

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.character-detail {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}

.back-button {
  position: absolute;
  top: 1rem;
  left: 1rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.1);
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.2rem;
}

.back-button:hover {
  background-color: rgba(0, 0, 0, 0.2);
  color: #333;
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

</style>
