<script lang="ts" setup>
import { SettingOne as SettingIcon } from '@icon-park/vue-next'

const config = {
  toolItems: [{ name: 'setting', icon: SettingIcon }],
}

const { t } = useI18n()
</script>

<template>
  <div class="flex flex-row flex-nowrap items-center justify-between">
    <div v-for="item in config.toolItems">
      <component :is="item.icon" />
    </div>
    <slot />
  </div>
</template>

<style scoped lang="scss"></style>
