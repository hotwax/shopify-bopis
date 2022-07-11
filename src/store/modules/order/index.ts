import actions from './actions'
import getters from './getters'
import mutations from './mutations'
import { Module } from 'vuex'
import OrderState from './orderState'
import RootState from '@/store/RootState'

const orderModule: Module<OrderState, RootState> = {
  namespaced: true,
  state: {
    draftOrder: {},
    currentOrderId: 0
  },
  getters,
  actions,
  mutations,
}

export default orderModule;

// TODO
// store.registerModule('user', userModule);
