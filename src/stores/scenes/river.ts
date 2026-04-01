import { defineStore } from 'pinia';
import type { GameScene, GameBuildingRecipe, GameBuildingAction } from './types';
import { useEquipmentStore } from '../equipment';
import { useCharacterStore } from '../character';
import { useTimeStore } from '../time';
import { useScenesStore } from '../scenes';
import { getStockAmount } from '../../utils/resourceUtils';
import { useInventoryStore } from '../inventory';
import { toast } from '../../utils/toast';
import { useGameLogStore } from '../gameLog';
import { emitter } from '../../utils/eventBus';

// 河边可建造的建筑配方
export const RIVER_BUILDING_RECIPES: GameBuildingRecipe[] = [
  {
    type: 'fishingHut',
    name: '渔屋',
    description: '搭建简易渔屋，可以在此处更高效地钓鱼',
    cost: { wood: 15, branch: 5 },
    duration: 1,
    energyCost: 15
  },
  {
    type: 'waterWheel',
    name: '水车',
    description: '建造水车，每6小时自动为基地补充水资源（恢复库存）',
    cost: { wood: 20, stone: 10 },
    duration: 1.5,
    energyCost: 20
  },
  {
    type: 'herbGarden',
    name: '草药园',
    description: '在河边开辟草药园，让草药库存缓慢自然恢复',
    cost: { branch: 8, clay: 5 },
    duration: 1,
    energyCost: 12
  }
];

// 建筑图标映射
export const RIVER_BUILDING_ICONS: Record<string, string> = {
  fishingHut: '🛖',
  waterWheel: '⚙️',
  herbGarden: '🌱'
};

const RESOURCE_NAMES: { [key: string]: string } = {
  wood: '木材',
  stone: '石头',
  branch: '树枝',
  clay: '黏土',
  herb: '草药',
  fish: '鱼'
};

// 定义河边初始库存
const INITIAL_STOCK = {
  fish: { current: 25, max: 25 },
  clay: { current: 20, max: 20 },
  stone: { current: 30, max: 30 },
  herb: { current: 15, max: 15 }
} as const;

// 湖边解锁阈值：在河边完成 3 次钓鱼/采草/采集后解锁湖边
const LAKESIDE_UNLOCK_THRESHOLD = 3;

export const useRiverSceneStore = defineStore('riverScene', {
  state: () => ({
    scene: {
      id: 'river',
      name: '河边',
      actions: [],
      buildings: [],
      stock: JSON.parse(JSON.stringify(INITIAL_STOCK))
    } as GameScene,
    waterWheelHoursElapsed: 0,
    // 河边行动次数计数，达到阈值后解锁湖边
    riverActionCount: 0,
    _waterWheelListenerRegistered: false
  }),

  getters: {
    actions: (state) => state.scene.actions,
    buildingRecipes: (): GameBuildingRecipe[] => RIVER_BUILDING_RECIPES
  },

  actions: {
    // 重置场景状态
    reset() {
      // 重置建筑
      this.scene.buildings = []

      // 重置库存到初始状态
      this.scene.stock = JSON.parse(JSON.stringify(INITIAL_STOCK))

      // 重置动作列表
      this.scene.actions = []

      // 重置水车计时
      this.waterWheelHoursElapsed = 0

      // 重置行动计数
      this.riverActionCount = 0
    },

    // 检查体力值是否足够
    checkEnergy(cost: number): boolean {
      const character = useCharacterStore();
      if (character.energy < cost) {
        toast({
          message: "你太累了,需要休息一下...",
          type: "warning"
        });
        return false;
      }
      return true;
    },

    // 消耗体力值
    consumeEnergy(cost: number) {
      const character = useCharacterStore();
      character.energy = Math.max(0, character.energy - cost);
    },

    // 为动作添加体力值消耗的包装器函数
    async withEnergyCost(cost: number, action: () => Promise<void>): Promise<void> {
      if (!this.checkEnergy(cost)) {
        return;
      }
      await action();
      this.consumeEnergy(cost);
    },

    // 检查并触发湖边解锁
    // 湖边：在河边完成 3 次行动后可解锁
    checkUnlockProgress() {
      const scenes = useScenesStore();
      if (!scenes.unlockedScenes.includes('lakeside') && this.riverActionCount >= LAKESIDE_UNLOCK_THRESHOLD) {
        scenes.unlockScene('lakeside');
        const msg = '顺着河流深入，前方视野开阔，出现了一片波光粼粼的湖泊…';
        toast({ message: msg, type: 'info' });
        useGameLogStore().addEntry({
          text: msg,
          type: 'ACTION',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
      }
    },

    // 钓鱼：60% 概率获得 1-2 条鱼，40% 概率失败
    async fishInRiver() {
      // 检查是否有鱼竿
      const inventory = useInventoryStore();
      if (!inventory.hasEnough('fishing_rod', 1)) {
        toast({ message: '需要鱼竿才能钓鱼，请先制作一根鱼竿', type: 'warning' });
        return;
      }

      // 记录行动次数
      this.riverActionCount++;

      if (Math.random() < 0.4) {
        const message = '鱼线动了但没钓上来...';
        toast({ message, type: 'info' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ACTION',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
        this.checkUnlockProgress();
        return;
      }

      try {
        const amount = Math.floor(Math.random() * 2) + 1; // 1-2
        const actualAmount = await getStockAmount(this.scene.stock, 'fish', amount);
        useInventoryStore().addItem({ id: 'fish', type: 'fish', name: '鱼' }, actualAmount);
        const message = `钓到了 ${actualAmount} 条鱼！`;
        toast({ message, type: 'success' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ITEM',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
      } catch {
        const message = '河里的鱼已经被钓光了，等等再来吧';
        toast({ message, type: 'warning' });
      }
      // 检查解锁湖边
      this.checkUnlockProgress();
    },

    // 挖泥：从 stock 获得 1 块黏土
    async digClay() {
      try {
        const actualAmount = await getStockAmount(this.scene.stock, 'clay', 1);
        useInventoryStore().addItem({ id: 'clay', type: 'clay', name: '黏土' }, actualAmount);
        const message = `挖出了 ${actualAmount} 块黏土`;
        toast({ message, type: 'success' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ITEM',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
      } catch {
        const message = '这里的黏土已经挖完了';
        toast({ message, type: 'warning' });
      }
    },

    // 捡石头：从 stock 获得 1-2 块石头
    async gatherStone() {
      try {
        const amount = Math.floor(Math.random() * 2) + 1; // 1-2
        const actualAmount = await getStockAmount(this.scene.stock, 'stone', amount);
        useInventoryStore().addItem({ id: 'stone', type: 'stone', name: '石头' }, actualAmount);
        const message = `捡到了 ${actualAmount} 块石头`;
        toast({ message, type: 'success' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ITEM',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
      } catch {
        const message = '河边没有更多石头了';
        toast({ message, type: 'warning' });
      }
    },

    // 采草药：50% 概率获得 1 株草药，50% 概率失败
    async harvestHerb() {
      if (Math.random() < 0.5) {
        const message = '这次没有找到草药';
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
        const actualAmount = await getStockAmount(this.scene.stock, 'herb', 1);
        useInventoryStore().addItem({ id: 'herb', type: 'herb', name: '草药' }, actualAmount);
        const message = `采集到了 ${actualAmount} 株草药`;
        toast({ message, type: 'success' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ITEM',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
      } catch {
        const message = '河边的草药已经被采完了';
        toast({ message, type: 'warning' });
      }
    },

    // 洗澡：hygiene +30，mood +10，无需 stock
    async bathe() {
      const character = useCharacterStore();
      character.hygiene = Math.min(100, character.hygiene + 30);
      character.mood = Math.min(100, character.mood + 10);
      const message = '在河边痛快地洗了个澡，神清气爽！卫生度 +30，心情 +10';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'SYSTEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 精准钓鱼（渔屋建筑动作）：80% 概率获得 2-4 条鱼，额外 20% 概率获得稀有鱼
    async precisionFish() {
      // 检查是否有鱼竿
      if (!useInventoryStore().hasEnough('fishing_rod', 1)) {
        toast({ message: '需要鱼竿才能钓鱼，请先制作一根鱼竿', type: 'warning' });
        return;
      }

      if (Math.random() < 0.2) {
        const message = '今天鱼不上钩，没钓到';
        toast({ message, type: 'info' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ACTION',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
        return;
      }

      const gained: string[] = [];
      const inventory = useInventoryStore();

      try {
        const amount = Math.floor(Math.random() * 3) + 2; // 2-4
        const actualAmount = await getStockAmount(this.scene.stock, 'fish', amount);
        inventory.addItem({ id: 'fish', type: 'fish', name: '鱼' }, actualAmount);
        gained.push(`${actualAmount} 条鱼`);
      } catch {
        toast({ message: '河里的鱼已经被钓光了', type: 'warning' });
        return;
      }

      // 20% 概率额外获得稀有鱼
      if (Math.random() < 0.2) {
        inventory.addItem({ id: 'rare_fish', type: 'rare_fish', name: '稀有鱼' }, 1);
        gained.push('1 条稀有鱼');
      }

      const message = `精准钓鱼成功！获得了 ${gained.join('、')}`;
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'ITEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 制作草药包（草药园建筑动作）：需要 herb×3，产出 1 个 herb_pack
    async makeHerbPack() {
      const inventory = useInventoryStore();
      if (!inventory.hasEnough('herb', 3)) {
        toast({ message: '需要 草药 ×3 才能制作草药包', type: 'warning' });
        return;
      }
      inventory.removeItem('herb', 3);
      inventory.addItem({ id: 'herb_pack', type: 'herb_pack', name: '草药包' }, 1);
      const message = '将草药加工成了 1 个草药包';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'ITEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 建造建筑
    async build(recipeType: string) {
      const recipe = RIVER_BUILDING_RECIPES.find(r => r.type === recipeType);
      if (!recipe) return;

      // 检查是否已建造
      if (this.scene.buildings.some(b => b.type === recipeType)) {
        toast({ message: '该建筑已经建好了', type: 'warning' });
        return;
      }

      const inventory = useInventoryStore();

      // 检查材料是否足够
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

      // 扣除材料
      for (const [resourceType, required] of Object.entries(recipe.cost)) {
        inventory.removeItem(resourceType, required);
      }

      // 添加建筑（带图标）
      this.scene.buildings.push({
        name: recipe.name,
        type: recipe.type,
        level: 1,
        icon: RIVER_BUILDING_ICONS[recipe.type]
      });
      toast({ message: `${recipe.name}建造成功！`, type: 'success' });
    },

    // 获取建筑动作（根据建筑类型返回对应动作列表）
    getBuildingActions(buildingType: string): GameBuildingAction[] {
      switch (buildingType) {
        case 'fishingHut':
          return [
            {
              name: 'precisionFish',
              text: '精准钓鱼',
              icon: '🐟',
              duration: 1.5,
              energyCost: 8,
              handler: async () => await this.withEnergyCost(8, async () => await this.precisionFish()),
              tooltip: '渔屋加持，更高概率钓到更多鱼'
            }
          ];
        case 'waterWheel':
          // 水车无手动动作，通过 hour-passed 事件自动触发
          return [];
        case 'herbGarden':
          return [
            {
              name: 'makeHerbPack',
              text: '制作草药包',
              icon: '💊',
              duration: 1.5,
              energyCost: 5,
              handler: async () => await this.withEnergyCost(5, async () => await this.makeHerbPack()),
              tooltip: '需要草药 ×3'
            }
          ];
        default:
          return [];
      }
    },

    // 获取场景基础动作
    getActionConfig() {
      const character = useCharacterStore();
      return [
        {
          name: 'fishInRiver',
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
            if (character.energy < 6) {
              toast({ message: '体力不足，无法钓鱼', type: 'warning' });
              return false;
            }
            character.energy = Math.max(0, character.energy - 6);
            return true;
          },
          disabled: () => !useInventoryStore().hasEnough('fishing_rod', 1),
          tooltip: '需要鱼竿才能钓鱼',
          handler: async () => await this.fishInRiver()
        },
        {
          name: 'digClay',
          text: '挖泥',
          icon: '🪣',
          duration: 1,
          energyCost: 8,
          actionGroup: 'scene' as const,
          preExecute: () => {
            if (character.energy < 8) {
              toast({ message: '体力不足，无法挖泥', type: 'warning' });
              return false;
            }
            character.energy = Math.max(0, character.energy - 8);
            return true;
          },
          handler: async () => await this.digClay()
        },
        {
          name: 'gatherStone',
          text: '捡石头',
          icon: '🪨',
          duration: 0.5,
          energyCost: 4,
          actionGroup: 'scene' as const,
          preExecute: () => {
            if (character.energy < 4) {
              toast({ message: '体力不足，无法捡石头', type: 'warning' });
              return false;
            }
            character.energy = Math.max(0, character.energy - 4);
            return true;
          },
          handler: async () => await this.gatherStone()
        },
        {
          name: 'harvestHerb',
          text: '采草药',
          icon: '🌿',
          duration: 1,
          energyCost: 7,
          actionGroup: 'scene' as const,
          preExecute: () => {
            if (character.energy < 7) {
              toast({ message: '体力不足，无法采草药', type: 'warning' });
              return false;
            }
            character.energy = Math.max(0, character.energy - 7);
            return true;
          },
          handler: async () => await this.harvestHerb()
        },
        {
          name: 'bathe',
          text: '洗澡',
          icon: '🛁',
          duration: 1.5,
          energyCost: 0,
          actionGroup: 'scene' as const,
          handler: async () => await this.bathe()
        }
      ];
    },

    initializeScene() {
      this.scene.actions = this.getActionConfig();

      // 初始化场景时设置默认库存
      if (!this.scene.stock) {
        this.scene.stock = JSON.parse(JSON.stringify(INITIAL_STOCK));
      }

      // 注册水车小时监听（防止重复注册）
      if (!this._waterWheelListenerRegistered) {
        this._waterWheelListenerRegistered = true;
        emitter.on('hour-passed', () => {
          const waterWheelIndex = this.scene.buildings.findIndex(b => b.type === 'waterWheel');
          if (waterWheelIndex === -1) {
            this.waterWheelHoursElapsed = 0;
            return;
          }
          this.waterWheelHoursElapsed++;
          if (this.waterWheelHoursElapsed >= 6) {
            this.waterWheelHoursElapsed = 0;

            // 每 6 小时恢复 fish +5, herb +3（但不超过 max）
            const fishStock = this.scene.stock['fish'];
            if (fishStock) {
              fishStock.current = Math.min(fishStock.max, fishStock.current + 5);
            }
            const herbStock = this.scene.stock['herb'];
            if (herbStock) {
              herbStock.current = Math.min(herbStock.max, herbStock.current + 3);
            }

            toast({ message: '水车运转，河边的鱼群和草药已自动补充', type: 'info' });
            useGameLogStore().addEntry({
              text: '水车运转，河边的鱼群和草药已自动补充',
              type: 'SYSTEM',
              gameTimestamp: useTimeStore().timestamp,
              timestamp: Date.now()
            });
          }
        });
      }
    }
  },

  persist: {
    omit: ['_waterWheelListenerRegistered']
  }
});
