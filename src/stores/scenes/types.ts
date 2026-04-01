export interface GameAction {
  name: string;
  text: string;
  icon?: string; // emoji 图标，用于列表展示
  duration: number;
  energyCost: number; // 该动作需要消耗的体力值
  /**
   * 进度条开始前的预执行钩子（可选）。
   * 用于在进度动画启动之前完成：
   *   1. 条件校验（材料、体力等）
   *   2. 资源和体力的即时消耗
   * 返回 true 表示校验通过、消耗已完成，可以继续播放进度条；
   * 返回 false 表示条件不足，已弹出 toast 提示，进度条不启动。
   * 若未定义此字段，则沿用旧逻辑（UI 层仅做体力检查，handler 内部再做资源处理）。
   */
  preExecute?: () => boolean;
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

export interface TrapYield {
  id: string;
  name: string;
  count: number;
}

export interface TrapAnimal {
  id: string;
  name: string;
  yields: TrapYield[];
}

export interface GameBuilding {
  name: string;
  type: string;
  level: number;
  icon?: string; // 建筑图标
  storage?: GameBuildingStorage; // 仓库类建筑的库存状态（可持久化）
  // 陷阱捕获状态（仅 trap 类型建筑使用）
  trapCapturedAt?: number;   // 上次捕获时间戳（ms），null/undefined 表示陷阱为空
  trapAnimal?: TrapAnimal;   // 当前捕获的动物信息
  trapDamaged?: boolean;     // 陷阱是否已损坏，需要修复才能继续使用
}

// UI 分组动作（供 ActionsPanel 分组展示）
export interface ActionGroup {
  groupId: 'character' | 'scene';
  label: string; // 例如"人物行动"或"当前场景：树林"
  actions: GameAction[];
}

export interface GameScene {
  id: string;
  name: string;
  actions: GameAction[];
  buildings: GameBuilding[];
  // 场景库存,记录场景中资源的当前数量和最大数量
  stock: {
    [key: string]: {
      current: number;  // 当前数量
      max: number;      // 最大数量
    }
  };
}
