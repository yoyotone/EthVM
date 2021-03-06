<template>
  <v-card color="white" flat class="pt-3 pb-2 mt-0">
    <!--
    =====================================================================================
      TITLE
    =====================================================================================
    -->
    <app-table-title :page-type="pageType" :title="$tc('uncle.name', 2)" :has-pagination="hasPagination">
      <template v-slot:update>
        <notice-new-block @reload="resetFromUncle" page-id="uncle" />
      </template>
      <template v-slot:pagination v-if="hasPagination">
        <app-paginate :total="pages" @newPage="setPage" :current-page="page" />
      </template>
    </app-table-title>
    <!--
    =====================================================================================
      LOADING / ERROR
    =====================================================================================
    -->
    <v-progress-linear color="blue" indeterminate v-if="loading && !hasError" class="mt-0" />
    <app-error :has-error="hasError" :message="error" class="mb-4" />
    <!--
    =====================================================================================
      TABLE HEADER
    =====================================================================================
    -->
    <v-layout class="pl-2 pr-2">
      <v-flex hidden-xs-only sm12>
        <v-card v-if="!hasError" color="info" flat class="white--text pl-3 pr-1" height="40px">
          <v-layout align-center justify-start row fill-height pr-3>
            <v-flex xs6 sm2 md2>
              <h5>{{ $t('block.block') }}</h5>
            </v-flex>
            <v-flex xs6 sm2 md2>
              <h5>{{ $t('uncle.number') }}</h5>
            </v-flex>
            <v-flex sm5 md5 hidden-sm-and-down>
              <h5>{{ $t('uncle.detail') }}</h5>
            </v-flex>
            <v-spacer />
            <v-flex hidden-sm-and-down md1>
              <h5>{{ $t('uncle.position') }}</h5>
            </v-flex>
            <v-flex xs6 sm3 md2>
              <h5>{{ $t('miner.reward-short') }}</h5>
            </v-flex>
          </v-layout>
        </v-card>
      </v-flex>
    </v-layout>
    <!--
    =====================================================================================
      TABLE BODY
    =====================================================================================
    -->
    <v-layout column fill-height class="pa-2">
      <v-flex xs12 v-if="!loading && !error">
        <v-card-text v-if="!uncles.length" class="text-xs-center secondary--text">{{ $t('message.uncle.no-uncles') }}</v-card-text>
        <v-card v-else v-for="(uncle, index) in uncles" class="transparent" flat :key="index">
          <table-uncles-row :uncle="uncle" :page-type="pageType" />
        </v-card>
        <v-layout justify-end v-if="hasPagination" class="pb-1 pt-2 pr-2 pl-2">
          <app-paginate :total="pages" @newPage="setPage" :current-page="page" />
        </v-layout>
      </v-flex>
      <v-flex xs12 v-if="loading">
        <div v-for="i in maxItems" :key="i">
          <table-uncles-row-loading />
        </div>
      </v-flex>
    </v-layout>
  </v-card>
</template>

<script lang="ts">
import AppError from '@app/core/components/ui/AppError.vue'
import AppInfoLoad from '@app/core/components/ui/AppInfoLoad.vue'
import AppPaginate from '@app/core/components/ui/AppPaginate.vue'
import AppTableTitle from '@app/core/components/ui/AppTableTitle.vue'
import TableUnclesRow from '@app/modules/uncles/components/TableUnclesRow.vue'
import TableUnclesRowLoading from '@app/modules/uncles/components/TableUnclesRowLoading.vue'
import { Vue, Component, Prop } from 'vue-property-decorator'
import { UncleSummaryPageExt } from '@app/core/api/apollo/extensions/uncle-summary-page.ext'
import { uncleSummaries } from '@app/modules/uncles/uncles.graphql'
import BigNumber from 'bignumber.js'
import NoticeNewBlock from '@app/modules/blocks/components/NoticeNewBlock.vue'
import { Subscription } from 'rxjs'

@Component({
  components: {
    AppError,
    AppInfoLoad,
    AppPaginate,
    AppTableTitle,
    TableUnclesRow,
    TableUnclesRowLoading,
    NoticeNewBlock
  },
  data() {
    return {
      page: 0,
      fromUncle: undefined,
      error: '',
      syncing: undefined
    }
  },
  apollo: {
    unclePage: {
      query: uncleSummaries,

      variables() {
        const self = this as any
        return {
          offset: 0,
          limit: self.maxItems
        }
      },

      update({ summaries }) {
        const self = this as any

        if (summaries) {
          self.error = '' // clear error
          return new UncleSummaryPageExt(summaries)
        } else if (!this.syncing) {
          self.error = this.error || this.$i18n.t('message.err')
        }
        return summaries
      },

      error({ graphQLErrors, networkError }) {
        const self = this

        if (graphQLErrors) {
          graphQLErrors.forEach(error => {
            switch (error.message) {
              case 'Currently syncing':
                // TODO handle this better with custom code or something
                self.syncing = true
                break
              default:
              // Do nothing
            }
          })
        }
        // TODO refine
        if (networkError) {
          this.error = this.$i18n.t('message.no-data')
        }
      }
    }
  }
})
export default class TableUncles extends Vue {
  /*
    ===================================================================================
      Props
    ===================================================================================
    */

  @Prop({ type: String, default: '' }) showStyle!: string
  @Prop(Number) maxItems!: number

  /*
    ===================================================================================
      Initial Data
    ===================================================================================
    */

  page!: number
  error: string = ''
  syncing?: boolean

  pageType = 'uncles'
  fromUncle?: BigNumber

  unclePage?: UncleSummaryPageExt

  connectedSubscription?: Subscription

  /*
      ===================================================================================
        Lifecycle
      ===================================================================================
      */

  created() {
    this.connectedSubscription = this.$subscriptionState.subscribe(async state => {
      if (state === 'reconnected') {
        this.$apollo.queries.unclePage.refetch()
      }
    })
  }

  destroyed() {
    if (this.connectedSubscription) {
      this.connectedSubscription.unsubscribe()
    }
  }

  /*
    ===================================================================================
      Methods
    ===================================================================================
    */

  resetFromUncle() {
    this.setPage(0, true)
  }

  setPage(page: number, resetFrom: boolean = false): void {
    const { unclePage } = this
    const { unclePage: query } = this.$apollo.queries

    if (resetFrom) {
      this.fromUncle = undefined
    } else {
      const { items } = unclePage!
      if (!this.fromUncle && items.length) {
        this.fromUncle = items[0].number
      }
    }

    query.fetchMore({
      variables: {
        fromUncle: this.fromUncle ? this.fromUncle.toString(10) : undefined,
        offset: page * 50,
        limit: this.maxItems
      },
      updateQuery: (previousResult, { fetchMoreResult }) => {
        this.page = page
        return fetchMoreResult
      }
    })
  }

  /*
    ===================================================================================
      Computed Values
    ===================================================================================
    */

  get uncles() {
    return this.unclePage ? this.unclePage.items || [] : []
  }

  get loading(): boolean | undefined {
    return this.$apollo.loading || this.syncing
  }

  /**
   * Determines whether or not component has an error.
   * If error property is empty string, there is no error.
   *
   * @return {Boolean} - Whether or not error exists
   */
  get hasError(): boolean {
    return this.error !== ''
  }

  get style(): string {
    return this.showStyle
  }

  get pages(): number {
    const { unclePage, maxItems } = this
    return unclePage ? Math.ceil(unclePage.totalCountBN.div(maxItems).toNumber()) : 0
  }
  get hasPagination(): boolean {
    return this.pages > 1 && !this.hasError
  }
}
</script>
