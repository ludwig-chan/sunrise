import { defineStore } from 'pinia';
import { useBaseSceneStore } from './scenes/base';
import { useForestSceneStore } from './scenes/forest';
import type { GameScene, GameAction, GameBuildingRecipe, GameBuildingAction, ActionGroup } from './scenes/types';

export const useScenesStore = defineStore('scenes', {
  state: () => ({
    currentSceneId: 'base',
    unlockedScenes: ['base'] as string[] // 初始只解锁基地场景
  }),

  getters: {
    currentScene(): GameScene {
      const baseScene = useBaseSceneStore();
      const forestScene = useForestSceneStore();
      
      switch (this.currentSceneId) {
        case 'base':
          return baseScene.scene;
        case 'forest':
          return forestScene.scene;
        default:
          return baseScene.scene;
      }
    },

    currentResources(): GameScene['resources'] {
      return this.currentScene.resources;
    },

    // 返回所有动作（兼容旧用法，已废弃，请改用 currentGroupedActions）
    currentActions(): GameAction[] {
      const baseScene = useBaseSceneStore();
      const forestScene = useForestSceneStore();
      switch (this.currentSceneId) {
        case 'base': return [...baseScene.getCharacterActions(), ...baseScene.getActionConfig()];
        case 'forest': return [...baseScene.getCharacterActions(), ...forestScene.getActionConfig()];
        default: return baseScene.getCharacterActions();
      }
    },

    // 分组动作：人物行动 + 场景基础行动（供 ActionsPanel 分组展示）
    currentGroupedActions(): ActionGroup[] {
      const baseScene = useBaseSceneStore();
      const forestScene = useForestSceneStore();
      const characterActions = baseScene.getCharacterActions();
      let sceneActions: GameAction[] = [];

      switch (this.currentSceneId) {
        case 'base':
          sceneActions = baseScene.getActionConfig();
          break;
        case 'forest':
          sceneActions = forestScene.getActionConfig();
          break;
      }

      const groups: ActionGroup[] = [
        {
          groupId: 'character',
          label: '人物行动',
          actions: characterActions
        }
      ];

      if (sceneActions.length > 0) {
        groups.push({
          groupId: 'scene',
          label: `当前场景：${this.currentScene.name}`,
          actions: sceneActions
        });
      }

      return groups;
    },

    currentBuildingRecipes(): GameBuildingRecipe[] {
      const baseScene = useBaseSceneStore();
      const forestScene = useForestSceneStore();
      switch (this.currentSceneId) {
        case 'base': return baseScene.buildingRecipes;
        case 'forest': return forestScene.buildingRecipes;
        default: return [];
      }
    }
  },
  actions: {
    initializeScenes() {
      const baseScene = useBaseSceneStore();
      const forestScene = useForestSceneStore();
      
      baseScene.initializeScene();
      forestScene.initializeScene();
    },

    // 重置所有场景
    resetAllScenes() {
      const baseScene = useBaseSceneStore();
      const forestScene = useForestSceneStore();
      
      baseScene.reset();
      forestScene.reset();
      
      // 重置解锁状态，只保留基地场景
      this.unlockedScenes = ['base'];
      // 重置当前场景为基地
      this.currentSceneId = 'base';
    },

    // 解锁新场景
    unlockScene(sceneId: string) {
      if (!this.unlockedScenes.includes(sceneId)) {
        this.unlockedScenes.push(sceneId);
      }
    },

    // 在当前场景建造建筑
    async buildInCurrentScene(recipeType: string) {
      const baseScene = useBaseSceneStore();
      const forestScene = useForestSceneStore();
      switch (this.currentSceneId) {
        case 'base':
          await baseScene.build(recipeType);
          break;
        case 'forest':
          await forestScene.build(recipeType);
          break;
      }
    },

    // 获取当前场景中某建筑的动作列表
    getBuildingActions(buildingType: string): GameBuildingAction[] {
      const baseScene = useBaseSceneStore();
      const forestScene = useForestSceneStore();
      switch (this.currentSceneId) {
        case 'base':
          return baseScene.getBuildingActions(buildingType);
        case 'forest':
          return forestScene.getBuildingActions(buildingType);
        default:
          return [];
      }
    },

    // 升级当前场景中的某个建筑（预留，待实现完整升级逻辑）
    async upgradeBuildingInCurrentScene(buildingType: string) {
      const building = this.currentScene.buildings.find(b => b.type === buildingType);
      if (!building) return;
      // TODO: 实现具体升级逻辑（消耗材料、增加等级）
      building.level += 1;
    }
  },

  persist: true
});