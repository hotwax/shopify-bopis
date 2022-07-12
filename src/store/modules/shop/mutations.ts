import { MutationTree } from 'vuex'
import ShopState from './ShopState'
import * as types from './mutation-types'

const mutations: MutationTree <ShopState> = {
  [types.SHOP_TOKEN_CHANGED] (state, payload) {
    state.token = payload.newToken
  },
  [types.SHOP_UPDATED] (state, payload) {
    state.shop = payload.shop;
  },
  [types.SHOP_TOKEN_UPDATED] (state, payload) {
    state.token = payload.token;
  },
  [types.SHOP_CONFIG_ID_UPDATED] (state, payload) {
    state.configId = payload;
  },
  [types.SHOP_STORE_UPDATED] (state, payload) {
    state.store = payload
  }

}
export default mutations;