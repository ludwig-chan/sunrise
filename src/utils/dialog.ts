import { createApp, h } from 'vue'
import DialogBox from '@/components/common/DialogBox.vue'

// 跟踪当前是否有弹窗打开
let isDialogOpen = false

interface DialogOption {
  text: string
  value: any
}

interface DialogConfig {
  message: string
  options: DialogOption[]
  closeOnOverlay?: boolean
  allowMultiple?: boolean  // 新增参数：是否允许多个弹窗同时存在
}

export function showDialog(config: DialogConfig): Promise<any> {
  // 如果已经有弹窗打开且不允许多个弹窗，直接返回
  if (isDialogOpen && !config.allowMultiple) {
    return Promise.resolve(undefined)
  }

  return new Promise((resolve) => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    
    isDialogOpen = true

    const app = createApp({
      setup() {
        const handleSelect = (value: any) => {
          app.unmount()
          document.body.removeChild(container)
          isDialogOpen = false
          resolve(value)
        }

        const handleClose = () => {
          app.unmount()
          document.body.removeChild(container)
          isDialogOpen = false
          resolve(undefined)
        }

        return () =>
          h(DialogBox, {
            message: config.message,
            options: config.options,
            closeOnOverlay: config.closeOnOverlay,
            onSelect: handleSelect,
            onClose: handleClose,
          })
      },
    })

    app.mount(container)
  })
}

// 提供一些常用的对话框快捷方法
export function confirm(message: string, allowMultiple: boolean = false): Promise<boolean> {
  return showDialog({
    message,
    options: [
      { text: '确定', value: true },
      { text: '取消', value: false },
    ],
    allowMultiple
  })
}

export function alert(message: string, allowMultiple: boolean = false): Promise<void> {
  return showDialog({
    message,
    options: [{ text: '确定', value: undefined }],
    closeOnOverlay: false,
    allowMultiple
  })
}

export function prompt(message: string, options: DialogOption[], allowMultiple: boolean = false): Promise<any> {
  return showDialog({
    message,
    options,
    allowMultiple
  })
}
