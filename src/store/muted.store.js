import { defineStore } from "pinia"

export const useMutedStore = defineStore('useMutedStore', {
  state: () => ({
    muted: true
  }),
  getters: {
    getMuted: (state) => {
      return state.muted
    }
  },
  actions: {
    setMuted (value) {
      this.muted = value
    }
  }
})