<template>
  <section class="actions-panel translucent-white">
    <!-- 按 group 分组渲染行动按钮 -->
    <template v-for="group in actionGroups" :key="group.key">
      <div
        :class="['action-buttons', group.isGroup ? 'action-buttons--row' : '']"
      >
        <ActionButton
          v-for="action in group.actions"
          :key="action.name"
          :duration="action.duration"
          :disabled="action.disabled"
          :tooltip="action.tooltip"
          :before-click="() => checkEnergyCost(action.energyCost)"
          @click="action.handler"
        >
          {{ action.text }}
        </ActionButton>
      </div>
    </template>

    <!-- 建造区域 -->
    <div class="build-section">
      <button class="build-toggle-btn" @click="showBuild = !showBuild">
        🔨 建造 <span class="toggle-arrow">{{ showBuild ? '▲' : '▼' }}</span>
      </button>
      <div v-if="showBuild" class="build-list">
        <div
          v-for="recipe in scenes.currentBuildingRecipes"
          :key="recipe.type"
          class="build-item"
        >
          <div class="build-info">
            <span class="build-name">{{ recipe.name }}</span>
            <span class="build-desc">{{ recipe.description }}</span>
            <span class="build-cost">{{ formatCost(recipe.cost) }}</span>
          </div>
          <button
            class="build-btn"
            :disabled="isBuilt(recipe.type)"
            @click="handleBuild(recipe)"
          >
            {{ isBuilt(recipe.type) ? '✓ 已建造' : '建造' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ActionButton from '../common/ActionButton.vue'
import { useCharacterStore } from '../../stores/character'
import { useScenesStore } from '../../stores/scenes'
import { toast } from '../../utils/toast'
import type { GameBuildingRecipe } from '../../stores/scenes/types'

interface Action {
  name: string;
  text: string;
  duration: number;
  energyCost: number;
  handler: () => Promise<void>;
  disabled?: boolean;
  tooltip?: string;
  group?: string;
}

const props = defineProps<{
  actions: Action[]
}>();

const character = useCharacterStore();
const scenes = useScenesStore();
const showBuild = ref(false);

// 将 actions 按 group 分组，保持原始顺序
const actionGroups = computed(() => {
  const groups: { key: string; isGroup: boolean; actions: Action[] }[] = [];
  const groupMap = new Map<string, Action[]>();

  for (const action of props.actions) {
    const key = action.group ?? `__solo__${action.name}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
      groups.push({ key, isGroup: !!action.group, actions: groupMap.get(key)! });
    }
    groupMap.get(key)!.push(action);
  }

  return groups;
});

function checkEnergyCost(cost: number) {
  if (character.energy < cost) {
    const messages = [
      '你感到精疲力尽，需要休息一下...',
      '你的双腿像灌了铅一样沉重...',
      '你气喘吁吁，暂时无法继续...',
      '你的手臂已经抬不起来了...',
      '你需要缓一缓，恢复些体力...'
    ];
    toast({
      message: messages[Math.floor(Math.random() * messages.length)],
      type: 'warning'
    });
    return false;
  }
  return true;
}

function isBuilt(recipeType: string): boolean {
  return scenes.currentScene.buildings.some(b => b.type === recipeType);
}

function formatCost(cost: { [key: string]: number }): string {
  const NAMES: { [key: string]: string } = {
    wood: '木材', ore: '矿石', branch: '树枝', apple: '苹果'
  };
  return Object.entries(cost)
    .map(([type, count]) => `${NAMES[type] ?? type}×${count}`)
    .join(' + ');
}

async function handleBuild(recipe: GameBuildingRecipe) {
  if (!checkEnergyCost(recipe.energyCost)) return;
  await scenes.buildInCurrentScene(recipe.type);
  if (isBuilt(recipe.type)) {
    character.energy = Math.max(0, character.energy - recipe.energyCost);
  }
}
</script>

<style scoped>
.actions-panel {
  border-radius: 8px;
  flex: 1;
  padding: 1rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-buttons--row {
  flex-direction: row;
  gap: 0.5rem;
}

.action-buttons--row :deep(.action-button) {
  flex: 1;
}

/* 建造区域 */
.build-section {
  margin-top: 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.build-toggle-btn {
  width: 100%;
  padding: 0.5rem 1rem;
  border: 1px dashed rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  background-color: rgba(74, 85, 104, 0.6);
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;
}

.build-toggle-btn:hover {
  background-color: rgba(74, 85, 104, 0.9);
}

.toggle-arrow {
  font-size: 0.75rem;
  opacity: 0.8;
}

.build-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.build-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.6rem;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  gap: 0.5rem;
}

.build-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.build-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #e2e8f0;
}

.build-desc {
  font-size: 0.75rem;
  color: #a0aec0;
  margin-top: 0.1rem;
}

.build-cost {
  font-size: 0.75rem;
  color: #fbd38d;
  margin-top: 0.1rem;
}

.build-btn {
  padding: 0.3rem 0.7rem;
  border: none;
  border-radius: 4px;
  background-color: #4a5568;
  color: white;
  cursor: pointer;
  font-size: 0.8rem;
  white-space: nowrap;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.build-btn:hover:not(:disabled) {
  background-color: #2d3748;
}

.build-btn:disabled {
  background-color: #2d5a27;
  cursor: not-allowed;
  opacity: 0.8;
}
</style>

