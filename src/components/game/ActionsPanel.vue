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
    <ActionButton @click="showBuildModal = true">
      🔨 建造
    </ActionButton>

    <!-- 建造弹窗 -->
    <Teleport to="body">
      <div v-if="showBuildModal" class="build-modal-overlay" @click.self="showBuildModal = false" @keydown.esc="showBuildModal = false">
        <div class="build-modal">
          <div class="build-modal-header">
            <span class="build-modal-title">🔨 选择建造</span>
            <button class="build-modal-close" aria-label="关闭弹窗" @click="showBuildModal = false">×</button>
          </div>
          <div class="build-modal-body">
            <div v-if="scenes.currentBuildingRecipes.length === 0" class="build-modal-empty">
              当前场景暂无可建造的建筑
            </div>
            <div
              v-for="recipe in scenes.currentBuildingRecipes"
              :key="recipe.type"
              class="build-card"
            >
              <div class="build-card-info">
                <span class="build-card-name">{{ recipe.name }}</span>
                <span class="build-card-desc">{{ recipe.description }}</span>
                <span class="build-card-cost">{{ formatCost(recipe.cost) }}</span>
                <span class="build-card-energy">⚡ 体力：{{ recipe.energyCost }}</span>
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
      </div>
    </Teleport>
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
const showBuildModal = ref(false);

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
    showBuildModal.value = false;
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

/* 建造弹窗 */
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
  z-index: 1000;
}

.build-modal {
  min-width: 320px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  background: #1a202c;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  color: white;
}

.build-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.build-modal-title {
  font-size: 1rem;
  font-weight: 600;
}

.build-modal-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  line-height: 1;
  padding: 0 0.25rem;
  opacity: 0.7;
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

.build-modal-empty {
  font-size: 0.9rem;
  color: #a0aec0;
  text-align: center;
  padding: 1rem 0;
}

.build-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  gap: 0.75rem;
}

.build-card-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 0.15rem;
}

.build-card-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: #e2e8f0;
}

.build-card-desc {
  font-size: 0.78rem;
  color: #a0aec0;
}

.build-card-cost {
  font-size: 0.78rem;
  color: #fbd38d;
}

.build-card-energy {
  font-size: 0.78rem;
  color: #90cdf4;
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

