import { defineStore } from 'pinia';
import type { GameScene, GameBuildingRecipe, GameBuildingAction, TrapAnimal } from './types';
import { useCharacterStore } from '../character';
import { useTimeStore } from '../time';
import { useScenesStore } from '../scenes';
import { getStockAmount, hasStock } from '../../utils/resourceUtils';
import { useInventoryStore } from '../inventory';
import { toast } from '../../utils/toast';
import { useGameLogStore } from '../gameLog';
import { emitter } from '../../utils/eventBus';

const RESOURCE_NAMES: { [key: string]: string } = {
  grass: '干草',
  berry: '浆果',
  branch: '树枝'
};

const INITIAL_STOCK = {
  grass: { current: 80, max: 80 },
  berry: { current: 20, max: 20 },
  branch: { current: 25, max: 25 }
} as const;

const FOOD_GATHER_FAILURE_RATE = 0.35;

// 草地行动阈值：在草地完成 3 次行动后，解锁河边
// 含义：走遍草地后发现附近有河流
const RIVER_UNLOCK_THRESHOLD = 3;

// 草地陷阱触发间隔（毫秒）
const GRASSLAND_TRAP_INTERVAL_MS = 70000;
// 草地陷阱捕获概率
const GRASSLAND_TRAP_CATCH_CHANCE = 0.5;
// 草地陷阱可捕获的动物列表（草地以兔子为主）
const GRASSLAND_TRAP_ANIMALS: TrapAnimal[] = [
  { id: 'rabbit', name: '兔子', yields: [{ id: 'raw_meat', name: '生肉', count: 1 }, { id: 'fur', name: '皮毛', count: 1 }] }
];

export const GRASSLAND_BUILDING_RECIPES: GameBuildingRecipe[] = [
  {
    type: 'hayPile',
    name: '干草堆',
    description: '在草地上堆起一个干草堆，可以在此休息，也能储存干草防止被风吹散',
    cost: { grass: 15 },
    duration: 0.5,
    energyCost: 5
  },
  {
    type: 'trap',
    name: '陷阱',
    description: '在草地设置陷阱，草地上兔子较多，有机会捕获兔子',
    cost: { branch: 3 },
    duration: 0.5,
    energyCost: 4
  }
];

export const GRASSLAND_BUILDING_ICONS: Record<string, string> = {
  hayPile: '🌾',
  trap: '🪤'
};

// 草地陷阱修复消耗
const TRAP_REPAIR_COST: Record<string, number> = { branch: 2 };
// 草地陷阱摧毁回收材料
const TRAP_DESTROY_RETURN: Record<string, number> = { branch: 1 };

export const useGrasslandSceneStore = defineStore('grasslandScene', {
  state: () => ({
    scene: {
      id: 'grassland',
      name: '草地',
      actions: [],
      buildings: [],
      stock: JSON.parse(JSON.stringify(INITIAL_STOCK))
    } as GameScene,
    // 草地行动次数计数，达到阈值后解锁河边
    grasslandActionCount: 0,
    _recoveryListenerRegistered: false,
    _trapListenerRegistered: false
  }),

  getters: {
    actions: (state) => state.scene.actions,
    buildingRecipes: (): GameBuildingRecipe[] => GRASSLAND_BUILDING_RECIPES
  },

  actions: {
    reset() {
      this.scene.buildings = [];
      this.scene.stock = JSON.parse(JSON.stringify(INITIAL_STOCK));
      this.grasslandActionCount = 0;
      this.scene.actions = [];
      this._trapListenerRegistered = false;
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

    // 检查并触发河边解锁
    // 河边：在草地完成 3 次行动（采草/觅食）后可解锁
    checkUnlockProgress() {
      const scenes = useScenesStore();
      if (!scenes.unlockedScenes.includes('river') && this.grasslandActionCount >= RIVER_UNLOCK_THRESHOLD) {
        scenes.unlockScene('river');
        const msg = '穿越草地时，远处隐约听到了潺潺的水声，顺着声音走去，发现了一条清澈的小河…';
        toast({ message: msg, type: 'info' });
        useGameLogStore().addEntry({
          text: msg,
          type: 'ACTION',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
      }
    },

    async gatherGrass() {
      // 记录行动次数
      this.grasslandActionCount++;

      try {
        const amount = Math.floor(Math.random() * 3) + 1; // 1-3
        const actualAmount = await getStockAmount(this.scene.stock, 'grass', amount);
        useInventoryStore().addItem({ id: 'grass', type: 'grass', name: RESOURCE_NAMES.grass }, actualAmount);
        const message = `采集了 ${actualAmount} 把干草`;
        toast({ message, type: 'success' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ITEM',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
        if (!hasStock(this.scene.stock, 'grass')) {
          toast({ message: '草地上的干草暂时被采光了，稍后会慢慢恢复', type: 'warning' });
        }
      } catch {
        toast({ message: '草地上暂时没有更多干草了，稍等片刻会自然恢复', type: 'warning' });
      }

      this.checkUnlockProgress();
    },

    async gatherFood() {
      // 记录行动次数
      this.grasslandActionCount++;

      if (Math.random() < FOOD_GATHER_FAILURE_RATE) {
        const message = '翻找了一会儿，没有发现可以吃的东西';
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
        toast({ message: '草地上的浆果已经采完了，稍等会自然恢复', type: 'warning' });
      }

      this.checkUnlockProgress();
    },

    getBuildingActions(buildingType: string): GameBuildingAction[] {
      const character = useCharacterStore();
      switch (buildingType) {
        case 'hayPile':
          return [
            {
              name: 'restOnHay',
              text: '休息',
              icon: '💤',
              duration: 1,
              energyCost: 0,
              handler: async () => {
                const ENERGY_RESTORE = 15;
                character.energy = Math.min(100, character.energy + ENERGY_RESTORE);
                const message = `在干草堆上休息了一会儿，体力恢复了 +${ENERGY_RESTORE}`;
                toast({ message, type: 'success' });
                useGameLogStore().addEntry({
                  text: message,
                  type: 'SYSTEM',
                  gameTimestamp: useTimeStore().timestamp,
                  timestamp: Date.now()
                });
              }
            }
          ];
        case 'trap':
          return [];
        default:
          return [];
      }
    },

    async build(recipeType: string) {
      const recipe = GRASSLAND_BUILDING_RECIPES.find(r => r.type === recipeType);
      if (!recipe) return;

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

      // 添加建筑
      this.scene.buildings.push({
        name: recipe.name,
        type: recipe.type,
        level: 1,
        icon: GRASSLAND_BUILDING_ICONS[recipe.type]
      });
      toast({ message: `${recipe.name}建造成功！`, type: 'success' });

      // 建造完成后刷新动作列表
      this.scene.actions = this.getActionConfig();
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

    getActionConfig() {
      const character = useCharacterStore();
      return [
        {
          name: 'gatherGrass',
          text: '采干草',
          icon: '🌱',
          duration: 0.5,
          energyCost: 3,
          actionGroup: 'scene' as const,
          preExecute: () => {
            if (character.energy < 3) {
              toast({ message: '体力不足，无法采干草', type: 'warning' });
              return false;
            }
            character.energy = Math.max(0, character.energy - 3);
            return true;
          },
          handler: async () => await this.gatherGrass()
        },
        {
          name: 'gatherFood',
          text: '觅食',
          icon: '🫐',
          duration: 1,
          energyCost: 5,
          actionGroup: 'scene' as const,
          preExecute: () => {
            if (character.energy < 5) {
              toast({ message: '体力不足，无法觅食', type: 'warning' });
              return false;
            }
            character.energy = Math.max(0, character.energy - 5);
            return true;
          },
          handler: async () => await this.gatherFood()
        }
      ];
    },

    initializeScene() {
      this.scene.actions = this.getActionConfig();
      if (!this.scene.stock) {
        this.scene.stock = JSON.parse(JSON.stringify(INITIAL_STOCK));
      }

      // 注册资源自动恢复监听（防止重复注册）
      // 每游戏小时：草 +2、浆果 +1（不超过最大值）
      if (!this._recoveryListenerRegistered) {
        this._recoveryListenerRegistered = true;
        emitter.on('hour-passed', () => {
          const stock = this.scene.stock;
          // 干草每小时恢复2把（草地是干草的主要来源，恢复较快）
          if (stock.grass && stock.grass.current < stock.grass.max) {
            stock.grass.current = Math.min(stock.grass.max, stock.grass.current + 2);
          }
          // 浆果每2小时恢复1个（随机）
          if (stock.berry && stock.berry.current < stock.berry.max && Math.random() < 0.5) {
            stock.berry.current = Math.min(stock.berry.max, stock.berry.current + 1);
          }
          // 树枝每小时恢复1个
          if (stock.branch && stock.branch.current < stock.branch.max) {
            stock.branch.current = Math.min(stock.branch.max, stock.branch.current + 1);
          }
        });
      }

      // 注册草地陷阱监听（防止重复注册）
      if (!this._trapListenerRegistered) {
        this._trapListenerRegistered = true;
        emitter.on('hour-passed', () => {
          const trapBuildings = this.scene.buildings.filter(b => b.type === 'trap');
          if (trapBuildings.length === 0) return;

          const now = Date.now();
          for (const trap of trapBuildings) {
            if (trap.trapAnimal || trap.trapDamaged) continue;

            const lastCheck = trap.trapCapturedAt ?? 0;
            if (now - lastCheck < GRASSLAND_TRAP_INTERVAL_MS) continue;

            trap.trapCapturedAt = now;
            trap.trapDamaged = true;

            if (Math.random() < GRASSLAND_TRAP_CATCH_CHANCE) {
              const animal = GRASSLAND_TRAP_ANIMALS[Math.floor(Math.random() * GRASSLAND_TRAP_ANIMALS.length)];
              trap.trapAnimal = animal;
              toast({ message: `陷阱捕获了一只${animal.name}！陷阱已损坏，需要修复才能继续使用`, type: 'success' });
              useGameLogStore().addEntry({
                text: `陷阱捕获了一只${animal.name}！`,
                type: 'ITEM',
                gameTimestamp: useTimeStore().timestamp,
                timestamp: Date.now()
              });
            } else {
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
    omit: ['_recoveryListenerRegistered', '_trapListenerRegistered']
  }
});
