<script>
import CommonSlot from '@/components/layout/CommonSlot'
export default {
  name: 'PublicLayout',
  components: {
    CommonSlot,
  },
  methods: {

  },
}
</script>

<template>
  <CommonSlot>
    <div>
      <NuxtPage />
    </div>
  </CommonSlot>
</template>
