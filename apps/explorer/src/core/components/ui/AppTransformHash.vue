<template>
  <div class="transform-hash-container">
    <router-link v-if="link" :to="url">
      <div :class="[hashClass, fontClass]">
        <div class="hash-section">{{ first }}</div>
        <div class="concat hash-section">{{ middle }}</div>
        <div class="hash-section">{{ last }}</div>
      </div>
    </router-link>
    <div :class="[hashClass, fontClass]" v-else>
      <div class="hash-section">{{ first }}</div>
      <div class="concat hash-section">{{ middle }}</div>
      <div class="hash-section">{{ last }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class AppTransformHash extends Vue {
  /*
  ===================================================================================
    Props
  ===================================================================================
  */

  @Prop(String) hash!: string
  @Prop({ type: Boolean, default: false }) italic!: boolean
  @Prop(String) link!: string
  @Prop({ type: Boolean, default: true }) isBlue!: boolean
  @Prop({ type: String, default: 'secondary--text' }) fontClass!: string

  /*
  ===================================================================================
    Computed
  ===================================================================================
  */

  get last(): string {
    const n = this.hash.length
    return this.hash.slice(n - 4, n)
  }
  get first(): string {
    return this.hash.slice(0, 4)
  }
  get middle(): string {
    const n = this.hash.length
    return this.hash.slice(4, n - 4)
  }

  get hashClass(): string {
    return this.italic ? 'hash-container font-italic font-mono' : ' hash-container font-mono'
  }

  get url(): string {
    return this.link
  }
}
</script>

<style scoped lang="css">

.concat{
  overflow: hidden;
  text-overflow: ellipsis;

}
.transform-hash-container {
  overflow: hidden;
  display: inline-block;
}
.hash-container {
  min-width: 80px;
  display: flex;
  flex-shrink: 2;
}
.hash-section {
  display: inline;
}
</style>
