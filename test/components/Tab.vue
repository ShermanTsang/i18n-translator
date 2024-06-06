<script lang="ts" setup>
import { reactive } from 'vue'
import useI18n from '@/composables/useI18n'

const props = defineProps<{
  tabItems: tabItem[]
  defaultTab: string
}>()

const emit = defineEmits(['changeTab'])

const { t } = useI18n()

interface tabItem {
  name: string
  icon?: any
}

const state = reactive({
  activeTab: props.defaultTab,
})

function clickTab(tabName: string) {
  state.activeTab = tabName
  emit('changeTab', tabName)
}
</script>

<template>
  <div
    class="divide-gray-200 divide-x flex flex-row items-center justify-center border-b border-gray-200 py-3"
  >
    <div
      v-for="item in tabItems"
      :key="item.name"
      class="flex-grow flex flex-row items-center justify-center text-center text-[#999] text-base tracking-wide cursor-pointer"
      :class="{ 'text-black': state.activeTab === item.name }"
      @click="clickTab(item.name)"
    >
      <component
        :is="item.icon"
        v-if="item.icon"
        :stroke-width="2"
        theme="outline"
        class="mr-2"
      />
      <span>{{ t(`tab.${item.name}`) }}</span>
    </div>
  </div>
  <div v-for="item in tabItems" :key="item.name">
    <template v-if="state.activeTab === item.name">
      <slot :name="item.name" />
    </template>
  </div>
</template>

<style lang="scss" scoped></style>
