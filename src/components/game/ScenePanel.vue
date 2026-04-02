<template>
  <div class="scene-panel translucent-white">
    <div class="scene-options">
      <span
        v-for="scene in scenes"
        :key="scene.id"
        class="scene-option"
        :class="{ active: modelValue === scene.id }"
        @click="handleSceneSwitch(scene.id)"
      >
        {{ scene.name }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCharacterStore } from '../../stores/character'
import { toast } from '../../utils/toast'
import { useGameLogStore } from '../../stores/gameLog'
import { useTimeStore } from '../../stores/time'

export interface Scene {
  id: string;
  name: string;
}

const props = defineProps<{
  modelValue: string;
  scenes: Scene[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const character = useCharacterStore()
const gameLogStore = useGameLogStore()
const timeStore = useTimeStore()

function handleSceneSwitch(sceneId: string) {
  if (sceneId === props.modelValue) return
  // Free to return to base (营地)
  if (sceneId === 'base') {
    emit('update:modelValue', sceneId)
    gameLogStore.addEntry({
      text: '回到了营地',
      type: 'ACTION',
      gameTimestamp: timeStore.timestamp,
      timestamp: Date.now()
    })
    return
  }
  if (character.energy < 5) {
    toast({ message: '太累了，没有力气移动到其他地方', type: 'warning' })
    return
  }
  character.energy = Math.max(0, character.energy - 5)
  const scene = props.scenes.find(s => s.id === sceneId)
  gameLogStore.addEntry({
    text: `前往了${scene?.name ?? sceneId}，消耗了5点体力`,
    type: 'ACTION',
    gameTimestamp: timeStore.timestamp,
    timestamp: Date.now()
  })
  emit('update:modelValue', sceneId)
}
</script>

<style scoped>
.scene-panel {
  width: 100%;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.scene-options {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.scene-option {  cursor: pointer;
  padding: 4px 12px;
  color: #666;
  transition: color 0.3s;
  user-select: none;
}

.scene-option:hover {
  color: #000;
}

.scene-option.active {
  color: #000;
  font-weight: bold;
}

.translucent-white {
  background-color: rgba(255, 255, 255, 0.7);
}
</style>
