import { GetterTree } from 'vuex'
import OrderState from './orderState'
import RootState from '@/store/RootState'

const getters: GetterTree <OrderState, RootState> = {
  getDraftOrder (state) {
    return state.draftOrder;
  },
  getCurrentDraftOrderId (state) {
    return state.currentOrderId;
  }
}
export default getters;