/* Apolo:  */
import { InMemoryCache } from 'apollo-cache-inmemory'
import ApolloClient from 'apollo-client'
import { split } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import { WebSocketLink } from 'apollo-link-ws'
import { getMainDefinition } from 'apollo-utilities'
import VueApollo from 'vue-apollo'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { onError } from 'apollo-link-error'
/* Other */
import Vuetify from 'vuetify/lib'
import 'vuetify/src/stylus/app.styl'
import '@fortawesome/fontawesome-free/css/all.css'
import configs from './configs'
import router from '@app/core/router'
import App from '@app/modules/App.vue'
import i18n from '@app/translations'
import * as Sentry from '@sentry/browser'
import Vue from 'vue'

/*
  ===================================================================================
    Vue: Plugins Configuration
  ===================================================================================
*/
Vue.config.productionTip = false

// -------------------------------------------------------
//    APIs: Apollo (GraphQL)
// -------------------------------------------------------

const httpLink = new HttpLink({
    uri: configs.APOLLO_HTTP
})

const subscriptionClient = new SubscriptionClient(configs.APOLLO_WS, { lazy: true, reconnect: true }, null, [])

const wsLink = new WebSocketLink(subscriptionClient)

//For Development use Only:
const onErrorLink = onError(({ graphQLErrors }) => {
    // Log every GraphQL errors
    if (graphQLErrors) {
        graphQLErrors.map(({ message, locations, path }) => console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`))
    }
})
const link = split(
    // split based on operation type
    ({ query }) => {
        const definition = getMainDefinition(query)
        return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
    },
    wsLink,
    onErrorLink.concat(httpLink)
)

const cache = new InMemoryCache()
const apolloClient = new ApolloClient({
    link,
    cache,
    connectToDevTools: configs.NODE_ENV === 'development'
    // resolvers
})

const apolloProvider = new VueApollo({
    defaultClient: apolloClient
})

Vue.use(VueApollo)

// -------------------------------------------------------
//    Vuetify
// -------------------------------------------------------

Vue.use(Vuetify, {
    theme: {
        // used -->
        primary: '#3d55a5',
        secondary: '#6270fc',
        accent: '#4a67c6',
        success: '#92cce1',
        warning: '#fed9a1',
        error: '#fe8778',
        info: '#8391a8',
        nav: '#a0a8fd',
        txSuccess: '#00b173',
        txFail: '#fe1377',
        txPen: '#eea66b',
        lineGrey: '#efefef',
        tableGrey: '#fbfcfe',
        tabActive: '#3844b8',
        uncleGrey: '#eff1f6',
        sync: '#ffe7d6',
        bttnGrey: '#dee5f0',
        bttnToken: '#b4bfd2',
        bttnReport: '#1EEEA6',
        linkBlue: '#3965e8'

        // used -->
        // background: String(colors.grey.darken3)
    },
    iconfont: 'fa', // use font awesome icons,
    icons: {
        expand: 'fa-chevron-down fa-1x',
        dropdown: 'fa-caret-down fa-1x'
    }
})

/*
  ===================================================================================
    Vue: Application Kickstart
  ===================================================================================
*/

new Vue({
    el: '#app',
    router,
    i18n,
    apolloProvider,
    components: {
        App
    },
    data: {},
    template: '<App/>'
})

/*
  ===================================================================================
    Sentry
  ===================================================================================
*/

const sentryToken = process.env.VUE_APP_SENTRY_SECURITY_TOKEN
if (sentryToken) {
    Sentry.init({
        dsn: sentryToken,
        integrations: [new Sentry.Integrations.Vue({ Vue })],
        maxBreadcrumbs: 0
    })
}
