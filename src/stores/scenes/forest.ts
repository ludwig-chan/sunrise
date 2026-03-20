import { defineStore } from 'pinia';
import type { GameScene, GameResource } from './types';
import { useEquipmentStore } from '../equipment';
import { useCharacterStore } from '../character';
import { 
  type ResourceInfo, 
  getStockAmount, 
  hasStock, 
  getOrCreateResource, 
  calculateExploreResources 
} from '../../utils/resourceUtils';
import { toast } from '../../utils/toast';

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
      stock: JSON.parse(JSON.stringify(INITIAL_STOCK))
    } as GameScene
  }),

  getters: {
    resources: (state) => state.scene.resources,
    actions: (state) => state.scene.actions
  },

  actions: {
    reset() {
      // 清空已收集的资源
      this.scene.resources = []
      
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
        return;
      }
      const resourcesText = gainedResources.join('、');
      toast({ 
        message: `探索发现了${resourcesText}`, 
        type: "success" 
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
        });        // 如果库存耗尽，发出提示
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
      const character = useCharacterStore();

      // 60% 概率找到食物，40% 概率一无所获
      if (Math.random() < FOOD_GATHER_FAILURE_RATE) {
        toast({
          message: '找了一圈，没有发现可以吃的东西',
          type: 'info'
        });
        return;
      }

      const gathered: string[] = [];

      // 尝试采集苹果
      try {
        const appleAmount = await getStockAmount(this.scene.stock, 'apple', 2);
        character.addToInventory('apple', '苹果', '🍎', appleAmount);
        gathered.push(`${appleAmount}个苹果`);
      } catch {
        // 苹果库存不足，跳过
      }

      // 尝试采集浆果
      try {
        const berryAmount = await getStockAmount(this.scene.stock, 'berry', 3);
        character.addToInventory('berry', '浆果', '🫐', berryAmount);
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
        message: `采集到了${gathered.join('和')}，已放入背包`,
        type: 'success'
      });
    },

    getActionConfig() {
      const equipment = useEquipmentStore();
      return [
        {
          name: 'chopWood',
          text: '砍伐',
          duration: 5,
          energyCost: 15, // 砍树需要较多体力
          handler: async () => await this.withEnergyCost(15, async () => await this.chopWood()),
          disabled: equipment.axeCount === 0,
          tooltip: '需要斧头才能砍伐'
        },
        {
          name: 'explore',
          text: '探索',
          duration: 3,
          energyCost: 10, // 探索消耗中等体力
          handler: async () => await this.withEnergyCost(10, async () => await this.explore())
        },
        {
          name: 'mineOre',
          text: '采矿',
          duration: 3,
          energyCost: 20, // 采矿需要大量体力
          handler: async () => await this.withEnergyCost(20, async () => await this.mineOre())
        },
        {
          name: 'gatherFood',
          text: '觅食',
          duration: 3,
          energyCost: 5, // 采集食物消耗较少体力
          handler: async () => await this.withEnergyCost(5, async () => await this.gatherFood())
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
