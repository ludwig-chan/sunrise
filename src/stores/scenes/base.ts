import { defineStore } from 'pinia';
import { computed } from 'vue';
import type { GameScene } from './types';
import { useEquipmentStore } from '../equipment';
import { useCharacterStore } from '../character';
import { useScenesStore } from '../scenes';
import { getOrCreateResource } from '../../utils/resourceUtils';
import { toast } from '../../utils/toast';

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
    actions: (state) => state.scene.actions
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

      // 30%概率发现资源
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
      }
      // 20%概率发现树林(如果还没解锁的话)
      else if (eventRoll < 0.5 && !scenes.unlockedScenes.includes('forest')) {
        scenes.unlockScene('forest');
        const message = "在远处发现了一片茂密的树林，看起来那里会有不少资源...";
        toast({
          message,
          type: 'info'
        });
      }
      // 50%概率什么都没发现
      else {
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
