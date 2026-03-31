import { defineStore } from 'pinia';
import type { GameScene, GameBuildingRecipe, GameBuildingAction, TrapAnimal } from './types';
import { useEquipmentStore } from '../equipment';
import { useCharacterStore } from '../character';
import { useTimeStore } from '../time';
import { 
  type ResourceInfo, 
  getStockAmount, 
  hasStock, 
  calculateExploreResources 
} from '../../utils/resourceUtils';
import { useInventoryStore } from '../inventory';
import { toast } from '../../utils/toast';
import { useGameLogStore } from '../gameLog';
import { emitter } from '../../utils/eventBus';

// 树林可建造的建筑配方
export const FOREST_BUILDING_RECIPES: GameBuildingRecipe[] = [
  {
    type: 'woodenHut',
    name: '木屋',
    description: '提供庇护所，可以休息恢复体力',
    cost: { wood: 20, branch: 5 },
    duration: 1.5,
    energyCost: 20
  },
  {
    type: 'trap',
    name: '陷阱',
    description: '自动捕捉小动物，提供食物',
    cost: { branch: 3 },
    duration: 0.5,
    energyCost: 4
  }
];

// 建筑图标映射
export const FOREST_BUILDING_ICONS: Record<string, string> = {
  woodenHut: '🏠',
  trap: '🪤'
};

// 树林陷阱修复消耗（建造消耗 branch:3）
const TRAP_REPAIR_COST: Record<string, number> = { branch: 2 };
// 树林陷阱摧毁回收材料
const TRAP_DESTROY_RETURN: Record<string, number> = { branch: 1 };

// 树林陷阱触发间隔（毫秒），对应约6个游戏小时
const FOREST_TRAP_INTERVAL_MS = 60000;
// 树林陷阱捕获概率
const FOREST_TRAP_CATCH_CHANCE = 0.7;
// 树林陷阱可捕获的动物列表
const FOREST_TRAP_ANIMALS: TrapAnimal[] = [
  { id: 'rabbit', name: '兔子', yields: [{ id: 'raw_meat', name: '生肉', count: 1 }, { id: 'fur', name: '皮毛', count: 1 }] },
  { id: 'bird', name: '小鸟', yields: [{ id: 'raw_meat', name: '生肉', count: 1 }] }
];

const RESOURCE_NAMES: { [key: string]: string } = {
  wood: '木材',
  ore: '矿石',
  branch: '树枝',
  apple: '苹果',
  berry: '浆果'
};

const INITIAL_STOCK = {
  wood: {
    current: 50,
    max: 50
  },
  ore: {
    current: 30,
    max: 30
  },
  branch: {
    current: 40,
    max: 40
  },
  apple: {
    current: 20,
    max: 20
  },
  berry: {
    current: 30,
    max: 30
  }
} as const;

const FOREST_RESOURCES: readonly ResourceInfo[] = [
  { id: 'branch', type: 'branch', name: '树枝' },
  { id: 'ore', type: 'ore', name: '矿石' }
];

const FOOD_GATHER_FAILURE_RATE = 0.4;

export const useForestSceneStore = defineStore('forestScene', {
  state: () => ({
    scene: {
      id: 'forest',
      name: '树林',
      actions: [],
      buildings: [],
      stock: JSON.parse(JSON.stringify(INITIAL_STOCK))
    } as GameScene,
    _trapListenerRegistered: false
  }),

  getters: {
    actions: (state) => state.scene.actions,
    buildingRecipes: (): GameBuildingRecipe[] => FOREST_BUILDING_RECIPES
  },

  actions: {
    reset() {
      // 重置建筑
      this.scene.buildings = []
      
      // 重置库存到初始状态
      this.scene.stock = JSON.parse(JSON.stringify(INITIAL_STOCK))

      // 重置动作列表
      this.scene.actions = []
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

    async chopWood() {
      const equipment = useEquipmentStore();
      if (!equipment.useAxe()) {
        return;
      }

      try {
        await getStockAmount(this.scene.stock, 'wood');
        const inventory = useInventoryStore();
        inventory.addItem({ id: 'wood', type: 'wood', name: '木材' }, 1);
        toast({ 
          message: "获得了一个木材", 
          type: "success" 
        });
        useGameLogStore().addEntry({
          text: '获得了一个木材',
          type: 'ITEM',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });

        // 如果库存耗尽，发出提示
        if (!hasStock(this.scene.stock, 'wood')) {
          toast({ 
            message: "这片区域的树木已经被砍伐殆尽了", 
            type: "warning" 
          });
        }
      } catch (error) {
        toast({ 
          message: "这里已经没有可以砍伐的树木了", 
          type: "error" 
        });
      }
    },

    async explore() {
      // 计算本次探索可能获得的资源
      const selectedResources = calculateExploreResources(this.scene.stock, FOREST_RESOURCES);

      if (selectedResources.length === 0) {
        toast({ 
          message: "探索了一圈，但是什么都没有发现", 
          type: "info" 
        });
        useGameLogStore().addEntry({
          text: '探索了一圈，但是什么都没有发现',
          type: 'ACTION',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
        return;
      }

      const gainedResources: string[] = [];
      const inventory = useInventoryStore();

      // 处理每种被选中的资源
      for (const resource of selectedResources) {
        try {
          // 尝试获取资源
          const amount = await getStockAmount(this.scene.stock, resource.type, resource.expectedAmount);

          // 写入全局背包
          inventory.addItem(resource, amount);
          gainedResources.push(`${amount}个${resource.name}`);
        } catch (error) {
          continue;
        }
      }

      if (gainedResources.length === 0) {
        toast({ 
          message: "探索了一圈，但是什么都没有发现", 
          type: "info" 
        });
        useGameLogStore().addEntry({
          text: '探索了一圈，但是什么都没有发现',
          type: 'ACTION',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
        return;
      }
      const resourcesText = gainedResources.join('、');
      toast({ 
        message: `探索发现了${resourcesText}`, 
        type: "success" 
      });
      useGameLogStore().addEntry({
        text: `探索发现了${resourcesText}`,
        type: 'ITEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    async mineOre() {
      const equipment = useEquipmentStore();
      if (!equipment.usePickaxe()) {
        return;
      }

      try {
        await getStockAmount(this.scene.stock, 'ore');
        const inventory = useInventoryStore();
        inventory.addItem({ id: 'ore', type: 'ore', name: '矿石' }, 1);
        toast({ 
          message: "获得了一块矿石", 
          type: "success" 
        });
        useGameLogStore().addEntry({
          text: '获得了一块矿石',
          type: 'ITEM',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
        // 如果库存耗尽，发出提示
        if (!hasStock(this.scene.stock, 'ore')) {
          toast({ 
            message: "这片区域的矿石已经被开采殆尽了", 
            type: "warning" 
          });
        }
      } catch (error) {
        toast({ 
          message: "这里已经没有可以开采的矿石了", 
          type: "error" 
        });
      }
    },

    async gatherFood() {
      // 60% 概率找到食物，40% 概率一无所获
      if (Math.random() < FOOD_GATHER_FAILURE_RATE) {
        toast({
          message: '找了一圈，没有发现可以吃的东西',
          type: 'info'
        });
        useGameLogStore().addEntry({
          text: '找了一圈，没有发现可以吃的东西',
          type: 'ACTION',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
        return;
      }

      const gathered: string[] = [];
      const inventory = useInventoryStore();

      // 尝试采集苹果
      try {
        const appleAmount = await getStockAmount(this.scene.stock, 'apple', 2);
        inventory.addItem({ id: 'apple', type: 'apple', name: '苹果' }, appleAmount);
        gathered.push(`${appleAmount}个苹果`);
      } catch {
        // 苹果库存不足，跳过
      }

      // 尝试采集浆果
      try {
        const berryAmount = await getStockAmount(this.scene.stock, 'berry', 3);
        inventory.addItem({ id: 'berry', type: 'berry', name: '浆果' }, berryAmount);
        gathered.push(`${berryAmount}把浆果`);
      } catch {
        // 浆果库存不足，跳过
      }

      if (gathered.length === 0) {
        toast({
          message: '这片区域的食物已经被采集完了，需要等待自然恢复',
          type: 'warning'
        });
        return;
      }

      toast({
        message: `采集到了${gathered.join('和')}`,
        type: 'success'
      });
      useGameLogStore().addEntry({
        text: `采集到了${gathered.join('和')}`,
        type: 'ITEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 建造建筑
    async build(recipeType: string) {
      const recipe = FOREST_BUILDING_RECIPES.find(r => r.type === recipeType);
      if (!recipe) return;

      // 陷阱允许建造多个，其他建筑只允许建造一个
      if (recipeType !== 'trap' && this.scene.buildings.some(b => b.type === recipeType)) {
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
        icon: FOREST_BUILDING_ICONS[recipe.type]
      });
      toast({ message: `${recipe.name}建造成功！`, type: 'success' });
    },

    // 睡觉（森林木屋建筑动作）
    async sleep() {
      const character = useCharacterStore();
      const SATIETY_COST = 20;
      const ENERGY_RESTORE = 30;
      if (character.satiety <= SATIETY_COST) {
        toast({ message: '太饿了，睡不着...', type: 'warning' });
        return;
      }
      character.satiety = Math.max(0, character.satiety - SATIETY_COST);
      character.energy = Math.min(100, character.energy + ENERGY_RESTORE);
      const message = `睡了一觉，体力恢复了 +${ENERGY_RESTORE}，饱食度 -${SATIETY_COST}`;
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'SYSTEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 获取建筑动作（根据建筑类型返回对应动作列表）
    getBuildingActions(buildingType: string): GameBuildingAction[] {
      switch (buildingType) {
        case 'trap':
          // 陷阱：自动触发，无手动动作（展示状态即可）
          return [];
        case 'woodenHut':
          return [
            {
              name: 'sleep',
              text: '睡觉',
              icon: '🛏️',
              duration: 1.5,
              energyCost: 0,
              handler: async () => await this.sleep(),
              tooltip: '消耗饱食度恢复体力'
            }
          ];
        default:
          return [];
      }
    },

    getActionConfig() {
      const equipment = useEquipmentStore();
      return [
        {
          name: 'chopWood',
          text: '砍伐',
          icon: '🪓',
          duration: 1.5,
          energyCost: 10,
          group: 'gather',
          actionGroup: 'scene' as const,
          handler: async () => await this.withEnergyCost(10, async () => await this.chopWood()),
          disabled: equipment.slots.mainHand !== 'axe' && equipment.axeCount === 0,
          tooltip: '需要斧头才能砍伐'
        },
        {
          name: 'mineOre',
          text: '采矿',
          icon: '⛏️',
          duration: 1,
          energyCost: 12,
          group: 'gather',
          actionGroup: 'scene' as const,
          handler: async () => await this.withEnergyCost(12, async () => await this.mineOre()),
          disabled: equipment.slots.mainHand !== 'pickaxe' && equipment.pickaxeCount === 0,
          tooltip: '需要石镐才能采矿'
        },
        {
          name: 'gatherFood',
          text: '觅食',
          icon: '🍎',
          duration: 1,
          energyCost: 5,
          group: 'gather',
          actionGroup: 'scene' as const,
          handler: async () => await this.withEnergyCost(5, async () => await this.gatherFood())
        },
        {
          name: 'explore',
          text: '探索',
          icon: '🔍',
          duration: 1,
          energyCost: 8,
          actionGroup: 'scene' as const,
          handler: async () => await this.withEnergyCost(8, async () => await this.explore())
        }
      ];
    },

    // 修复陷阱：消耗资源清除损坏状态
    repairTrap(building: import('./types').GameBuilding) {
      const inventory = useInventoryStore();
      const missing: string[] = [];
      for (const [res, amount] of Object.entries(TRAP_REPAIR_COST)) {
        if (!inventory.hasEnough(res, amount)) {
          missing.push(`${RESOURCE_NAMES[res] ?? res}×${amount}`);
        }
      }
      if (missing.length > 0) {
        toast({ message: `修复需要：${missing.join('、')}`, type: 'warning' });
        return;
      }
      for (const [res, amount] of Object.entries(TRAP_REPAIR_COST)) {
        inventory.removeItem(res, amount);
      }
      building.trapDamaged = false;
      building.trapCapturedAt = Date.now();
      toast({ message: '陷阱已修复，重新开始等待猎物', type: 'success' });
      useGameLogStore().addEntry({
        text: '修复了陷阱，重新开始等待猎物',
        type: 'ACTION',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 摧毁陷阱：删除建筑，回收部分材料
    destroyTrap(building: import('./types').GameBuilding) {
      const inventory = useInventoryStore();
      for (const [res, amount] of Object.entries(TRAP_DESTROY_RETURN)) {
        inventory.addItem({ id: res, type: res, name: RESOURCE_NAMES[res] ?? res }, amount);
      }
      const idx = this.scene.buildings.indexOf(building);
      if (idx !== -1) this.scene.buildings.splice(idx, 1);
      const returnText = Object.entries(TRAP_DESTROY_RETURN)
        .map(([res, amt]) => `${RESOURCE_NAMES[res] ?? res}×${amt}`)
        .join('、');
      toast({ message: `陷阱已摧毁，回收了 ${returnText}`, type: 'info' });
      useGameLogStore().addEntry({
        text: `摧毁了陷阱，回收了 ${returnText}`,
        type: 'ACTION',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    initializeScene() {
      this.scene.actions = this.getActionConfig();

      // 初始化场景时设置默认库存
      if (!this.scene.stock) {
        this.scene.stock = JSON.parse(JSON.stringify(INITIAL_STOCK));
      }

      // 注册陷阱小时监听（防止重复注册）
      if (!this._trapListenerRegistered) {
        this._trapListenerRegistered = true;
        emitter.on('hour-passed', () => {
          const traps = this.scene.buildings.filter(b => b.type === 'trap');
          if (traps.length === 0) return;

          const now = Date.now();
          for (const trap of traps) {
            // 已有捕获动物或已损坏，等待玩家处理
            if (trap.trapAnimal || trap.trapDamaged) continue;

            const lastCheck = trap.trapCapturedAt ?? 0;
            if (now - lastCheck < FOREST_TRAP_INTERVAL_MS) continue;

            // 触发陷阱，标记为损坏
            trap.trapCapturedAt = now;
            trap.trapDamaged = true;

            if (Math.random() < FOREST_TRAP_CATCH_CHANCE) {
              // 成功捕获
              const animal = FOREST_TRAP_ANIMALS[Math.floor(Math.random() * FOREST_TRAP_ANIMALS.length)];
              trap.trapAnimal = animal;
              toast({ message: `陷阱捕获了一只${animal.name}！陷阱已损坏，需要修复才能继续使用`, type: 'success' });
              useGameLogStore().addEntry({
                text: `陷阱捕获了一只${animal.name}！`,
                type: 'ITEM',
                gameTimestamp: useTimeStore().timestamp,
                timestamp: Date.now()
              });
            } else {
              // 失败，一无所获
              toast({ message: '陷阱被触发了，但什么都没抓到，陷阱已损坏', type: 'info' });
              useGameLogStore().addEntry({
                text: '陷阱被触发了，但什么都没抓到，陷阱已损坏',
                type: 'ACTION',
                gameTimestamp: useTimeStore().timestamp,
                timestamp: Date.now()
              });
            }
          }
        });
      }
    }
  },

  persist: {
    omit: ['_trapListenerRegistered']
  }
})
