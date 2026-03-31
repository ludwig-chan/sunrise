import { defineStore } from 'pinia';
import type { GameScene, GameBuildingRecipe, GameBuildingAction } from './types';
import { useCharacterStore } from '../character';
import { useTimeStore } from '../time';
import { getStockAmount, hasStock } from '../../utils/resourceUtils';
import { useInventoryStore } from '../inventory';
import { toast } from '../../utils/toast';
import { useGameLogStore } from '../gameLog';

const RESOURCE_NAMES: { [key: string]: string } = {
  grass: '草',
  berry: '浆果',
  branch: '树枝'
};

const INITIAL_STOCK = {
  grass: { current: 80, max: 80 },
  berry: { current: 20, max: 20 },
  branch: { current: 25, max: 25 }
} as const;

const FOOD_GATHER_FAILURE_RATE = 0.35;

export const useGrasslandSceneStore = defineStore('grasslandScene', {
  state: () => ({
    scene: {
      id: 'grassland',
      name: '草地',
      actions: [],
      buildings: [],
      stock: JSON.parse(JSON.stringify(INITIAL_STOCK))
    } as GameScene
  }),

  getters: {
    actions: (state) => state.scene.actions,
    buildingRecipes: (): GameBuildingRecipe[] => []
  },

  actions: {
    reset() {
      this.scene.buildings = [];
      this.scene.stock = JSON.parse(JSON.stringify(INITIAL_STOCK));
      this.scene.actions = [];
    },

    checkEnergy(cost: number): boolean {
      const character = useCharacterStore();
      if (character.energy < cost) {
        toast({ message: '你太累了,需要休息一下...', type: 'warning' });
        return false;
      }
      return true;
    },

    consumeEnergy(cost: number) {
      const character = useCharacterStore();
      character.energy = Math.max(0, character.energy - cost);
    },

    async withEnergyCost(cost: number, action: () => Promise<void>): Promise<void> {
      if (!this.checkEnergy(cost)) return;
      await action();
      this.consumeEnergy(cost);
    },

    async gatherGrass() {
      try {
        const amount = Math.floor(Math.random() * 3) + 1; // 1-3
        const actualAmount = await getStockAmount(this.scene.stock, 'grass', amount);
        useInventoryStore().addItem({ id: 'grass', type: 'grass', name: RESOURCE_NAMES.grass }, actualAmount);
        const message = `采集了 ${actualAmount} 把草`;
        toast({ message, type: 'success' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ITEM',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
        if (!hasStock(this.scene.stock, 'grass')) {
          toast({ message: '草地上的草已经被采光了', type: 'warning' });
        }
      } catch {
        toast({ message: '草地上已经没有更多草了', type: 'warning' });
      }
    },

    async gatherFood() {
      if (Math.random() < FOOD_GATHER_FAILURE_RATE) {
        const message = '翻找了一会儿，没有发现可以吃的东西';
        toast({ message, type: 'info' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ACTION',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
        return;
      }
      try {
        const berryAmount = await getStockAmount(this.scene.stock, 'berry', 2);
        useInventoryStore().addItem({ id: 'berry', type: 'berry', name: RESOURCE_NAMES.berry }, berryAmount);
        const message = `在草丛中找到了 ${berryAmount} 把浆果`;
        toast({ message, type: 'success' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ITEM',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
      } catch {
        toast({ message: '草地上的浆果已经采完了，等待自然恢复', type: 'warning' });
      }
    },

    getBuildingActions(_buildingType: string): GameBuildingAction[] {
      return [];
    },

    getActionConfig() {
      return [
        {
          name: 'gatherGrass',
          text: '采草',
          icon: '🌱',
          duration: 0.5,
          energyCost: 3,
          actionGroup: 'scene' as const,
          handler: async () => await this.withEnergyCost(3, async () => await this.gatherGrass())
        },
        {
          name: 'gatherFood',
          text: '觅食',
          icon: '🫐',
          duration: 1,
          energyCost: 5,
          actionGroup: 'scene' as const,
          handler: async () => await this.withEnergyCost(5, async () => await this.gatherFood())
        }
      ];
    },

    initializeScene() {
      this.scene.actions = this.getActionConfig();
      if (!this.scene.stock) {
        this.scene.stock = JSON.parse(JSON.stringify(INITIAL_STOCK));
      }
    }
  },

  persist: true
});
