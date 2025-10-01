<script>
import CommonSlot from '@/components/layout/CommonSlot'
export default {
  name: 'NoFooterLayout',
  components: {
    CommonSlot,
  },
}
</script>

<template>
  <CommonSlot no-footer>
    <div>
      <NuxtPage />
    </div>
  </CommonSlot>
</template>
