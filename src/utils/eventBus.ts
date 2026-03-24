import mitt from 'mitt'
import { type MessageType } from './textMapping'

export type GameMessage = {
  text: string;
  type: MessageType;
};

export type Events = {
  'game-message': string | GameMessage;
  'hour-passed': void;  // 每小时触发的事件
  'clear-messages': void;  // 清空消息事件
  'game-auto-paused': void;  // 游戏自动暂停事件（血量过低或长时间无操作）
}

export const emitter = mitt<Events>()

// 全局游戏消息方法
export const gameLog = (message: string | GameMessage) => {
  if (typeof message === 'string') {
    emitter.emit('game-message', { text: message, type: 'SYSTEM' })
  } else {
    emitter.emit('game-message', message)
  }
}

// 清空消息方法
export const clearGameLog = () => {
  emitter.emit('clear-messages')
}
