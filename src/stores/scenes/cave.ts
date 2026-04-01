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

// 山洞可建造的建筑配方
export const CAVE_BUILDING_RECIPES: GameBuildingRecipe[] = [
  {
    type: 'minersLodge',
    name: '矿工营地',
    description: '在山洞口扎营，可以更高效地开采资源',
    cost: { wood: 10, stone: 8 },
    duration: 1,
    energyCost: 14
  },
  {
    type: 'smelter',
    name: '熔炉',
    description: '可以将铁矿石冶炼成铁锭',
    cost: { stone: 15, coal: 5 },
    duration: 1.5,
    energyCost: 18
  },
  {
    type: 'crystalAltar',
    name: '水晶祭坛',
    description: '神秘的祭坛，可以放大魔法效果，也许藏有秘密',
    cost: { crystal: 3, stone: 10 },
    duration: 1,
    energyCost: 10
  }
];

// 建筑图标映射
export const CAVE_BUILDING_ICONS: Record<string, string> = {
  minersLodge: '⛺',
  smelter: '🔥',
  crystalAltar: '🌟'
};

const RESOURCE_NAMES: { [key: string]: string } = {
  wood: '木材',
  stone: '石头',
  coal: '煤炭',
  crystal: '水晶',
  iron_ore: '铁矿石'
};

// 定义山洞初始库存
const INITIAL_STOCK = {
  iron_ore: { current: 40, max: 40 },
  crystal: { current: 10, max: 10 },
  coal: { current: 35, max: 35 },
  bone: { current: 20, max: 20 }
} as const;

// 海边解锁阈值：在山洞完成 3 次行动后解锁海边
const SEASIDE_UNLOCK_THRESHOLD = 3;

export const useCaveSceneStore = defineStore('caveScene', {
  state: () => ({
    scene: {
      id: 'cave',
      name: '山洞',
      actions: [],
      buildings: [],
      stock: JSON.parse(JSON.stringify(INITIAL_STOCK))
    } as GameScene,
    // 山洞行动次数计数，达到阈值后解锁海边
    caveActionCount: 0,
    _recoveryListenerRegistered: false
  }),

  getters: {
    actions: (state) => state.scene.actions,
    buildingRecipes: (): GameBuildingRecipe[] => CAVE_BUILDING_RECIPES
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

      // 重置行动计数
      this.caveActionCount = 0
    },

    // 检查并触发海边解锁
    // 海边：在山洞完成 3 次行动后解锁
    checkUnlockProgress() {
      const scenes = useScenesStore();
      if (!scenes.unlockedScenes.includes('seaside') && this.caveActionCount >= SEASIDE_UNLOCK_THRESHOLD) {
        scenes.unlockScene('seaside');
        const msg = '走出山洞，翻过山坡，眼前是一望无际的大海，海风带来咸腥的气息…';
        toast({ message: msg, type: 'info' });
        useGameLogStore().addEntry({
          text: msg,
          type: 'ACTION',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
      }
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

    // 深度挖矿：需要石镐，从 stock 获得 1-2 块铁矿石
    async deepMine() {
      // 记录行动次数并检查海边解锁
      this.caveActionCount++;

      const equipment = useEquipmentStore();
      if (!equipment.usePickaxe()) {
        return;
      }

      try {
        const amount = Math.floor(Math.random() * 2) + 1; // 1-2
        const actualAmount = await getStockAmount(this.scene.stock, 'iron_ore', amount);
        useInventoryStore().addItem({ id: 'iron_ore', type: 'iron_ore', name: '铁矿石' }, actualAmount);
        const message = `挖到了 ${actualAmount} 块铁矿石！`;
        toast({ message, type: 'success' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ITEM',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
      } catch {
        const message = '这里的铁矿石已经被挖光了';
        toast({ message, type: 'warning' });
      }

      this.checkUnlockProgress();
    },

    // 采集煤炭：从 stock 获得 1-3 块煤炭
    async gatherCoal() {
      // 记录行动次数并检查海边解锁
      this.caveActionCount++;

      try {
        const amount = Math.floor(Math.random() * 3) + 1; // 1-3
        const actualAmount = await getStockAmount(this.scene.stock, 'coal', amount);
        useInventoryStore().addItem({ id: 'coal', type: 'coal', name: '煤炭' }, actualAmount);
        const message = `采集到了 ${actualAmount} 块煤炭`;
        toast({ message, type: 'success' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ITEM',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
      } catch {
        const message = '洞里的煤炭已经被采完了';
        toast({ message, type: 'warning' });
      }

      this.checkUnlockProgress();
    },

    // 搜寻宝物：30% 概率获得水晶，20% 概率获得骨头，50% 什么都没有
    async searchTreasure() {
      // 记录行动次数并检查海边解锁
      this.caveActionCount++;

      const roll = Math.random();
      const inventory = useInventoryStore();

      if (roll < 0.3) {
        // 30% 概率获得 1 块水晶
        try {
          const actualAmount = await getStockAmount(this.scene.stock, 'crystal', 1);
          inventory.addItem({ id: 'crystal', type: 'crystal', name: '水晶' }, actualAmount);
          const message = `在黑暗中摸到了一块发光的水晶！`;
          toast({ message, type: 'success' });
          useGameLogStore().addEntry({
            text: message,
            type: 'ITEM',
            gameTimestamp: useTimeStore().timestamp,
            timestamp: Date.now()
          });
        } catch {
          const message = '水晶已经被搜刮一空了';
          toast({ message, type: 'warning' });
        }
      } else if (roll < 0.5) {
        // 20% 概率获得 1-2 块骨头
        try {
          const amount = Math.floor(Math.random() * 2) + 1; // 1-2
          const actualAmount = await getStockAmount(this.scene.stock, 'bone', amount);
          inventory.addItem({ id: 'bone', type: 'bone', name: '骨头' }, actualAmount);
          const message = `发现了 ${actualAmount} 根奇怪的骨头`;
          toast({ message, type: 'success' });
          useGameLogStore().addEntry({
            text: message,
            type: 'ITEM',
            gameTimestamp: useTimeStore().timestamp,
            timestamp: Date.now()
          });
        } catch {
          const message = '骨头似乎已经被搜走了';
          toast({ message, type: 'warning' });
        }
      } else {
        // 50% 什么都没有
        const message = '洞穴深处很黑，什么都没找到';
        toast({ message, type: 'info' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ACTION',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
      }

      // 检查是否解锁海边
      this.checkUnlockProgress();
    },

    // 冥想：mana +20，mood +8
    async meditate() {
      const character = useCharacterStore();
      character.mana = Math.min(100, character.mana + 20);
      character.mood = Math.min(100, character.mood + 8);
      const message = '在山洞中静心冥想，感受到了来自大地的神秘力量。法力 +20，心情 +8';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'SYSTEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 强化采矿（矿工营地建筑动作）：需要石镐，获得 2-4 块铁矿石，额外 40% 概率再获得 1 块水晶
    async enhancedMine() {
      const equipment = useEquipmentStore();
      if (!equipment.usePickaxe()) {
        return;
      }

      const gained: string[] = [];
      const inventory = useInventoryStore();

      try {
        const amount = Math.floor(Math.random() * 3) + 2; // 2-4
        const actualAmount = await getStockAmount(this.scene.stock, 'iron_ore', amount);
        inventory.addItem({ id: 'iron_ore', type: 'iron_ore', name: '铁矿石' }, actualAmount);
        gained.push(`${actualAmount} 块铁矿石`);
      } catch {
        toast({ message: '铁矿石已经被挖完了', type: 'warning' });
        return;
      }

      // 40% 概率额外获得 1 块水晶
      if (Math.random() < 0.4) {
        try {
          const crystalAmount = await getStockAmount(this.scene.stock, 'crystal', 1);
          inventory.addItem({ id: 'crystal', type: 'crystal', name: '水晶' }, crystalAmount);
          gained.push('1 块水晶');
        } catch {
          // 水晶库存不足，跳过
        }
      }

      const message = `强化采矿成功！获得了 ${gained.join('、')}`;
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'ITEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 冶炼铁锭（熔炉建筑动作）：需要 iron_ore×3 + coal×2，产出 1 个铁锭
    async smeltIron() {
      const inventory = useInventoryStore();
      if (!inventory.hasEnough('iron_ore', 3) || !inventory.hasEnough('coal', 2)) {
        toast({ message: '需要铁矿石 ×3 + 煤炭 ×2 才能冶炼铁锭', type: 'warning' });
        return;
      }

      inventory.removeItem('iron_ore', 3);
      inventory.removeItem('coal', 2);
      inventory.addItem({ id: 'iron_ingot', type: 'iron_ingot', name: '铁锭' }, 1);

      const message = '在熔炉中冶炼出了 1 块铁锭！';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'ITEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 祈祷（水晶祭坛建筑动作）：mana +30，health +5
    async pray() {
      const character = useCharacterStore();
      character.mana = Math.min(100, character.mana + 30);
      character.health = Math.min(100, character.health + 5);
      const message = '在水晶祭坛前虔诚祈祷，感受到了神圣的力量。法力 +30，血量 +5';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'SYSTEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 水晶共鸣（水晶祭坛建筑动作）：需要 crystal×1，全属性 +20
    async crystalResonance() {
      const inventory = useInventoryStore();
      if (!inventory.hasEnough('crystal', 1)) {
        toast({ message: '需要水晶 ×1 才能进行水晶共鸣', type: 'warning' });
        return;
      }

      inventory.removeItem('crystal', 1);

      const character = useCharacterStore();
      character.health = Math.min(100, character.health + 20);
      character.energy = Math.min(100, character.energy + 20);
      character.satiety = Math.min(100, character.satiety + 20);
      character.mood = Math.min(100, character.mood + 20);

      const message = '水晶共鸣！全身充满了能量。血量、体力、饱食度、心情各 +20';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'SYSTEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 建造建筑
    async build(recipeType: string) {
      const recipe = CAVE_BUILDING_RECIPES.find(r => r.type === recipeType);
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
        icon: CAVE_BUILDING_ICONS[recipe.type]
      });
      toast({ message: `${recipe.name}建造成功！`, type: 'success' });
    },

    // 获取建筑动作（根据建筑类型返回对应动作列表）
    getBuildingActions(buildingType: string): GameBuildingAction[] {
      switch (buildingType) {
        case 'minersLodge':
          return [
            {
              name: 'enhancedMine',
              text: '强化采矿',
              icon: '🔩',
              duration: 1.5,
              energyCost: 12,
              handler: async () => await this.withEnergyCost(12, async () => await this.enhancedMine()),
              tooltip: '需要石镐，有概率额外获得水晶'
            }
          ];
        case 'smelter':
          return [
            {
              name: 'smeltIron',
              text: '冶炼铁锭',
              icon: '🔥',
              duration: 2,
              energyCost: 10,
              handler: async () => await this.withEnergyCost(10, async () => await this.smeltIron()),
              tooltip: '需要铁矿石 ×3 + 煤炭 ×2'
            }
          ];
        case 'crystalAltar':
          return [
            {
              name: 'pray',
              text: '祈祷',
              icon: '🌟',
              duration: 1,
              energyCost: 0,
              handler: async () => await this.pray()
            },
            {
              name: 'crystalResonance',
              text: '水晶共鸣',
              icon: '💎',
              duration: 1.5,
              energyCost: 0,
              handler: async () => await this.crystalResonance(),
              tooltip: '需要水晶 ×1，全属性 +20'
            }
          ];
        default:
          return [];
      }
    },

    // 获取场景基础动作
    getActionConfig() {
      const equipment = useEquipmentStore();
      const character = useCharacterStore();
      return [
        {
          name: 'deepMine',
          text: '深度挖矿',
          icon: '⛏️',
          duration: 2,
          energyCost: 15,
          actionGroup: 'scene' as const,
          preExecute: () => {
            if (equipment.slots.mainHand !== 'pickaxe' && equipment.pickaxeCount === 0) {
              toast({ message: '需要石镐才能挖矿', type: 'warning' });
              return false;
            }
            if (character.energy < 15) {
              toast({ message: '体力不足，无法深度挖矿', type: 'warning' });
              return false;
            }
            character.energy = Math.max(0, character.energy - 15);
            return true;
          },
          handler: async () => await this.deepMine(),
          disabled: () => equipment.slots.mainHand !== 'pickaxe' && equipment.pickaxeCount === 0,
          tooltip: '需要石镐才能挖矿'
        },
        {
          name: 'gatherCoal',
          text: '采集煤炭',
          icon: '🪨',
          duration: 1.5,
          energyCost: 10,
          actionGroup: 'scene' as const,
          preExecute: () => {
            if (character.energy < 10) {
              toast({ message: '体力不足，无法采集煤炭', type: 'warning' });
              return false;
            }
            character.energy = Math.max(0, character.energy - 10);
            return true;
          },
          handler: async () => await this.gatherCoal()
        },
        {
          name: 'searchTreasure',
          text: '搜寻宝物',
          icon: '🔦',
          duration: 1.5,
          energyCost: 12,
          actionGroup: 'scene' as const,
          preExecute: () => {
            if (character.energy < 12) {
              toast({ message: '体力不足，无法搜寻宝物', type: 'warning' });
              return false;
            }
            character.energy = Math.max(0, character.energy - 12);
            return true;
          },
          handler: async () => await this.searchTreasure()
        },
        {
          name: 'meditate',
          text: '冥想',
          icon: '🧘',
          duration: 1,
          energyCost: 0,
          actionGroup: 'scene' as const,
          handler: async () => await this.meditate()
        }
      ];
    },

    initializeScene() {
      this.scene.actions = this.getActionConfig();

      // 初始化场景时设置默认库存
      if (!this.scene.stock) {
        this.scene.stock = JSON.parse(JSON.stringify(INITIAL_STOCK));
      }

      // 注册山洞资源自然恢复监听（防止重复注册）
      // 每游戏小时：煤炭 +1（不超过最大值）；铁矿和水晶恢复极慢
      if (!this._recoveryListenerRegistered) {
        this._recoveryListenerRegistered = true;
        emitter.on('hour-passed', () => {
          const stock = this.scene.stock;
          // 煤炭每小时 +1
          if (stock.coal && stock.coal.current < stock.coal.max) {
            stock.coal.current = Math.min(stock.coal.max, stock.coal.current + 1);
          }
          // 铁矿石每2小时 +1
          if (stock.iron_ore && stock.iron_ore.current < stock.iron_ore.max && Math.random() < 0.5) {
            stock.iron_ore.current = Math.min(stock.iron_ore.max, stock.iron_ore.current + 1);
          }
        });
      }
    }
  },

  persist: {
    omit: ['_recoveryListenerRegistered']
  }
});
