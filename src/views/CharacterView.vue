<template>
  <div class="character-detail">
    <div class="back-button" @click="goBack">⬅️</div>
    <div class="settings-button" @click="goToSettings">⚙️</div>
    <h1>{{ character.name }}</h1>

    <CharacterProfile />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCharacterStore } from '../stores/character'
import CharacterProfile from '../components/game/CharacterProfile.vue'

const router = useRouter()
const character = useCharacterStore()

const goBack = () => {
  router.back()
}

const goToSettings = () => {
  router.push('/settings')
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
  color: #333;
}

.settings-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
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

.settings-button:hover {
  background-color: rgba(0, 0, 0, 0.2);
  color: #333;
}
</style>
