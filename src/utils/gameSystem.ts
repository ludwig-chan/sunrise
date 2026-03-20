import { useCharacterStore } from '../stores/character'
import { useTimeStore } from '../stores/time'
import { useScenesStore } from '../stores/scenes'
import { gameLog, emitter } from './eventBus'

/**
 * 重置整个游戏状态
 * 包括：时间、天气、场景、角色状态、游戏消息等
 */
export async function restartGame() {
  // 重置时间
  const timeStore = useTimeStore()
  timeStore.$patch({
    timestamp: 0,
    weather: 'SUNNY'
  })

  // 重置所有场景
  const scenes = useScenesStore()
  scenes.resetAllScenes()

  // 重新初始化场景动作
  scenes.initializeScenes()

  // 重置角色状态
  const character = useCharacterStore()
  character.$reset()

  // 清空游戏消息
  emitter.emit('clear-messages')

  // 发送游戏重启消息
  gameLog({
    text: '新的一天开始了...',
    type: 'SYSTEM'
  })
}
