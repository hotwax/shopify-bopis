import { MutationTree } from 'vuex'
import StockState from './StockState'
import * as types from './mutation-types'

const mutations: MutationTree <StockState> = {
  [types.STOCK_PRODUCTS_UPDATED] (state, payload) {
    state.products[payload.productId] = payload.atp;
  }
}
export default mutations;