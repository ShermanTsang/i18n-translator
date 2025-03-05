<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    subText?: string
    isActive?: boolean
    prepend?: any
    text?: any
    action?: any
  }>(),
  {
    subText: '',
    isActive: false,
    prepend: null,
    text: null,
    action: null,
  },
)
</script>

<template>
  <div
    class="flex flex-row items-center rounded px-4 py-3 border border-gray-100 cursor-pointer"
    :class="{ 'bg-gray-100 shadow-inner': props.isActive }"
  >
    <div
      v-if="$slots.prepend || props.prepend"
      class="p-1 border border-gray-200 rounded"
    >
      <slot name="prepend">
        {{ props.prepend }}
      </slot>
    </div>
    <div class="ml-4 space-y-2 flex-grow">
      <div
        v-if="$slots.subText || props.subText"
        class="rounded bg-gray-100 text-gray-600 text-xs inline-block px-2 py-[1px]"
      >
        {{ props.subText }}
      </div>
      <div v-if="$slots.text || props.text" class="tracking-wider">
        <slot name="text">
          {{ props.text }}
        </slot>
      </div>
    </div>
    <div v-if="$slots.action || props.action" class="">
      <slot name="action">
        {{ props.action }}
      </slot>
    </div>
  </div>
</template>
