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
  noMore: false // 暂无更多数据
})

/**
 * 加载数据
 * @param {Boolean} more 是否是加载更多数据
 */
function loadData(more) {
  if (more) {
    state.page.current++
  } else {
    state.page.current = 1
  }
  console.log('state.page.current1: ', state.page.current)

  setTimeout(() => {
    if (state.page.current == 2) {
      console.log('state.page.current2: ', state.page.current)
      state.noMore = true
    }
    const arr = new Array(state.page.size).fill(
      {
        type: 'video',
        src: 'https://shtest.cretechsh.cn/cretech/calc/101010/mp4/2023/b4838bab6345fa0a3ae66284128b2a7c.mp4',
        id: state.page.current
      },
      0,
      state.page.size
    )
    state.list.push(...arr)
  }, 1e3)
}

loadData()
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
