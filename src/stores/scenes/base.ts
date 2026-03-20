import { defineStore } from 'pinia';
import { computed } from 'vue';
import type { GameScene, GameBuildingRecipe } from './types';
import { useEquipmentStore } from '../equipment';
import { useCharacterStore } from '../character';
import { useScenesStore } from '../scenes';
import { getOrCreateResource } from '../../utils/resourceUtils';
import { toast } from '../../utils/toast';

// 基地可建造的建筑配方
export const BASE_BUILDING_RECIPES: GameBuildingRecipe[] = [
  {
    type: 'campfire',
    name: '篝火',
    description: '提供温暖和光源',
    cost: { branch: 5 },
    duration: 1,
    energyCost: 10
  },
  {
    type: 'cookingTable',
    name: '烹饪台',
    description: '可以烹饪各种食物',
    cost: { wood: 8, ore: 3 },
    duration: 2,
    energyCost: 20
  },
  {
    type: 'storageBox',
    name: '储藏箱',
    description: '增加物品储存空间',
    cost: { wood: 10 },
    duration: 2,
    energyCost: 15
  }
];

const RESOURCE_NAMES: { [key: string]: string } = {
  wood: '木材',
  ore: '矿石',
  branch: '树枝',
  apple: '苹果'
};

// 树林解锁保底次数：最多探索此次数后必定解锁
const FOREST_UNLOCK_PITY_THRESHOLD = 3;
// 每次探索时随机提前解锁树林的概率
const FOREST_UNLOCK_CHANCE = 0.5;

// 定义基地初始库存
const INITIAL_STOCK = {
  wood: {
    current: 0,
    max: 100
  },
  ore: {
    current: 0,
    max: 100
  },
  branch: {
    current: 0,
    max: 100
  }
} as const;

export const useBaseSceneStore = defineStore('baseScene', {
  state: () => ({
    exploreCount: 0,
    scene: {
      id: 'base',
      name: '基地',
      resources: [],
      actions: [],
      buildings: [],
      stock: JSON.parse(JSON.stringify(INITIAL_STOCK))
    } as GameScene
  }),

  getters: {
    resources: (state) => state.scene.resources,
    actions: (state) => state.scene.actions,
    buildingRecipes: (): GameBuildingRecipe[] => BASE_BUILDING_RECIPES
  },

  actions: {
    // 重置场景状态
    reset() {
      // 清空已收集的资源
      this.scene.resources = []

      // 重置建筑
      this.scene.buildings = []

      // 重置库存到初始状态
      this.scene.stock = JSON.parse(JSON.stringify(INITIAL_STOCK))

      // 重置探索计数
      this.exploreCount = 0

      // 重置动作列表，然后重新初始化
      this.scene.actions = []
      this.initializeScene()
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
    },    // 探索
    async explore() {
      const scenes = useScenesStore();

      // 随机事件和发现的处理
      const eventRoll = Math.random();

      if (scenes.unlockedScenes.includes('forest')) {
        // 树林已解锁：30%概率发现资源，70%普通消息
        if (eventRoll < 0.3) {
          const resources = ['branch', 'ore'];
          const resourceType = resources[Math.floor(Math.random() * resources.length)];
          const amount = Math.floor(Math.random() * 2) + 1; // 1-2个

          const resource = getOrCreateResource(this.scene.resources, {
            id: resourceType,
            type: resourceType,
            name: resourceType === 'branch' ? '树枝' : '矿石'
          });
          resource.count += amount;

          const message = `在附近发现了${amount}个${resource.name}！`;
          toast({
            message,
            type: 'success'
          });
        } else {
          const messages = [
            "四周很安静，什么特别的都没有发现。",
            "在附近转了转，风景不错。",
            "周围一切如常。",
            "这个地方好像已经很熟悉了。"
          ];
          const message = messages[Math.floor(Math.random() * messages.length)];
          toast({
            message,
            type: 'info'
          });
        }
      } else {
        // 树林未解锁：保底机制
        this.exploreCount++;
        if (this.exploreCount >= FOREST_UNLOCK_PITY_THRESHOLD || eventRoll < FOREST_UNLOCK_CHANCE) {
          // 第3次必定解锁，或随机提前解锁
          scenes.unlockScene('forest');
          this.exploreCount = 0;
          toast({
            message: "在远处发现了一片茂密的树林，看起来那里会有不少资源...",
            type: 'info'
          });
        } else {
          // 未触发解锁：30%概率发现少量资源，否则普通消息
          const resourceRoll = Math.random();
          if (resourceRoll < 0.3) {
            const resources = ['branch', 'ore'];
            const resourceType = resources[Math.floor(Math.random() * resources.length)];
            const amount = Math.floor(Math.random() * 2) + 1;

            const resource = getOrCreateResource(this.scene.resources, {
              id: resourceType,
              type: resourceType,
              name: resourceType === 'branch' ? '树枝' : '矿石'
            });
            resource.count += amount;

            toast({
              message: `在附近发现了${amount}个${resource.name}！`,
              type: 'success'
            });
          } else {
            const messages = [
              "四周很安静，什么特别的都没有发现。",
              "在附近转了转，风景不错。",
              "周围一切如常。",
              "这个地方好像已经很熟悉了。"
            ];
            const message = messages[Math.floor(Math.random() * messages.length)];
            toast({
              message,
              type: 'info'
            });
          }
        }
      }
    },

    // 建造建筑
    async build(recipeType: string) {
      const recipe = BASE_BUILDING_RECIPES.find(r => r.type === recipeType);
      if (!recipe) return;

      // 检查是否已建造
      if (this.scene.buildings.some(b => b.type === recipeType)) {
        toast({ message: '该建筑已经建好了', type: 'warning' });
        return;
      }

      // 检查材料是否足够
      const missing: string[] = [];
      for (const [resourceType, required] of Object.entries(recipe.cost)) {
        const resource = this.scene.resources.find(r => r.id === resourceType);
        const current = resource?.count ?? 0;
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
        const resource = this.scene.resources.find(r => r.id === resourceType);
        if (resource) resource.count -= required;
      }

      // 添加建筑
      this.scene.buildings.push({ name: recipe.name, type: recipe.type, level: 1 });
      toast({ message: `${recipe.name}建造成功！`, type: 'success' });
    },
    getActionConfig() {
      const equipment = useEquipmentStore();
      return [
        {
          name: 'explore',
          text: '探索',
          duration: 5,
          energyCost: 10,
          handler: async () => await this.withEnergyCost(10, async () => await this.explore())
        }
      ];
    },

    initializeScene() {
      this.scene.actions = this.getActionConfig();
    }
  },

  persist: true
});
