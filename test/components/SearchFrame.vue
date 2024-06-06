<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import SearchBox from '@/components/SearchBox.vue'

const searchBoxRef = ref<HTMLElement | null>(null)

const state = reactive({
  mode: 'plain' as 'plain' | 'modal' | 'bar',
})

const input = reactive({
  keyword: '',
  selectedKeyword: '',
})

onMounted(() => {})

const mainStyles = computed(() => {
  if (state.mode === 'modal') {
    return 'flex flex-col flex-nowrap h-[100vh]'
  }
  return 'flex flex-row flex-nowrap items-center h-[100vh] justify-center'
})
</script>

<template>
  <div :class="mainStyles">
    <SearchBox
      ref="searchBoxRef"
      v-model:keyword="input.keyword"
      v-model:confirmed-keyword="input.selectedKeyword"
      v-model:mode="state.mode"
    />
    <template v-if="input.selectedKeyword">
      <div class="flex-grow w-full">
        <iframe src="https://shermant.com" width="100%" height="800px" />
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss"></style>
