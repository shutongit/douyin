<script setup>
import { reactive } from 'vue'
import SlideList from '@/components/SlideList.vue'

const state = reactive({
  list: [], // 数据源
  index: 0, // 下标
  page: {
    // 页码
    size: 10,
    current: 1
  },
  noMore: false, // 暂无更多数据
  loading: false // 是否正在请求数据
})

/**
 * 加载数据
 * @param {Boolean} more 是否是加载更多数据
 */
function loadData(more) {
  if (!state.loading) {
    if (more) {
      state.page.current++
    } else {
      state.page.current = 1
    }
    state.loading = true
    setTimeout(() => {
      if (state.page.current == 2) {
        state.noMore = true
      }
      const arr = videoData()
      state.list.push(...arr)
      state.loading = false
    }, 1e3)
  }
}

loadData()

/** 视频数据 */
function videoData() {
  return [
    {
      id: 1,
      type: 'video',
      src: 'https://shtest.cretechsh.cn/cretech/calc/101010/mp4/2024/cfadd07bfe235a6384b7513b338a9325.mp4'
    },
    {
      id: 2,
      type: 'video',
      src: 'https://shtest.cretechsh.cn/cretech/calc/101010/mp4/2024/c022ef8e2a6d164363d2d86e132b5852.mp4'
    },
    {
      id: 3,
      type: 'video',
      src: 'https://shtest.cretechsh.cn/cretech/calc/101010/mp4/2024/91f8f19a5b26253335aaac04803294b2.mp4'
    },
    {
      id: 4,
      type: 'video',
      src: 'https://shtest.cretechsh.cn/cretech/calc/101010/mp4/2023/b4838bab6345fa0a3ae66284128b2a7c.mp4'
    },
    {
      id: 5,
      type: 'video',
      src: 'https://shtest.cretechsh.cn/cretech/calc/101010/mp4/2023/b4838bab6345fa0a3ae66284128b2a7c.mp4'
    },
    {
      id: 6,
      type: 'video',
      src: 'https://shtest.cretechsh.cn/cretech/calc/101010/mp4/2024/cfadd07bfe235a6384b7513b338a9325.mp4'
    },
    {
      id: 7,
      type: 'video',
      src: 'https://shtest.cretechsh.cn/cretech/calc/101010/mp4/2024/c022ef8e2a6d164363d2d86e132b5852.mp4'
    },
    {
      id: 8,
      type: 'video',
      src: 'https://shtest.cretechsh.cn/cretech/calc/101010/mp4/2024/91f8f19a5b26253335aaac04803294b2.mp4'
    }
  ]
}
</script>

<template>
  <main class="slide">
    <SlideList
      :list="state.list"
      v-model:index="state.index"
      :noMore="state.noMore"
      :virtualCount="3"
      @loadMore="loadData"
    ></SlideList>
  </main>
</template>

<style scoped>
main {
  width: 100vw;
  height: 100vh;
}
</style>
