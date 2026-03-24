import { defineStore } from 'pinia';
import type { GameScene, GameResource, GameBuildingRecipe } from './types';
import { useEquipmentStore } from '../equipment';
import { useCharacterStore } from '../character';
import { useTimeStore } from '../time';
import { 
  type ResourceInfo, 
  getStockAmount, 
  hasStock, 
  getOrCreateResource, 
  calculateExploreResources 
} from '../../utils/resourceUtils';
import { toast } from '../../utils/toast';
import { useGameLogStore } from '../gameLog';

// 树林可建造的建筑配方
export const FOREST_BUILDING_RECIPES: GameBuildingRecipe[] = [
  {
    type: 'woodenHut',
    name: '木屋',
    description: '提供庇护所，可以休息恢复体力',
    cost: { wood: 20, branch: 5 },
    duration: 5,
    energyCost: 20
  },
  {
    type: 'trap',
    name: '陷阱',
    description: '自动捕捉小动物，提供食物',
    cost: { branch: 3 },
    duration: 1,
    energyCost: 4
  }
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
      resources: [],
      actions: [],
      buildings: [],
      stock: JSON.parse(JSON.stringify(INITIAL_STOCK))
    } as GameScene
  }),

  getters: {
    resources: (state) => state.scene.resources,
    actions: (state) => state.scene.actions,
    buildingRecipes: (): GameBuildingRecipe[] => FOREST_BUILDING_RECIPES
  },

  actions: {
    reset() {
      // 清空已收集的资源
      this.scene.resources = []

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
      const timeStore = useTimeStore();
      timeStore.resumeGame();
      try {
        await action();
        this.consumeEnergy(cost);
      } finally {
        timeStore.pauseGame();
      }
    },

    async chopWood() {
      const equipment = useEquipmentStore();
      if (!equipment.useAxe()) {
        return;
      }

      try {
        const amount = await getStockAmount(this.scene.stock, 'wood');
        const woodResource = getOrCreateResource(this.scene.resources, {
          id: 'wood',
          type: 'wood',
          name: '木材'
        });
        woodResource.count++;
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

      // 处理每种被选中的资源
      for (const resource of selectedResources) {
        try {
          // 尝试获取资源
          const amount = await getStockAmount(this.scene.stock, resource.type, resource.expectedAmount);

          // 获取或创建资源
          const playerResource = getOrCreateResource(this.scene.resources, resource);
          playerResource.count += amount;
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
      try {
        const amount = await getStockAmount(this.scene.stock, 'ore');
        const oreResource = getOrCreateResource(this.scene.resources, {
          id: 'ore',
          type: 'ore',
          name: '矿石'
        });
        oreResource.count++;
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

      // 尝试采集苹果
      try {
        const appleAmount = await getStockAmount(this.scene.stock, 'apple', 2);
        const appleResource = getOrCreateResource(this.scene.resources, {
          id: 'apple',
          type: 'apple',
          name: '苹果'
        });
        appleResource.count += appleAmount;
        gathered.push(`${appleAmount}个苹果`);
      } catch {
        // 苹果库存不足，跳过
      }

      // 尝试采集浆果
      try {
        const berryAmount = await getStockAmount(this.scene.stock, 'berry', 3);
        const berryResource = getOrCreateResource(this.scene.resources, {
          id: 'berry',
          type: 'berry',
          name: '浆果'
        });
        berryResource.count += berryAmount;
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
          name: 'chopWood',
          text: '砍伐',
          duration: 5,
          energyCost: 10, // 砍树需要较多体力
          group: 'gather',
          handler: async () => await this.withEnergyCost(10, async () => await this.chopWood()),
          disabled: equipment.slots.mainHand !== 'axe' && equipment.axeCount === 0,
          tooltip: '需要斧头才能砍伐'
        },
        {
          name: 'mineOre',
          text: '采矿',
          duration: 3,
          energyCost: 12, // 采矿需要大量体力
          group: 'gather',
          handler: async () => await this.withEnergyCost(12, async () => await this.mineOre())
        },
        {
          name: 'gatherFood',
          text: '觅食',
          duration: 3,
          energyCost: 5, // 采集食物消耗较少体力
          group: 'gather',
          handler: async () => await this.withEnergyCost(5, async () => await this.gatherFood())
        },
        {
          name: 'explore',
          text: '探索',
          duration: 3,
          energyCost: 8, // 探索消耗中等体力
          handler: async () => await this.withEnergyCost(8, async () => await this.explore())
        }
      ];
    },

    initializeScene() {
      this.scene.actions = this.getActionConfig();

      // 初始化场景时设置默认库存
      if (!this.scene.stock) {
        this.scene.stock = JSON.parse(JSON.stringify(INITIAL_STOCK));
      }
    }
  },

  persist: true
})
