import { defineStore } from 'pinia';
import type { GameScene, GameBuildingRecipe, GameBuildingAction } from './types';
import { useCharacterStore } from '../character';
import { useTimeStore } from '../time';
import { getStockAmount } from '../../utils/resourceUtils';
import { useInventoryStore } from '../inventory';
import { toast } from '../../utils/toast';
import { useGameLogStore } from '../gameLog';
import { floatingText } from '../../utils/eventBus';

const RESOURCE_NAMES: { [key: string]: string } = {
  shellfish: '贝类',
  seaweed: '海藻'
};

const INITIAL_STOCK = {
  shellfish: { current: 35, max: 35 },
  seaweed: { current: 30, max: 30 }
} as const;

export const useSeasideSceneStore = defineStore('seasideScene', {
  state: () => ({
    scene: {
      id: 'seaside',
      name: '海边',
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

    async collectShellfish() {
      try {
        const amount = Math.floor(Math.random() * 3) + 1; // 1-3
        const actualAmount = await getStockAmount(this.scene.stock, 'shellfish', amount);
        useInventoryStore().addItem({ id: 'shellfish', type: 'shellfish', name: RESOURCE_NAMES.shellfish }, actualAmount);
        floatingText('+' + actualAmount + ' 贝类', 'gain');
        const message = `在海边捡到了 ${actualAmount} 个贝类`;
        toast({ message, type: 'success' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ITEM',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
      } catch {
        toast({ message: '海边的贝类已经被捡光了', type: 'warning' });
      }
    },

    async collectSeaweed() {
      try {
        const amount = Math.floor(Math.random() * 2) + 1; // 1-2
        const actualAmount = await getStockAmount(this.scene.stock, 'seaweed', amount);
        useInventoryStore().addItem({ id: 'seaweed', type: 'seaweed', name: RESOURCE_NAMES.seaweed }, actualAmount);
        floatingText('+' + actualAmount + ' 海藻', 'gain');
        const message = `采集了 ${actualAmount} 把海藻`;
        toast({ message, type: 'success' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ITEM',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
      } catch {
        toast({ message: '海边的海藻已经采完了', type: 'warning' });
      }
    },

    async explore() {
      const messages = [
        '海浪声不断，在沙滩上漫步，心情舒畅。心情 +8',
        '远处海天一线，景色壮阔，让人忘却烦恼。心情 +8',
        '踩着沙砾漫步海边，偶有海鸥掠过，让人心旷神怡。心情 +8'
      ];
      const message = messages[Math.floor(Math.random() * messages.length)];
      const character = useCharacterStore();
      character.mood = Math.min(100, character.mood + 8);
      toast({ message, type: 'info' });
      useGameLogStore().addEntry({
        text: message,
        type: 'ACTION',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    getBuildingActions(_buildingType: string): GameBuildingAction[] {
      return [];
    },

    getActionConfig() {
      return [
        {
          name: 'collectShellfish',
          text: '捡贝类',
          icon: '🦪',
          duration: 0.5,
          energyCost: 4,
          actionGroup: 'scene' as const,
          handler: async () => await this.withEnergyCost(4, async () => await this.collectShellfish())
        },
        {
          name: 'collectSeaweed',
          text: '采海藻',
          icon: '🌿',
          duration: 0.5,
          energyCost: 4,
          actionGroup: 'scene' as const,
          handler: async () => await this.withEnergyCost(4, async () => await this.collectSeaweed())
        },
        {
          name: 'explore',
          text: '海边漫步',
          icon: '🌊',
          duration: 1,
          energyCost: 3,
          actionGroup: 'scene' as const,
          handler: async () => await this.withEnergyCost(3, async () => await this.explore())
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
