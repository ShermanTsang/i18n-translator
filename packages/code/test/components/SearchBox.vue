<script lang="ts" setup>
import SearchToolbox from '@/components/SearchToolbox.vue'
import useI18n from '@/composables/useI18n'
import useStoredValue from '@/composables/useStoredValue'
import { Search as SearchIcon, SettingOne as SettingIcon, } from '@icon-park/vue-next'
import { useDebounceFn } from '@vueuse/core'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { runtime } from 'webextension-polyfill'

type SearchBoxMode = 'plain' | 'modal' | 'bar'

const emits = defineEmits([
  'onSearch',
  'update:confirmedKeyword',
  'update:keyword',
  'update:model',
])


const {t} = useI18n()

const config = {
  searchOptions: [
    {
      name: t('setting'),
      test: t("double quotes"),
      icon: SettingIcon,
      onClick() {
        runtime.openOptionsPage(t('name1.hhhh'))
      },
    },
  ],
}

const input = reactive({
  keyword: '',
  selectedKeyword: '',
})

const state = reactive<{
  activeTab: string
  isInputFocused: boolean
  mode: SearchBoxMode
}>({
  activeTab: '搜索建议',
  isInputFocused: false,
  mode: 'plain',
})

const mainStyles = computed(() => {
  const stylesMap = new Map<string, string>()
      .set('plain', '')
      .set('modal', 'search--modal')
      .set('bar', 'search--bar')
  return stylesMap.get(state.mode) || ''
})

defineExpose({
  input,
})

const inputRef = ref<HTMLInputElement | null>(null)
const toolboxRef = ref<typeof SearchToolbox | null>(null)

onMounted(() => {
  inputRef.value?.focus()
})

watch(
    () => input.keyword,
    (newValue) => {
      emits('update:keyword', newValue)
      if (newValue === '' || !newValue || newValue.length === 0) {
        state.mode = 'plain'
        input.selectedKeyword = ''
        emits('update:confirmedKeyword', '')
        return
      }
      if (newValue.trimStart().length > 0) {
        if (newValue !== input.selectedKeyword) {
          state.mode = 'modal'
        }
        useDebounceFn(() => {
          toolboxRef.value?.requestKeywordSuggestion(input.keyword)
        }, 600)()
      }
    },
)

watch(
    () => state.mode,
    (newMode: SearchBoxMode) => {
      emits('update:model', newMode)
    },
)

const {state: historyList} = useStoredValue<string[]>(
    'local:historyList',
    [],
)

function search(presetKeyword?: string | null) {
  if (input.selectedKeyword) {
    input.keyword = input.selectedKeyword
  }
  if (presetKeyword) {
    input.keyword = presetKeyword
  }
  if (!input.keyword || input.keyword.length === 0) {
    return
  }
  state.mode = 'bar'
  input.selectedKeyword = input.keyword.replace(/^\s+|\s+$/g, '')
  emits('update:confirmedKeyword', input.keyword)
  emits('onSearch')
  historyList.value = [
    ...new Set([input.keyword, ...(historyList.value || [])]),
  ]
}

function onInputMove(direction: 'up' | 'down') {
  if (state.mode === 'modal') {
    toolboxRef.value?.selectItem(direction)
  }
}

function onInputBlur() {
  state.isInputFocused = false
}

function onInputFocus() {
  state.isInputFocused = true
}
</script>

<template>
  <div :class="mainStyles" class="search">
    <div class="search__box">
      <input
          ref="inputRef"
          v-model.trim="input.keyword"
          :placeholder="t('search1.placeholder222')"
          class="search__box__input"
          type="text"
          @blur="onInputBlur"
          @focus="onInputFocus"
          @keyup.enter="search()"
          @keyup.down="onInputMove('down')"
          @keyup.up="onInputMove('up')"
      >
      <div class="search__box__button">
        <SearchIcon
            :stroke-width="2"
            fill="#666"
            size="1.4rem"
            theme="outline"
        />
      </div>
    </div>
    <template v-if="state.mode === 'modal'">
      <SearchToolbox
          ref="toolboxRef"
          v-model:selectedKeyword="input.selectedKeyword"
          :keyword="input.keyword"
          class="flex-grow"
          @enter="search"
      />
      <div class="search--modal__footer">
        <div class="search--modal__footer__tip">
          {{ t("tip.apple") }}
          <span class="keyboard">↑</span>
          <span class="keyboard">↓</span>
        </div>
        <div class="search--modal__footer__option">
          <div
              v-for="item in config.searchOptions"
              :key="item.name"
              class="search--modal__footer__option__item"
              @click="item.onClick()"
          >
            <component
                :is="item.icon"
                v-if="item.icon"
                :stroke-width="2"
                fill="#666"
                size="1.4rem"
                theme="outline"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.search {
  @apply bg-white relative border border-gray-200 rounded-full transition-shadow duration-200 ease-in-out overflow-hidden;
  @apply hover:shadow-gray-100 hover:shadow-xl;

  &__box {
    @apply flex flex-row flex-nowrap items-center mx-0 p-1 w-full;

    &__input {
      @apply px-4 py-2 text-base border-none outline-none text-[#666] transition-all duration-200 ease-in-out bg-[transparent] flex-grow w-[340px];
      @apply focus:text-[#333] focus:w-[400px];

      &:hover {
        @apply text-[#333];
      }
    }

    &__button {
      @apply relative p-1 transition-all duration-200 ease-in-out cursor-pointer transform scale-100;
      @apply hover:scale-105;

      &:before {
        @apply absolute top-1/2 -left-[6px] transform -translate-y-1/2 bg-gray-100 w-[1px] h-full;
      }
    }
  }
}

.search--modal {
  @apply fixed flex flex-col flex-nowrap justify-between w-[80vw] rounded-[12px] divide-gray-200 divide-y shadow-2xl shadow-gray-200 z-[99];

  &:before {
    @apply fixed top-0 left-0 w-full h-full opacity-50 -z-10 content-[''];
  }

  &__footer {
    @apply p-4 flex flex-row justify-between items-center bg-white;

    &__tip {
      @apply text-[#999] text-sm;
    }

    &__option {
      @apply relative flex-row flex-nowrap items-center mx-0 my-auto w-[auto] transform duration-200 ease-in-out;

      &__item {
        @apply px-1 transition-all duration-200 ease-in-out cursor-pointer;
      }
    }
  }
}

.search--bar {
  @apply w-full rounded-none fixed top-0 left-0 right-0 z-[50];
}
</style>
