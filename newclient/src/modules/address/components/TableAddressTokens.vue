<template>
    <v-card color="white" flat class="pt-3 pr-2 pl-2 pb-0">
        <!--
    =====================================================================================
      hasError
    =====================================================================================
    -->
        <app-error v-if="hasError" :has-error="hasError" :message="error" />
        <!--
    =====================================================================================
      Display Data
    =====================================================================================
    -->
        <div v-else>
            <!--
      =====================================================================================
        Total || Loading
      =====================================================================================
      -->
            <v-progress-linear v-if="loading" color="blue" indeterminate />
            <v-layout v-else justify-space-between align-end row wrap class="pa-2">
                <v-flex xs12 sm6>
                    <!--          <p class="info&#45;&#45;text">-->
                    <!--            {{ $t('token.total') }}-->
                    <!--            <span class="black&#45;&#45;text">{{ totalTokens }}</span>-->
                    <!--            {{ tokensString }}-->
                    <!--            <span v-if="!isRopsten">-->
                    <!--              <span class="black&#45;&#45;text">@ ${{ getTotalMonetaryValue }}</span>-->
                    <!--              {{ $t('usd.value') }}-->
                    <!--            </span>-->
                    <!--          </p>-->
                </v-flex>
                <v-flex xs12 sm6 pt-0>
                    <v-layout v-if="showPaginate" justify-end row>
                        <app-paginate :total="pages" :current-page="page" @newPage="setPage" />
                    </v-layout>
                </v-flex>
            </v-layout>
            <!--
        =====================================================================================
          TABLE HEADER
        =====================================================================================
      -->
            <v-layout align-center justify center>
                <v-flex sm12 hidden-xs-only>
                    <v-card color="info" flat class="white--text mb-1" height="40px">
                        <!-- Standard layout -->
                        <v-layout align-center justify-start row fill-height pl-2 pr-2>
                            <v-flex :sm6="isRopsten" sm4>
                                <v-layout grid-list-xs row align-center justify-start fill-height>
                                    <div class="token-image" />
                                    <h5>{{ $t('token.tokenName') }}</h5>
                                </v-layout>
                            </v-flex>
                            <v-flex :sm6="isRopsten" sm3>
                                <h5>{{ $t('common.amount') }}</h5>
                            </v-flex>
                            <v-flex v-if="!isRopsten" sm3>
                                <h5>{{ $t('usd.value') }}</h5>
                            </v-flex>
                            <v-flex v-if="!isRopsten" sm2>
                                <h5>{{ $t('token.change') }}</h5>
                            </v-flex>
                        </v-layout>
                    </v-card>
                </v-flex>
            </v-layout>
        </div>

        <!--
    =====================================================================================
      TABLE BODY
    =====================================================================================
    -->
        <div v-if="loading">
            <div v-for="i in maxItems" :key="i">
                <table-address-tokens-row-loading :is-ropsten="isRopsten" />
            </div>
        </div>
        <div v-else>
            <v-card v-if="!hasTokens" flat>
                <v-card-text class="text-xs-center secondary--text">{{ $t('message.token.no-tokens-for-address') }}</v-card-text>
            </v-card>
            <div v-for="(token, index) in tokens" v-else :key="index">
                <table-address-tokens-row :token="token" :holder="address" :is-ropsten="isRopsten" />
            </div>
            <v-layout v-if="showPaginate" justify-end row class="pa-2">
                <app-paginate :total="pages" :current-page="page" @newPage="setPage" />
            </v-layout>
        </div>
    </v-card>
</template>

<script lang="ts">
import AppError from '@app/core/components/ui/AppError.vue'
import AppInfoLoad from '@app/core/components/ui/AppInfoLoad.vue'
import TableAddressTokensRow from '@app/modules/addresses/components/TableAddressTokensRow.vue'
import TableAddressTokensRowLoading from '@app/modules/addresses/components/TableAddressTokensRowLoading.vue'
import BN from 'bignumber.js'
import { Component, Prop, Mixins } from 'vue-property-decorator'
import { TokenBalancePageExt, TokenBalancePageExt_items } from '@app/core/api/apollo/extensions/token-balance-page.ext'
import { addressAllTokensOwned, totalTokensValue } from '@app/modules/addresses/addresses.graphql'
import { ConfigHelper } from '@app/core/helper/config-helper'
import AppPaginate from '@app/core/components/ui/AppPaginate.vue'
import { NumberFormatMixin } from '@app/core/components/mixins/number-format.mixin'

const MAX_ITEMS = 10

@Component({
    components: {
        AppPaginate,
        AppError,
        AppInfoLoad,
        TableAddressTokensRow,
        TableAddressTokensRowLoading
    },
    data() {
        return {
            page: 0,
            error: undefined
        }
    },
    apollo: {
        tokensPage: {
            query: addressAllTokensOwned,

            variables() {
                const { address } = this

                return {
                    address,
                    offset: 0,
                    limit: MAX_ITEMS
                }
            },

            update({ tokens }) {
                if (tokens) {
                    this.error = '' // clear the error
                    return new TokenBalancePageExt(tokens)
                }
                this.error = this.error || this.$i18n.t('message.err')
                return tokens
            },

            error({ graphQLErrors, networkError }) {
                // TODO refine
                if (networkError) {
                    this.error = this.$i18n.t('message.no-data')
                }
            }
        }
        // totalTokensValue: {
        //   query: totalTokensValue,
        //   variables() {
        //     return { address: this.address }
        //   },
        //   update({ totalTokensValue }) {
        //     return totalTokensValue ? new BN(totalTokensValue) : null
        //   },
        //   error({ graphQLErrors, networkError }) {
        //     // TODO refine
        //     if (networkError) {
        //       this.error = this.$i18n.t('message.no-data')
        //     }
        //   }
        // }
    }
})
export default class TableAddressTokens extends Mixins(NumberFormatMixin) {
    /*
  ===================================================================================
    Props
  ===================================================================================
  */

    @Prop(String) address!: string

    /*
  ===================================================================================
    Initial Data
  ===================================================================================
  */

    tokensPage?: TokenBalancePageExt
    error?: string
    page?: number
    totalTokensValue?: BN

    isRopsten = ConfigHelper.isRopsten

    /*
  ===================================================================================
    Lifecycle
  ===================================================================================
  */

    mounted() {
        this.$apollo.queries.tokensPage.refetch()
    }

    /*
  ===================================================================================
    Methods
  ===================================================================================
  */

    getBalance(value, decimals): BN {
        return new BN(value).div(new BN(10).pow(decimals))
    }

    /**
     * Upon page update from AppPagination, set page equal to pagination page.
     */
    setPage(page: number): void {
        const { tokensPage: query } = this.$apollo.queries

        const self = this

        query.fetchMore({
            variables: {
                address: self.address,
                offset: page * this.maxItems,
                limit: this.maxItems
            },
            updateQuery: (previousResult, { fetchMoreResult }) => {
                self.page = page
                return fetchMoreResult
            }
        })
    }

    /*
  ===================================================================================
    Computed Values
  ===================================================================================
  */

    get tokens(): (TokenBalancePageExt_items | undefined)[] {
        return this.tokensPage ? this.tokensPage.items || [] : []
    }

    get loading(): boolean | undefined {
        return this.$apollo.loading
    }

    get hasError(): boolean {
        return !!this.error && this.error !== ''
    }

    /**
     * @return {Number} - MAX_ITEMS per pagination page
     */
    get maxItems(): number {
        return MAX_ITEMS
    }

    /**
     * @return {Boolean} - Whether to display pagination component
     */
    get showPaginate(): boolean {
        return this.pages > 1 && !this.hasError
    }

    get pages(): number {
        const { tokensPage, maxItems } = this
        return tokensPage ? Math.ceil(tokensPage.totalCountBN.div(maxItems).toNumber()) : 0
    }

    get getTotalMonetaryValue(): string {
        if (this.loading) {
            return this.$i18n.t('message.load').toString()
        }
        return this.totalTokensValue ? this.totalTokensValue.toFormat(2).toString() : '0.00'
    }

    get hasTokens(): boolean {
        return !!(this.tokensPage && this.tokensPage.items && this.tokensPage.items.length)
    }

    // get totalTokens(): string {
    //   if (this.loading) {
    //     return this.$i18n.t('message.load').toString()
    //   }
    //   return this.formatFloatingPointValue(this.totalCount).value
    // }

    // get tokensString(): string {
    //   return new BN(this.totalCount).isGreaterThan(1) ? this.$i18n.tc('token.name', 2) : this.$i18n.tc('token.name', 1)
    // }
}
</script>
