import mitt from 'mitt'

interface ToastOptions {
  message: string
  duration?: number
  type?: 'success' | 'info' | 'warning' | 'error'
}

export const emitter = mitt()

export function toast(options: ToastOptions | string) {
  const opts = typeof options === 'string' ? { message: options } : options
  const duration = opts.duration || 2000

  // 发送显示 toast 事件
  emitter.emit('showToast', {
    message: opts.message,
    type: opts.type
  })

  // 定时隐藏
  setTimeout(() => {
    emitter.emit('hideToast')
  }, duration)
}
