import { type Season, type Weather } from '../stores/time'

// 定义消息类型
export type MessageType = 'SYSTEM' | 'COMBAT' | 'DIALOGUE' | 'ACTION' | 'ITEM'

// 定义时段枚举类型
export type DayPeriod = 'DAWN' | 'DAY' | 'DUSK' | 'NIGHT'

// 时段名称映射
export const periodNames: Record<DayPeriod, string> = {
  'DAWN': '黎明',
  'DAY': '白天',
  'DUSK': '黄昏',
  'NIGHT': '夜晚'
}

// 季节名称映射
export const seasonNames: Record<Season, string> = {
  'SPRING': '春季',
  'SUMMER': '夏季',
  'AUTUMN': '秋季',
  'WINTER': '冬季'
}

// 天气名称映射
export const weatherNames: Record<Weather, string> = {
  'SUNNY': '晴朗',
  'RAINY': '下雨',
  'WINDY': '刮风',
  'SNOWY': '下雪',
  'HAIL': '冰雹',
  'SANDSTORM': '沙尘暴',
  'HAZE': '雾霾'
}

// 消息类型名称映射
export const messageTypeNames: Record<MessageType, string> = {
  'SYSTEM': '系统',
  'COMBAT': '战斗',
  'DIALOGUE': '对话',
  'ACTION': '行动',
  'ITEM': '物品'
}

// 基础资源名称映射
export const resourceNames: Record<string, string> = {
  'wood': '木材',
  'ore': '矿石',
  'branch': '树枝',
  'axe': '斧头',
  'apple': '苹果',
  'banana': '香蕉',
  'watermelon': '西瓜',
  'durian': '榴莲',
  'appleSeed': '苹果种子',
  'bananaSeed': '香蕉种子',
  'watermelonSeed': '西瓜种子',
  'durianSeed': '榴莲种子',
  'raw_meat': '生肉'
}
