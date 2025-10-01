<script>
import CommonSlot from '@/components/layout/CommonSlot'

export default {
  name: 'ArticleLayout',
  components: {
    CommonSlot,
  },
}
</script>

<template>
  <CommonSlot>
    <div>
      <div class="container mx-auto">
        <NuxtPage />
      </div>
    </div>

  </CommonSlot>
</template>
