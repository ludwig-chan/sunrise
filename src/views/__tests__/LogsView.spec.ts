import { describe, expect, it, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

import LogsView from '../LogsView.vue'
import { useGameLogStore } from '@/stores/gameLog'
import { useTimeStore } from '@/stores/time'

describe('LogsView retry', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('clears the search text when retry is clicked from an empty filtered state', async () => {
    const gameLogStore = useGameLogStore()
    const timeStore = useTimeStore()

    timeStore.timestamp = 8
    gameLogStore.entries = [{
      text: '找到了一根树枝',
      type: 'ITEM',
      gameTimestamp: 8,
      timestamp: 1,
    }]

    const wrapper = mount(LogsView, {
      global: {
        stubs: {
          PageHeader: { template: '<div />' },
        },
      },
    })

    await wrapper.get('input.log-search').setValue('矿石')
    await nextTick()

    expect(wrapper.text()).toContain('暂无匹配日志')
    expect(wrapper.get('button.retry-button').text()).toBe('重试')

    await wrapper.get('button.retry-button').trigger('click')
    await nextTick()

    expect((wrapper.get('input.log-search').element as HTMLInputElement).value).toBe('')
    expect(wrapper.text()).toContain('找到了一根树枝')
  })
})
