import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

import GameFeed from '../GameFeed.vue'
import { useGameLogStore } from '@/stores/gameLog'
import { useTimeStore } from '@/stores/time'

describe('GameFeed retry', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('restores the default search state when retry is clicked', async () => {
    const gameLogStore = useGameLogStore()
    const timeStore = useTimeStore()

    timeStore.timestamp = 12
    gameLogStore.entries = [{
      text: '天气转晴了',
      type: 'SYSTEM',
      gameTimestamp: 12,
      timestamp: 1,
    }]

    const wrapper = mount(GameFeed)

    await wrapper.get('input.search-input').setValue('下雨')
    await nextTick()

    expect(wrapper.text()).toContain('暂无匹配消息')

    await wrapper.get('button.retry-button').trigger('click')
    await nextTick()

    expect((wrapper.get('input.search-input').element as HTMLInputElement).value).toBe('')
    expect(wrapper.text()).toContain('天气转晴了')

    wrapper.unmount()
  })
})
