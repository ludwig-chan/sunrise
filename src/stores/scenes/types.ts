export interface GameAction {
  name: string;
  text: string;
  icon?: string; // emoji 图标，用于列表展示
  duration: number;
  energyCost: number; // 新增: 该动作需要消耗的体力值
  handler: () => Promise<void>;
  disabled?: boolean | (() => boolean);
  tooltip?: string;
  group?: string; // 用于 UI 分组，同组按钮横排显示
  actionGroup?: 'character' | 'scene'; // 区分人物动作与场景动作
}

// 建筑动作（与 GameAction 结构相同，用于建筑弹窗）
export type GameBuildingAction = GameAction;

// 建筑升级配方
export interface GameBuildingUpgrade {
  toLevel: number;
  cost: Record<string, number>;
  energyCost: number;
  duration: number; // 秒
  description?: string;
}

// 建筑仓库
export interface GameBuildingStorage {
  capacity: number;
  items: Record<string, number>;
}

export interface GameBuildingRecipe {
  type: string;
  name: string;
  description: string;
  cost: { [resourceType: string]: number };
  duration: number; // 建造耗时（游戏天数）
  energyCost: number;
}

export interface GameResource {
  id: string;
  type: string;
  name: string;
  count: number;
  maxCount?: number;
  description?: string;
}

export interface GameBuilding {
  name: string;
  type: string;
  level: number;
  icon?: string; // 建筑图标
  storage?: GameBuildingStorage; // 仓库类建筑的库存状态（可持久化）
}

// UI 分组动作（供 ActionsPanel 分组展示）
export interface ActionGroup {
  groupId: 'character' | 'scene';
  label: string; // 例如"人物行动"或"当前场景：树林"
  actions: GameAction[];
}

  id: string;
  name: string;
  actions: GameAction[];
  resources: GameResource[];
  buildings: GameBuilding[];
  // 场景库存,记录场景中资源的当前数量和最大数量
  stock: {
    [key: string]: {
      current: number;  // 当前数量
      max: number;      // 最大数量
    }
  };
}
