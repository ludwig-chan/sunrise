import { defineStore } from 'pinia';
import { useBaseSceneStore } from './scenes/base';
import { useForestSceneStore } from './scenes/forest';
import { useRiverSceneStore } from './scenes/river';
import { useCaveSceneStore } from './scenes/cave';
import { useGrasslandSceneStore } from './scenes/grassland';
import { useLakesideSceneStore } from './scenes/lakeside';
import { useSeasideSceneStore } from './scenes/seaside';
import type { GameScene, GameAction, GameBuildingRecipe, GameBuildingAction, ActionGroup, GameBuilding } from './scenes/types';

export const useScenesStore = defineStore('scenes', {
  state: () => ({
    currentSceneId: 'base',
    unlockedScenes: ['base'] as string[], // 初始只解锁基地场景
    lastUsedActionName: null as string | null,  // 记录上次通过"更多"菜单使用的操作名称
    lastUsedBuildingActionName: null as string | null,  // 记录上次使用的建筑动作名称
    lastUsedBuildingType: null as string | null  // 记录上次使用的建筑类型
  }),

  getters: {
    currentScene(): GameScene {
      const baseScene = useBaseSceneStore();
      const forestScene = useForestSceneStore();
      const riverScene = useRiverSceneStore();
      const caveScene = useCaveSceneStore();
      const grasslandScene = useGrasslandSceneStore();
      const lakesideScene = useLakesideSceneStore();
      const seasideScene = useSeasideSceneStore();
      
      switch (this.currentSceneId) {
        case 'base':
          return baseScene.scene;
        case 'forest':
          return forestScene.scene;
        case 'river':
          return riverScene.scene;
        case 'cave':
          return caveScene.scene;
        case 'grassland':
          return grasslandScene.scene;
        case 'lakeside':
          return lakesideScene.scene;
        case 'seaside':
          return seasideScene.scene;
        default:
          return baseScene.scene;
      }
    },

    currentResources(): never[] {
      return [];
    },

    // 返回所有动作（兼容旧用法，已废弃，请改用 currentGroupedActions）
    currentActions(): GameAction[] {
      const baseScene = useBaseSceneStore();
      const forestScene = useForestSceneStore();
      const riverScene = useRiverSceneStore();
      const caveScene = useCaveSceneStore();
      const grasslandScene = useGrasslandSceneStore();
      const lakesideScene = useLakesideSceneStore();
      const seasideScene = useSeasideSceneStore();
      switch (this.currentSceneId) {
        case 'base': return [...baseScene.getCharacterActions(), ...baseScene.getActionConfig()];
        case 'forest': return [...baseScene.getCharacterActions(), ...forestScene.getActionConfig()];
        case 'river': return [...baseScene.getCharacterActions(), ...riverScene.getActionConfig()];
        case 'cave': return [...baseScene.getCharacterActions(), ...caveScene.getActionConfig()];
        case 'grassland': return [...baseScene.getCharacterActions(), ...grasslandScene.getActionConfig()];
        case 'lakeside': return [...baseScene.getCharacterActions(), ...lakesideScene.getActionConfig()];
        case 'seaside': return [...baseScene.getCharacterActions(), ...seasideScene.getActionConfig()];
        default: return baseScene.getCharacterActions();
      }
    },

    // 分组动作：人物行动 + 场景基础行动（供 ActionsPanel 分组展示）
    currentGroupedActions(): ActionGroup[] {
      const baseScene = useBaseSceneStore();
      const forestScene = useForestSceneStore();
      const riverScene = useRiverSceneStore();
      const caveScene = useCaveSceneStore();
      const grasslandScene = useGrasslandSceneStore();
      const lakesideScene = useLakesideSceneStore();
      const seasideScene = useSeasideSceneStore();
      const characterActions = baseScene.getCharacterActions();
      let sceneActions: GameAction[] = [];

      switch (this.currentSceneId) {
        case 'base':
          sceneActions = baseScene.getActionConfig();
          break;
        case 'forest':
          sceneActions = forestScene.getActionConfig();
          break;
        case 'river':
          sceneActions = riverScene.getActionConfig();
          break;
        case 'cave':
          sceneActions = caveScene.getActionConfig();
          break;
        case 'grassland':
          sceneActions = grasslandScene.getActionConfig();
          break;
        case 'lakeside':
          sceneActions = lakesideScene.getActionConfig();
          break;
        case 'seaside':
          sceneActions = seasideScene.getActionConfig();
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
      const riverScene = useRiverSceneStore();
      const caveScene = useCaveSceneStore();
      const grasslandScene = useGrasslandSceneStore();
      const lakesideScene = useLakesideSceneStore();
      const seasideScene = useSeasideSceneStore();
      switch (this.currentSceneId) {
        case 'base': return baseScene.buildingRecipes;
        case 'forest': return forestScene.buildingRecipes;
        case 'river': return riverScene.buildingRecipes;
        case 'cave': return caveScene.buildingRecipes;
        case 'grassland': return grasslandScene.buildingRecipes;
        case 'lakeside': return lakesideScene.buildingRecipes;
        case 'seaside': return seasideScene.buildingRecipes;
        default: return [];
      }
    }
  },
  actions: {
    initializeScenes() {
      const baseScene = useBaseSceneStore();
      const forestScene = useForestSceneStore();
      const riverScene = useRiverSceneStore();
      const caveScene = useCaveSceneStore();
      const grasslandScene = useGrasslandSceneStore();
      const lakesideScene = useLakesideSceneStore();
      const seasideScene = useSeasideSceneStore();
      
      baseScene.initializeScene();
      forestScene.initializeScene();
      riverScene.initializeScene();
      caveScene.initializeScene();
      grasslandScene.initializeScene();
      lakesideScene.initializeScene();
      seasideScene.initializeScene();
    },

    // 重置所有场景
    resetAllScenes() {
      const baseScene = useBaseSceneStore();
      const forestScene = useForestSceneStore();
      const riverScene = useRiverSceneStore();
      const caveScene = useCaveSceneStore();
      const grasslandScene = useGrasslandSceneStore();
      const lakesideScene = useLakesideSceneStore();
      const seasideScene = useSeasideSceneStore();
      
      baseScene.reset();
      forestScene.reset();
      riverScene.reset();
      caveScene.reset();
      grasslandScene.reset();
      lakesideScene.reset();
      seasideScene.reset();
      
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
      const riverScene = useRiverSceneStore();
      const caveScene = useCaveSceneStore();
      const grasslandScene = useGrasslandSceneStore();
      const lakesideScene = useLakesideSceneStore();
      switch (this.currentSceneId) {
        case 'base':
          await baseScene.build(recipeType);
          break;
        case 'forest':
          await forestScene.build(recipeType);
          break;
        case 'river':
          await riverScene.build(recipeType);
          break;
        case 'cave':
          await caveScene.build(recipeType);
          break;
        case 'grassland':
          await grasslandScene.build(recipeType);
          break;
        case 'lakeside':
          await lakesideScene.build(recipeType);
          break;
      }
    },

    // 获取当前场景中某建筑的动作列表
    getBuildingActions(buildingType: string): GameBuildingAction[] {
      const baseScene = useBaseSceneStore();
      const forestScene = useForestSceneStore();
      const riverScene = useRiverSceneStore();
      const caveScene = useCaveSceneStore();
      const grasslandScene = useGrasslandSceneStore();
      const lakesideScene = useLakesideSceneStore();
      const seasideScene = useSeasideSceneStore();
      switch (this.currentSceneId) {
        case 'base':
          return baseScene.getBuildingActions(buildingType);
        case 'forest':
          return forestScene.getBuildingActions(buildingType);
        case 'river':
          return riverScene.getBuildingActions(buildingType);
        case 'cave':
          return caveScene.getBuildingActions(buildingType);
        case 'grassland':
          return grasslandScene.getBuildingActions(buildingType);
        case 'lakeside':
          return lakesideScene.getBuildingActions(buildingType);
        case 'seaside':
          return seasideScene.getBuildingActions(buildingType);
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
    },

    // 记录上次通过"更多"菜单使用的操作
    setLastUsedAction(name: string) {
      this.lastUsedActionName = name;
    },

    // 记录上次使用的建筑动作
    setLastUsedBuildingAction(buildingType: string, actionName: string) {
      this.lastUsedBuildingType = buildingType;
      this.lastUsedBuildingActionName = actionName;
    },

    // 修复当前场景中的某个陷阱
    repairTrapInCurrentScene(building: GameBuilding) {
      const baseScene = useBaseSceneStore();
      const forestScene = useForestSceneStore();
      switch (this.currentSceneId) {
        case 'base':
          baseScene.repairTrap(building);
          break;
        case 'forest':
          forestScene.repairTrap(building);
          break;
      }
    },

    // 摧毁当前场景中的某个陷阱
    destroyTrapInCurrentScene(building: GameBuilding) {
      const baseScene = useBaseSceneStore();
      const forestScene = useForestSceneStore();
      switch (this.currentSceneId) {
        case 'base':
          baseScene.destroyTrap(building);
          break;
        case 'forest':
          forestScene.destroyTrap(building);
          break;
      }
    }
  },

  persist: true
});