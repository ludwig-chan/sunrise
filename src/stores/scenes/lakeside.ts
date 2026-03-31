import { defineStore } from 'pinia';
import type { GameScene, GameBuildingRecipe, GameBuildingAction } from './types';
import { useCharacterStore } from '../character';
import { useTimeStore } from '../time';
import { getStockAmount } from '../../utils/resourceUtils';
import { useInventoryStore } from '../inventory';
import { toast } from '../../utils/toast';
import { useGameLogStore } from '../gameLog';

const RESOURCE_NAMES: { [key: string]: string } = {
  fish: '鱼',
  lotus_root: '莲藕',
  clay: '黏土'
};

const INITIAL_STOCK = {
  fish: { current: 30, max: 30 },
  lotus_root: { current: 20, max: 20 },
  clay: { current: 25, max: 25 }
} as const;

export const useLakesideSceneStore = defineStore('lakesideScene', {
  state: () => ({
    scene: {
      id: 'lakeside',
      name: '湖边',
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

    async fishInLake() {
      if (Math.random() < 0.35) {
        const message = '鱼儿不上钩，白等了一会儿...';
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
        const amount = Math.floor(Math.random() * 2) + 1; // 1-2
        const actualAmount = await getStockAmount(this.scene.stock, 'fish', amount);
        useInventoryStore().addItem({ id: 'fish', type: 'fish', name: RESOURCE_NAMES.fish }, actualAmount);
        const message = `湖中钓到了 ${actualAmount} 条鱼！`;
        toast({ message, type: 'success' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ITEM',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
      } catch {
        toast({ message: '湖里的鱼已经被钓光了，等等再来', type: 'warning' });
      }
    },

    async harvestLotus() {
      try {
        const actualAmount = await getStockAmount(this.scene.stock, 'lotus_root', 1);
        useInventoryStore().addItem({ id: 'lotus_root', type: 'lotus_root', name: RESOURCE_NAMES.lotus_root }, actualAmount);
        const message = `从湖中采到了 ${actualAmount} 节莲藕`;
        toast({ message, type: 'success' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ITEM',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
      } catch {
        toast({ message: '湖中的莲藕已经采完了', type: 'warning' });
      }
    },

    async digClay() {
      try {
        const amount = Math.floor(Math.random() * 2) + 1; // 1-2
        const actualAmount = await getStockAmount(this.scene.stock, 'clay', amount);
        useInventoryStore().addItem({ id: 'clay', type: 'clay', name: RESOURCE_NAMES.clay }, actualAmount);
        const message = `挖出了 ${actualAmount} 块黏土`;
        toast({ message, type: 'success' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ITEM',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
      } catch {
        toast({ message: '湖边的黏土已经挖完了', type: 'warning' });
      }
    },

    getBuildingActions(_buildingType: string): GameBuildingAction[] {
      return [];
    },

    getActionConfig() {
      return [
        {
          name: 'fishInLake',
          text: '钓鱼',
          icon: '🎣',
          duration: 1.5,
          energyCost: 6,
          actionGroup: 'scene' as const,
          handler: async () => await this.withEnergyCost(6, async () => await this.fishInLake())
        },
        {
          name: 'harvestLotus',
          text: '采莲藕',
          icon: '🪷',
          duration: 1,
          energyCost: 5,
          actionGroup: 'scene' as const,
          handler: async () => await this.withEnergyCost(5, async () => await this.harvestLotus())
        },
        {
          name: 'digClay',
          text: '挖泥',
          icon: '🪣',
          duration: 1,
          energyCost: 8,
          actionGroup: 'scene' as const,
          handler: async () => await this.withEnergyCost(8, async () => await this.digClay())
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
