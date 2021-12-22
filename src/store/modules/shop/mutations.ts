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
  }
}
export default mutations;