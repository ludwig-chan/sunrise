import { defineStore } from 'pinia';
import type { GameScene, GameBuildingRecipe, GameBuildingAction } from './types';
import { useCharacterStore } from '../character';
import { useTimeStore } from '../time';
import { getStockAmount } from '../../utils/resourceUtils';
import { useInventoryStore } from '../inventory';
import { toast } from '../../utils/toast';
import { useGameLogStore } from '../gameLog';
import { emitter } from '../../utils/eventBus';

const RESOURCE_NAMES: { [key: string]: string } = {
  fish: '鱼',
  lotus_root: '莲藕',
  clay: '黏土',
  rare_fish: '稀有鱼',
  wood: '木材',
  stone: '石头'
};

const INITIAL_STOCK = {
  fish: { current: 30, max: 30 },
  lotus_root: { current: 20, max: 20 },
  clay: { current: 25, max: 25 }
} as const;

export const LAKESIDE_BUILDING_RECIPES: GameBuildingRecipe[] = [
  {
    type: 'viewingPlatform',
    name: '观景台',
    description: '建造一个木质观景台，每次在湖边执行动作时心情 +3',
    cost: { wood: 10, stone: 5 },
    duration: 1.5,
    energyCost: 15
  }
];

export const LAKESIDE_BUILDING_ICONS: Record<string, string> = {
  viewingPlatform: '🏔️'
};

export const useLakesideSceneStore = defineStore('lakesideScene', {
  state: () => ({
    scene: {
      id: 'lakeside',
      name: '湖边',
      actions: [],
      buildings: [],
      stock: JSON.parse(JSON.stringify(INITIAL_STOCK))
    } as GameScene,
    _recoveryListenerRegistered: false
  }),

  getters: {
    actions: (state) => state.scene.actions,
    buildingRecipes: (): GameBuildingRecipe[] => LAKESIDE_BUILDING_RECIPES
  },

  actions: {
    reset() {
      this.scene.buildings = [];
      this.scene.stock = JSON.parse(JSON.stringify(INITIAL_STOCK));
      this.scene.actions = [];
      this._recoveryListenerRegistered = false;
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

    // 观景台加成：若已建造，每次动作心情 +3
    applyViewingPlatformBonus() {
      const hasViewingPlatform = this.scene.buildings.some(b => b.type === 'viewingPlatform');
      if (hasViewingPlatform) {
        const character = useCharacterStore();
        character.mood = Math.min(100, character.mood + 3);
      }
    },

    async fishInLake() {
      // 检查是否有鱼竿
      if (!useInventoryStore().hasEnough('fishing_rod', 1)) {
        toast({ message: '需要鱼竿才能钓鱼，请先制作一根鱼竿', type: 'warning' });
        return;
      }

      if (Math.random() < 0.35) {
        const message = '鱼儿不上钩，白等了一会儿...';
        toast({ message, type: 'info' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ACTION',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
        this.applyViewingPlatformBonus();
        return;
      }

      const gained: string[] = [];
      const inventory = useInventoryStore();

      try {
        const amount = Math.floor(Math.random() * 2) + 1; // 1-2
        const actualAmount = await getStockAmount(this.scene.stock, 'fish', amount);
        inventory.addItem({ id: 'fish', type: 'fish', name: RESOURCE_NAMES.fish }, actualAmount);
        gained.push(`${actualAmount} 条鱼`);
      } catch {
        toast({ message: '湖里的鱼已经被钓光了，等等再来', type: 'warning' });
        return;
      }

      // 湖边 30% 概率额外获得稀有鱼
      if (Math.random() < 0.3) {
        inventory.addItem({ id: 'rare_fish', type: 'rare_fish', name: '稀有鱼' }, 1);
        gained.push('1 条稀有鱼');
      }

      const message = `湖中钓到了 ${gained.join('、')}！`;
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'ITEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
      this.applyViewingPlatformBonus();
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
      this.applyViewingPlatformBonus();
    },

    // 挖湖泥：产出 2-3 块黏土（比河边多）
    async digLakeClay() {
      try {
        const amount = Math.floor(Math.random() * 2) + 2; // 2-3
        const actualAmount = await getStockAmount(this.scene.stock, 'clay', amount);
        useInventoryStore().addItem({ id: 'clay', type: 'clay', name: RESOURCE_NAMES.clay }, actualAmount);
        const message = `在湖底淤泥中挖出了 ${actualAmount} 块黏土`;
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
      this.applyViewingPlatformBonus();
    },

    // 洗澡：hygiene +40，mood +15
    async bathe() {
      const character = useCharacterStore();
      character.hygiene = Math.min(100, character.hygiene + 40);
      character.mood = Math.min(100, character.mood + 15);
      const message = '在湖中痛快地游了一圈，神清气爽！卫生度 +40，心情 +15';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'SYSTEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
      this.applyViewingPlatformBonus();
    },

    // 建造建筑
    async build(recipeType: string) {
      const recipe = LAKESIDE_BUILDING_RECIPES.find(r => r.type === recipeType);
      if (!recipe) return;

      if (this.scene.buildings.some(b => b.type === recipeType)) {
        toast({ message: '该建筑已经建好了', type: 'warning' });
        return;
      }

      const inventory = useInventoryStore();
      const missing: string[] = [];
      for (const [resourceType, required] of Object.entries(recipe.cost)) {
        const current = inventory.getCount(resourceType);
        if (current < required) {
          const name = RESOURCE_NAMES[resourceType] ?? resourceType;
          missing.push(`${name} x${required - current}`);
        }
      }

      if (missing.length > 0) {
        toast({ message: `材料不足：还需要 ${missing.join('、')}`, type: 'warning' });
        return;
      }

      for (const [resourceType, required] of Object.entries(recipe.cost)) {
        inventory.removeItem(resourceType, required);
      }

      this.scene.buildings.push({
        name: recipe.name,
        type: recipe.type,
        level: 1,
        icon: LAKESIDE_BUILDING_ICONS[recipe.type]
      });
      toast({ message: `${recipe.name}建造成功！`, type: 'success' });
    },

    getBuildingActions(buildingType: string): GameBuildingAction[] {
      switch (buildingType) {
        case 'viewingPlatform':
          return [];
        default:
          return [];
      }
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
          preExecute: () => {
            if (!useInventoryStore().hasEnough('fishing_rod', 1)) {
              toast({ message: '需要鱼竿才能钓鱼，请先制作一根鱼竿', type: 'warning' });
              return false;
            }
            if (!this.checkEnergy(6)) return false;
            this.consumeEnergy(6);
            return true;
          },
          disabled: () => !useInventoryStore().hasEnough('fishing_rod', 1),
          tooltip: '需要鱼竿才能钓鱼',
          handler: async () => await this.fishInLake()
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
          name: 'digLakeClay',
          text: '挖湖泥',
          icon: '🪣',
          duration: 1,
          energyCost: 8,
          actionGroup: 'scene' as const,
          handler: async () => await this.withEnergyCost(8, async () => await this.digLakeClay())
        },
        {
          name: 'bathe',
          text: '游泳/洗澡',
          icon: '🏊',
          duration: 1.5,
          energyCost: 10,
          actionGroup: 'scene' as const,
          handler: async () => await this.withEnergyCost(10, async () => await this.bathe())
        }
      ];
    },

    initializeScene() {
      this.scene.actions = this.getActionConfig();
      if (!this.scene.stock) {
        this.scene.stock = JSON.parse(JSON.stringify(INITIAL_STOCK));
      }

      // 注册资源自动恢复监听（防止重复注册）
      // 每游戏小时：fish +1，lotus_root +1
      if (!this._recoveryListenerRegistered) {
        this._recoveryListenerRegistered = true;
        emitter.on('hour-passed', () => {
          const stock = this.scene.stock;
          if (stock.fish && stock.fish.current < stock.fish.max) {
            stock.fish.current = Math.min(stock.fish.max, stock.fish.current + 1);
          }
          if (stock.lotus_root && stock.lotus_root.current < stock.lotus_root.max) {
            stock.lotus_root.current = Math.min(stock.lotus_root.max, stock.lotus_root.current + 1);
          }
        });
      }
    }
  },

  persist: {
    omit: ['_recoveryListenerRegistered']
  }
});
