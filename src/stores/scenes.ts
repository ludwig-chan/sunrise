import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useBaseSceneStore } from './scenes/base';
import { useForestSceneStore } from './scenes/forest';
import type { GameScene } from './scenes/types';

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

    currentActions(): GameScene['actions'] {
      return this.currentScene.actions;
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
    }
  },

  persist: true
});