<script>
export default {
  name: 'LinkCard',
  props: {
    to: {
      type: [String, Object],
      default: '',
    },
    title: {
      type: [String],
      default: '',
    },
    desc: {
      type: [String],
      default: '',
    },
    outSide: {
      type: [Boolean],
      default: false,
    },
  },
}
</script>

<template>
  <OutSideLink
    v-if="outSide"
    class="border-border-default rounded-md border"
    raw
    :href="to"
  >
    <div class="p-4 shadow">
      <div class="text-accent-fg mb-3 text-2xl font-thin hover:underline">
        {{ title }}
      </div>
      <div class="text-fg-muted text-sm">
        {{ desc }}
      </div>
    </div>
  </OutSideLink>

  <NuxtLink v-else :to="to" class="border-border-default rounded-md border">
    <div class="p-4 shadow">
      <div class="text-accent-fg mb-3 text-2xl font-thin hover:underline">
        {{ title }}
      </div>
      <div class="text-fg-muted text-sm">
        {{ desc }}
      </div>
    </div>
  </NuxtLink>
</template>
