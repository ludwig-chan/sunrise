import { defineStore } from 'pinia'

export interface CurrentActivity {
  name: string
  label: string
  icon: string
  startedAt: number
  duration: number // milliseconds
  onComplete: () => Promise<void>
}

export const useActivityStore = defineStore('activity', {
  state: () => ({
    currentActivity: null as CurrentActivity | null
  }),

  getters: {
    isBusy(): boolean {
      return this.currentActivity !== null
    }
  },

  actions: {
    startActivity(activity: CurrentActivity) {
      this.currentActivity = activity
    },

    cancelActivity() {
      this.currentActivity = null
    },

    async completeActivity() {
      if (!this.currentActivity) return
      const onComplete = this.currentActivity.onComplete
      this.currentActivity = null
      await onComplete()
    }
  },

  persist: {
    omit: ['currentActivity']
  }
})
