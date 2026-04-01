import { defineStore } from 'pinia';
import type { GameScene, GameBuildingRecipe, GameBuildingAction } from './types';
import { useCharacterStore } from '../character';
import { useTimeStore } from '../time';
import { useScenesStore } from '../scenes';
import { getStockAmount, hasStock } from '../../utils/resourceUtils';
import { useInventoryStore } from '../inventory';
import { toast } from '../../utils/toast';
import { useGameLogStore } from '../gameLog';
import { emitter } from '../../utils/eventBus';

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

// 草地行动阈值：在草地完成 3 次行动后，解锁河边
// 含义：走遍草地后发现附近有河流
const RIVER_UNLOCK_THRESHOLD = 3;

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
    _recoveryListenerRegistered: false
  }),

  getters: {
    actions: (state) => state.scene.actions,
    buildingRecipes: (): GameBuildingRecipe[] => []
  },

  actions: {
    reset() {
      this.scene.buildings = [];
      this.scene.stock = JSON.parse(JSON.stringify(INITIAL_STOCK));
      this.grasslandActionCount = 0;
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
        const message = `采集了 ${actualAmount} 把草`;
        toast({ message, type: 'success' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ITEM',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
        if (!hasStock(this.scene.stock, 'grass')) {
          toast({ message: '草地上的草暂时被采光了，稍后会慢慢恢复', type: 'warning' });
        }
      } catch {
        toast({ message: '草地上暂时没有更多草了，稍等片刻会自然恢复', type: 'warning' });
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

    getBuildingActions(_buildingType: string): GameBuildingAction[] {
      return [];
    },

    getActionConfig() {
      const character = useCharacterStore();
      return [
        {
          name: 'gatherGrass',
          text: '采草',
          icon: '🌱',
          duration: 0.5,
          energyCost: 3,
          actionGroup: 'scene' as const,
          preExecute: () => {
            if (character.energy < 3) {
              toast({ message: '体力不足，无法采草', type: 'warning' });
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
          // 草每小时恢复2把（草地是草的主要来源，恢复较快）
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
    }
  },

  persist: {
    omit: ['_recoveryListenerRegistered']
  }
});
