import { defineStore } from 'pinia';
import type { GameScene, GameAction, GameBuildingRecipe, GameBuildingAction, GameBuildingUpgrade } from './types';
import { useCharacterStore } from '../character';
import { useScenesStore } from '../scenes';
import { useEquipmentStore } from '../equipment';
import { useTimeStore } from '../time';
import { getOrCreateResource } from '../../utils/resourceUtils';
import { toast } from '../../utils/toast';
import { useGameLogStore } from '../gameLog';

// 基地可建造的建筑配方
export const BASE_BUILDING_RECIPES: GameBuildingRecipe[] = [
  {
    type: 'campfire',
    name: '篝火',
    description: '提供温暖和光源，可以烹饪食物',
    cost: { branch: 5 },
    duration: 1,
    energyCost: 7
  },
  {
    type: 'woodenHut',
    name: '木屋',
    description: '提供庇护所，有了木屋可以睡觉恢复体力',
    cost: { wood: 20, branch: 5 },
    duration: 5,
    energyCost: 20
  },
  {
    type: 'workbench',
    name: '工作台',
    description: '可以制作和修理各种工具、装备',
    cost: { wood: 8, ore: 3 },
    duration: 2,
    energyCost: 14
  },
  {
    type: 'storageBox',
    name: '储藏箱',
    description: '增加物品储存空间',
    cost: { wood: 10 },
    duration: 2,
    energyCost: 10
  },
  {
    type: 'farmPlot',
    name: '农田',
    description: '开垦一块小农田，可以种植简单蔬菜',
    cost: { branch: 3, ore: 2 },
    duration: 3,
    energyCost: 12
  },
  {
    type: 'herbShop',
    name: '药铺',
    description: '用草药制作各种药品，恢复体力和健康',
    cost: { wood: 12, branch: 8 },
    duration: 4,
    energyCost: 15
  }
];

// 建筑图标映射
export const BASE_BUILDING_ICONS: Record<string, string> = {
  campfire: '🔥',
  woodenHut: '🏠',
  workbench: '🔨',
  cookingTable: '🍳',
  storageBox: '📦',
  farmPlot: '🌾',
  herbShop: '🏪'
};

// 建筑升级配方（可选，预留字段）
export const BASE_BUILDING_UPGRADES: Record<string, GameBuildingUpgrade[]> = {
  campfire: [
    {
      toLevel: 2,
      cost: { ore: 5, branch: 10 },
      energyCost: 15,
      duration: 10,
      description: '升级为石炉，可以冶炼矿石'
    }
  ],
  storageBox: [
    {
      toLevel: 2,
      cost: { wood: 15 },
      energyCost: 12,
      duration: 8,
      description: '扩容至200格'
    }
  ]
};


const RESOURCE_NAMES: { [key: string]: string } = {
  wood: '木材',
  ore: '矿石',
  branch: '树枝',
  apple: '苹果',
  herb: '草药',
  vegetable: '蔬菜',
  raw_meat: '生肉'
};

// 树林解锁保底次数：最多探索此次数后必定解锁
const FOREST_UNLOCK_PITY_THRESHOLD = 3;
// 每次探索时随机提前解锁树林的概率
const FOREST_UNLOCK_CHANCE = 0.5;

// 河边解锁保底次数
const RIVER_UNLOCK_PITY_THRESHOLD = 3;
// 每次探索时随机提前解锁河边的概率
const RIVER_UNLOCK_CHANCE = 0.4;

// 山洞解锁保底次数
const CAVE_UNLOCK_PITY_THRESHOLD = 5;
// 每次探索时随机提前解锁山洞的概率
const CAVE_UNLOCK_CHANCE = 0.3;

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
    riverUnlockCount: 0,
    caveUnlockCount: 0,
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
      this.riverUnlockCount = 0
      this.caveUnlockCount = 0

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
    },

    // 探索
    async explore() {
      const scenes = useScenesStore();

      // 随机事件和发现的处理
      const eventRoll = Math.random();

      if (scenes.unlockedScenes.includes('forest')) {
        // 树林已解锁，尝试解锁河边
        if (!scenes.unlockedScenes.includes('river')) {
          this.riverUnlockCount++;
          if (this.riverUnlockCount >= RIVER_UNLOCK_PITY_THRESHOLD || eventRoll < RIVER_UNLOCK_CHANCE) {
            scenes.unlockScene('river');
            this.riverUnlockCount = 0;
            const unlockMessage = "沿着山路走了走，远处听到了潺潺的水声，似乎有条河…";
            toast({ message: unlockMessage, type: 'info' });
            useGameLogStore().addEntry({
              text: unlockMessage,
              type: 'ACTION',
              gameTimestamp: useTimeStore().timestamp,
              timestamp: Date.now()
            });
            return;
          }
        } else if (!scenes.unlockedScenes.includes('cave')) {
          // 河边已解锁，尝试解锁山洞
          this.caveUnlockCount++;
          if (this.caveUnlockCount >= CAVE_UNLOCK_PITY_THRESHOLD || eventRoll < CAVE_UNLOCK_CHANCE) {
            scenes.unlockScene('cave');
            this.caveUnlockCount = 0;
            const unlockMessage = "河边的峭壁上似乎有个隐秘的洞口…";
            toast({ message: unlockMessage, type: 'info' });
            useGameLogStore().addEntry({
              text: unlockMessage,
              type: 'ACTION',
              gameTimestamp: useTimeStore().timestamp,
              timestamp: Date.now()
            });
            return;
          }
        }

        // 已解锁所有场景：30%概率发现资源，70%普通消息
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
          useGameLogStore().addEntry({
            text: message,
            type: 'ITEM',
            gameTimestamp: useTimeStore().timestamp,
            timestamp: Date.now()
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
          useGameLogStore().addEntry({
            text: message,
            type: 'ACTION',
            gameTimestamp: useTimeStore().timestamp,
            timestamp: Date.now()
          });
        }
      } else {
        // 树林未解锁：保底机制
        this.exploreCount++;
        if (this.exploreCount >= FOREST_UNLOCK_PITY_THRESHOLD || eventRoll < FOREST_UNLOCK_CHANCE) {
          // 第3次必定解锁，或随机提前解锁
          scenes.unlockScene('forest');
          this.exploreCount = 0;
          const unlockMessage = "在远处发现了一片茂密的树林，看起来那里会有不少资源...";
          toast({
            message: unlockMessage,
            type: 'info'
          });
          useGameLogStore().addEntry({
            text: unlockMessage,
            type: 'ACTION',
            gameTimestamp: useTimeStore().timestamp,
            timestamp: Date.now()
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

            const resourceMessage = `在附近发现了${amount}个${resource.name}！`;
            toast({
              message: resourceMessage,
              type: 'success'
            });
            useGameLogStore().addEntry({
              text: resourceMessage,
              type: 'ITEM',
              gameTimestamp: useTimeStore().timestamp,
              timestamp: Date.now()
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
            useGameLogStore().addEntry({
              text: message,
              type: 'ACTION',
              gameTimestamp: useTimeStore().timestamp,
              timestamp: Date.now()
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

      // 添加建筑（带图标）
      this.scene.buildings.push({
        name: recipe.name,
        type: recipe.type,
        level: 1,
        icon: BASE_BUILDING_ICONS[recipe.type]
      });
      toast({ message: `${recipe.name}建造成功！`, type: 'success' });

      // 建造完成后刷新动作列表
      this.scene.actions = this.getActionConfig();
    },

    // 睡觉：消耗饱食度恢复体力
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

    // 休息：小幅恢复体力（人物动作，随时可用）
    async rest() {
      const character = useCharacterStore();
      const ENERGY_RESTORE = 8;
      character.energy = Math.min(100, character.energy + ENERGY_RESTORE);
      const message = `稍作休息，体力恢复了 +${ENERGY_RESTORE}`;
      toast({ message, type: 'info' });
      useGameLogStore().addEntry({
        text: message,
        type: 'SYSTEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 烤食物（篝火建筑动作）
    async cookFood() {
      const resource = this.scene.resources.find(r => r.id === 'raw_meat');
      if (!resource || resource.count <= 0) {
        toast({ message: '没有生肉可以烤', type: 'warning' });
        return;
      }
      resource.count -= 1;
      const cookedMeat = getOrCreateResource(this.scene.resources, {
        id: 'cooked_meat',
        type: 'cooked_meat',
        name: '熟肉'
      });
      cookedMeat.count += 1;
      const message = '用篝火烤了一块肉，获得了熟肉';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'ITEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 取暖过夜（篝火建筑动作）
    async warmUp() {
      const character = useCharacterStore();
      character.mood = Math.min(100, character.mood + 15);
      const message = '在篝火旁取暖，心情好多了 +15';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'SYSTEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 制作工具（工作台建筑动作）
    async craftTool() {
      const woodRes = this.scene.resources.find(r => r.id === 'wood');
      const oreRes = this.scene.resources.find(r => r.id === 'ore');
      if (!woodRes || woodRes.count < 2 || !oreRes || oreRes.count < 1) {
        toast({ message: '需要木材×2 + 矿石×1 才能制作工具', type: 'warning' });
        return;
      }
      woodRes.count -= 2;
      oreRes.count -= 1;
      const tool = getOrCreateResource(this.scene.resources, {
        id: 'tool',
        type: 'tool',
        name: '工具'
      });
      tool.count += 1;
      const message = '在工作台上制作了一件工具';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'ITEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 种植蔬菜（农田建筑动作）
    async plantVegetable() {
      const branchRes = this.scene.resources.find(r => r.id === 'branch');
      if (!branchRes || branchRes.count < 1) {
        toast({ message: '需要树枝 ×1 才能种植蔬菜', type: 'warning' });
        return;
      }
      branchRes.count -= 1;
      const amount = Math.floor(Math.random() * 2) + 1; // 1-2
      const vegetableResource = getOrCreateResource(this.scene.resources, {
        id: 'vegetable',
        type: 'vegetable',
        name: '蔬菜'
      });
      vegetableResource.count += amount;
      const message = `在农田里种出了 ${amount} 株蔬菜！`;
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'ITEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 制作急救包（药铺建筑动作）
    async makeFirstAid() {
      const herbRes = this.scene.resources.find(r => r.id === 'herb');
      if (!herbRes || herbRes.count < 2) {
        toast({ message: '需要草药 ×2 才能制作急救包', type: 'warning' });
        return;
      }
      herbRes.count -= 2;
      const firstAidResource = getOrCreateResource(this.scene.resources, {
        id: 'first_aid',
        type: 'first_aid',
        name: '急救包'
      });
      firstAidResource.count += 1;
      const message = '用草药制作了 1 个急救包';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'ITEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 制作滋补汤（药铺建筑动作）
    async makeNourishingSoup() {
      const vegetableRes = this.scene.resources.find(r => r.id === 'vegetable');
      const rawMeatRes = this.scene.resources.find(r => r.id === 'raw_meat');
      if (!vegetableRes || vegetableRes.count < 2 || !rawMeatRes || rawMeatRes.count < 1) {
        toast({ message: '需要蔬菜 ×2 + 生肉 ×1 才能制作滋补汤', type: 'warning' });
        return;
      }
      vegetableRes.count -= 2;
      rawMeatRes.count -= 1;
      const soupResource = getOrCreateResource(this.scene.resources, {
        id: 'nourishing_soup',
        type: 'nourishing_soup',
        name: '滋补汤'
      });
      soupResource.count += 1;
      const message = '用蔬菜和生肉炖出了 1 碗滋补汤！';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'ITEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 冥想（人物动作版）：mana +15，mood +10
    async meditateCharacter() {
      const character = useCharacterStore();
      character.mana = Math.min(100, character.mana + 15);
      character.mood = Math.min(100, character.mood + 10);
      const message = '静心冥想，法力和心情都好了不少。法力 +15，心情 +10';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'SYSTEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 整理营地（场景行动）：hygiene +10，mood +5
    async tidyCamp() {
      const character = useCharacterStore();
      character.hygiene = Math.min(100, character.hygiene + 10);
      character.mood = Math.min(100, character.mood + 5);
      const message = '营地整洁了许多。卫生度 +10，心情 +5';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'SYSTEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 自言自语（人物动作）：mood +5
    async talkToSelf() {
      const character = useCharacterStore();
      character.mood = Math.min(100, character.mood + 5);
      const message = '自言自语了一阵子，感觉好多了。心情 +5';
      toast({ message, type: 'info' });
      useGameLogStore().addEntry({
        text: message,
        type: 'SYSTEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 获取人物动作（与场景/建筑无关）
    getCharacterActions(): GameBuildingAction[] {
      return [
        {
          name: 'rest',
          text: '休息',
          icon: '💤',
          duration: 3,
          energyCost: 0,
          actionGroup: 'character',
          handler: async () => await this.rest()
        },
        {
          name: 'meditate',
          text: '冥想',
          icon: '🧘',
          duration: 4,
          energyCost: 0,
          actionGroup: 'character',
          handler: async () => await this.meditateCharacter()
        },
        {
          name: 'talkToSelf',
          text: '自言自语',
          icon: '💬',
          duration: 2,
          energyCost: 0,
          actionGroup: 'character',
          handler: async () => await this.talkToSelf()
        },
        {
          name: 'craftAxe',
          text: '制作石斧',
          icon: '🪓',
          duration: 5,
          energyCost: 8,
          actionGroup: 'character',
          tooltip: '需要树枝×3 + 石头×2',
          handler: async () => {
            const equipment = useEquipmentStore();
            const scenes = useScenesStore();
            const currentResources = scenes.currentScene.resources;
            const branchRes = currentResources.find(r => r.id === 'branch');
            const stoneRes = currentResources.find(r => r.id === 'stone');
            if (!branchRes || branchRes.count < 3 || !stoneRes || stoneRes.count < 2) {
              toast({ message: '需要树枝×3 + 石头×2 才能制作石斧', type: 'warning' });
              return;
            }
            const success = await equipment.craftAxe({ branch: 3, stone: 2 });
            if (success) {
              branchRes.count -= 3;
              stoneRes.count -= 2;
            }
          }
        },
        {
          name: 'craftPickaxe',
          text: '制作石镐',
          icon: '⛏️',
          duration: 5,
          energyCost: 8,
          actionGroup: 'character',
          tooltip: '需要树枝×3 + 石头×2',
          handler: async () => {
            const equipment = useEquipmentStore();
            const scenes = useScenesStore();
            const currentResources = scenes.currentScene.resources;
            const branchRes = currentResources.find(r => r.id === 'branch');
            const stoneRes = currentResources.find(r => r.id === 'stone');
            if (!branchRes || branchRes.count < 3 || !stoneRes || stoneRes.count < 2) {
              toast({ message: '需要树枝×3 + 石头×2 才能制作石镐', type: 'warning' });
              return;
            }
            const success = await equipment.craftPickaxe({ branch: 3, stone: 2 });
            if (success) {
              branchRes.count -= 3;
              stoneRes.count -= 2;
            }
          }
        }
      ];
    },

    // 获取建筑动作（根据建筑类型返回对应动作列表）
    getBuildingActions(buildingType: string): GameBuildingAction[] {
      switch (buildingType) {
        case 'campfire':
          return [
            {
              name: 'cookFood',
              text: '烤食物',
              icon: '🍖',
              duration: 5,
              energyCost: 5,
              handler: async () => await this.withEnergyCost(5, async () => await this.cookFood()),
              tooltip: '需要生肉'
            },
            {
              name: 'warmUp',
              text: '取暖',
              icon: '🌡️',
              duration: 3,
              energyCost: 0,
              handler: async () => await this.warmUp()
            }
          ];
        case 'woodenHut':
          return [
            {
              name: 'sleep',
              text: '睡觉',
              icon: '🛏️',
              duration: 5,
              energyCost: 0,
              handler: async () => await this.sleep(),
              tooltip: '消耗饱食度恢复体力'
            }
          ];
        case 'workbench':
        case 'cookingTable':
          return [
            {
              name: 'craftTool',
              text: '制作工具',
              icon: '🔧',
              duration: 8,
              energyCost: 10,
              handler: async () => await this.withEnergyCost(10, async () => await this.craftTool()),
              tooltip: '需要木材×2 + 矿石×1'
            }
          ];
        case 'storageBox':
          // 储藏箱无动作，只显示库存
          return [];
        case 'farmPlot':
          return [
            {
              name: 'plantVegetable',
              text: '种植蔬菜',
              icon: '🥬',
              duration: 8,
              energyCost: 8,
              handler: async () => await this.withEnergyCost(8, async () => await this.plantVegetable()),
              tooltip: '需要树枝 ×1'
            }
          ];
        case 'herbShop':
          return [
            {
              name: 'makeFirstAid',
              text: '制作急救包',
              icon: '🩹',
              duration: 6,
              energyCost: 5,
              handler: async () => await this.withEnergyCost(5, async () => await this.makeFirstAid()),
              tooltip: '需要草药 ×2'
            },
            {
              name: 'makeNourishingSoup',
              text: '制作滋补汤',
              icon: '🍲',
              duration: 5,
              energyCost: 5,
              handler: async () => await this.withEnergyCost(5, async () => await this.makeNourishingSoup()),
              tooltip: '需要蔬菜 ×2 + 生肉 ×1'
            }
          ];
        default:
          return [];
      }
    },

    // 获取场景基础动作（场景相关，与建筑无关）
    getActionConfig(): GameAction[] {
      return [
        {
          name: 'explore',
          text: '探索',
          icon: '🔍',
          duration: 5,
          energyCost: 10,
          actionGroup: 'scene',
          handler: async () => await this.withEnergyCost(10, async () => await this.explore())
        },
        {
          name: 'meditate',
          text: '冥想',
          icon: '🧘',
          duration: 4,
          energyCost: 0,
          actionGroup: 'scene',
          handler: async () => await this.meditateCharacter()
        },
        {
          name: 'tidyCamp',
          text: '整理营地',
          icon: '🧹',
          duration: 3,
          energyCost: 5,
          actionGroup: 'scene',
          handler: async () => await this.withEnergyCost(5, async () => await this.tidyCamp())
        }
      ];
    },

    initializeScene() {
      this.scene.actions = this.getActionConfig();
    }
  },

  persist: true
});
