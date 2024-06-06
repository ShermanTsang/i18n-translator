<script lang="ts" setup>
import { reactive, ref } from 'vue'
import {
  Clue as ClueIcon,
  History as HistoryIcon,
  Loading as LoadingIcon,
  PoundSign as PoundSignIcon,
  Repair as RepairIcon,
} from '@icon-park/vue-next'
import Tab from '@/components/Tab.vue'
import useI18n from '@/composables/useI18n'
import PromptListItem from '@/components/PromptListItem.vue'
import useKeywordSuggestion from '@/composables/useKeywordSuggestion'

const props = withDefaults(defineProps<{ keyword: string }>(), { keyword: '' })

const emits = defineEmits(['update:selectedKeyword', 'enter'])

const itemRefs = ref<any>([])

const config = {
  tabItems: [
    { name: 'suggestion', icon: ClueIcon },
    { name: 'history', icon: HistoryIcon },
  ],
}

const state = reactive({
  isMouseOnToolbox: false,
  selectedSuggestionIndex: -1,
})

const { t } = useI18n()
const {
  requestKeywordSuggestion,
  suggestionList,
  isRequestingSuggestionWords,
  onRequestDone,
} = useKeywordSuggestion(props.keyword)

onRequestDone(() => {
  state.selectedSuggestionIndex = -1
  emits('update:selectedKeyword', '')
})

const { state: historyList } = useStoredValue('local:historyList', [])

defineExpose({
  selectItem,
  requestKeywordSuggestion,
})

function highlightKeywordHtml(
  rawContent: string,
  keyword: string = inputKeyword,
) {
  console.log('highlightKeywordHtml', rawContent, keyword)
  const keywordSet = new Set(keyword.split(''))
  const textChars = rawContent.split('')
  let result = ''
  for (let i = 0; i < textChars.length; i++) {
    if (keywordSet.has(textChars[i])) {
      result += `<span class="text-gray-400 underline underline-offset-4">${textChars[i]}</span>`
    }
    else {
      result += textChars[i]
    }
  }

  return result
}

function selectItem(key: 'up' | 'down' | number) {
  if (Number.isInteger(key)) {
    state.selectedSuggestionIndex = key as number
  }
  else {
    const direction = key
    const itemIndex = state.selectedSuggestionIndex
    const currentIndex = suggestionList.value.length - 1
    if (direction === 'down') {
      const isLastItem = itemIndex === currentIndex
      state.selectedSuggestionIndex = isLastItem ? 0 : itemIndex + 1
    }
    if (direction === 'up') {
      const isFirstItem = itemIndex === 0
      state.selectedSuggestionIndex = isFirstItem
        ? currentIndex
        : itemIndex - 1
    }
    scrollIntoView()
  }
  emits(
    'update:selectedKeyword',
    suggestionList.value[state.selectedSuggestionIndex],
  )
}

function scrollIntoView() {
  const highlightedElement = itemRefs.value[state.selectedSuggestionIndex]
  if (highlightedElement) {
    highlightedElement.$el.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      top: highlightedElement.$el.offsetTop,
    })
  }
}
</script>

<template>
  <div
    class="z-10 border-t border-gray-200 bg-white"
    @mouseenter="state.isMouseOnToolbox = true"
    @mouseleave="state.isMouseOnToolbox = false"
  >
    <Tab :tab-items="config.tabItems" default-tab="suggestion">
      <template #suggestion>
        <div class="overflow-auto h-[500px]">
          <template v-if="isRequestingSuggestionWords">
            <div
              class="flex flex-row items-center py-2 justify-center text-[#999] space-x-2 cursor-pointer h-20"
            >
              <LoadingIcon
                theme="outline"
                size="1.4rem"
                :stroke-width="2"
                class="animate-spin animate"
              />
              <span class="text-sm tracking-wide">{{ t("loading") }}...</span>
            </div>
          </template>
          <template v-else>
            <div
              v-if="suggestionList && suggestionList.length > 0"
              class="p-4 space-y-3"
            >
              <PromptListItem
                v-for="(text, index) in suggestionList"
                :key="text"
                ref="itemRefs"
                :sub-text="t('suggestion')"
                :is-active="state.selectedSuggestionIndex === index"
                @click="emits('enter', text)"
                @mouseenter="selectItem(index)"
              >
                <template #text>
                  <div
                    class="text-base"
                    v-html="highlightKeywordHtml(text, props.keyword)"
                  />
                </template>
                <template #prepend>
                  <PoundSignIcon
                    theme="outline"
                    size="1.1rem"
                    class="text-[#bbb]"
                  />
                </template>
                <template #action>
                  <RepairIcon
                    theme="outline"
                    size="1.1rem"
                    class="text-[#bbb]"
                  />
                </template>
              </PromptListItem>
            </div>
          </template>
        </div>
      </template>
      <template #history>
        <div class="overflow-auto h-[500px]">
          <div
            v-if="historyList && historyList.length > 0"
            class="p-4 space-y-3"
          >
            <PromptListItem
              v-for="(text, index) in historyList"
              :key="text"
              ref="itemRefs"
              :sub-text="t('history')"
              :is-active="state.selectedSuggestionIndex === index"
              @click="emits('enter', text)"
              @mouseenter="selectItem(index)"
            >
              <template #text>
                <div class="text-base">
                  {{ text }}
                </div>
              </template>
              <template #prepend>
                <PoundSignIcon
                  theme="outline"
                  size="1.1rem"
                  class="text-[#bbb]"
                />
              </template>
              <template #action>
                <RepairIcon theme="outline" size="1.1rem" class="text-[#bbb]" />
              </template>
            </PromptListItem>
          </div>
        </div>
      </template>
    </Tab>
  </div>
</template>

<style scoped lang="scss"></style>
