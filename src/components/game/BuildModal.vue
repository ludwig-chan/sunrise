<template>
  <Teleport to="body">
    <div v-if="open" class="build-modal-overlay" @click.self="$emit('close')">
      <div class="build-modal">

        <!-- 标题栏 -->
        <div class="build-modal-header">
          <span class="build-modal-title">🏗️ 建造新建筑</span>
          <button class="build-modal-close" aria-label="关闭" @click="$emit('close')">✕</button>
        </div>

        <div class="build-modal-body">
          <div
            v-for="recipe in recipes"
            :key="recipe.type"
            class="build-item"
            :class="{ 'is-built': isBuilt(recipe.type) }"
          >
            <span class="build-item-icon">{{ buildingIcon(recipe.type) }}</span>
            <div class="build-item-info">
              <span class="build-item-name">{{ recipe.name }}</span>
              <span class="build-item-desc">{{ recipe.description }}</span>
              <span class="build-item-cost">{{ formatCost(recipe.cost) }}</span>
            </div>
            <button
              class="build-select-btn"
              :disabled="activity.isBusy || isBuilt(recipe.type)"
              @click="handleBuildStart(recipe)"
            >
              {{ isBuilt(recipe.type) ? '✓ 已建造' : '建造' }}
            </button>
          </div>

          <div v-if="recipes.length === 0" class="no-recipes">
            当前场景没有可建造的建筑
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useScenesStore } from '../../stores/scenes';
import { useActivityStore } from '../../stores/activity';
import { useCharacterStore } from '../../stores/character';
import { BASE_BUILDING_ICONS } from '../../stores/scenes/base';
import { FOREST_BUILDING_ICONS } from '../../stores/scenes/forest';
import { toast } from '../../utils/toast';
import type { GameBuildingRecipe } from '../../stores/scenes/types';

defineProps<{
  open: boolean;
  recipes: GameBuildingRecipe[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const scenes = useScenesStore();
const activity = useActivityStore();
const character = useCharacterStore();

function isBuilt(recipeType: string): boolean {
  return scenes.currentScene.buildings.some(b => b.type === recipeType);
}

function buildingIcon(type: string): string {
  return BASE_BUILDING_ICONS[type] ?? FOREST_BUILDING_ICONS[type] ?? '🏗️';
}

function formatCost(cost: { [key: string]: number }): string {
  const NAMES: { [key: string]: string } = {
    wood: '木材', ore: '矿石', branch: '树枝', apple: '苹果'
  };
  return '需要：' + Object.entries(cost)
    .map(([type, count]) => `${NAMES[type] ?? type}×${count}`)
    .join(' + ');
}

function handleBuildStart(recipe: GameBuildingRecipe) {
  if (activity.isBusy || isBuilt(recipe.type)) return;

  if (character.energy < recipe.energyCost) {
    toast({ message: '体力不足，无法建造', type: 'warning' });
    return;
  }

  emit('close');
  activity.startActivity({
    name: `build_${recipe.type}`,
    label: `建造${recipe.name}`,
    icon: '🏗️',
    startedAt: Date.now(),
    duration: recipe.duration * 1000,
    onComplete: async () => {
      await scenes.buildInCurrentScene(recipe.type);
      character.energy = Math.max(0, character.energy - recipe.energyCost);
    }
  });
}
</script>

<style scoped>
.build-modal-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.build-modal {
  min-width: 300px;
  max-width: 480px;
  width: 90%;
  max-height: 80vh;
  background: #1a202c;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  color: white;
  overflow: hidden;
}

.build-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
}

.build-modal-title {
  font-size: 1rem;
  font-weight: 600;
}

.build-modal-close {
  background: none;
  border: none;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  opacity: 0.7;
  padding: 0 0.25rem;
}

.build-modal-close:hover {
  opacity: 1;
}

.build-modal-body {
  overflow-y: auto;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.build-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.build-item.is-built {
  opacity: 0.55;
}

.build-item-icon {
  font-size: 1.3rem;
  width: 1.6rem;
  text-align: center;
  flex-shrink: 0;
}

.build-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.build-item-name {
  font-size: 0.9rem;
  color: #e2e8f0;
  font-weight: 600;
}

.build-item-desc {
  font-size: 0.75rem;
  color: #a0aec0;
}

.build-item-cost {
  font-size: 0.72rem;
  color: #fbd38d;
  margin-top: 0.05rem;
}

.build-select-btn {
  padding: 0.25rem 0.65rem;
  border: none;
  border-radius: 4px;
  background-color: #4a5568;
  color: white;
  cursor: pointer;
  font-size: 0.8rem;
  white-space: nowrap;
  transition: background-color 0.2s;
  flex-shrink: 0;
  min-width: 3.5rem;
}

.build-select-btn:hover:not(:disabled) {
  background-color: #38a169;
}

.build-select-btn:disabled {
  background-color: #2d3748;
  color: #718096;
  cursor: not-allowed;
}

.no-recipes {
  font-size: 0.85rem;
  color: #718096;
  text-align: center;
  padding: 1rem 0;
}
</style>
