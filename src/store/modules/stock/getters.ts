import { GetterTree } from 'vuex'
import StockState from './stockState'
import RootState from '@/store/RootState'

const getters: GetterTree <StockState, RootState> = {
  getProductStock: (state) => (productId: string) => {
    return state.products[productId] ? state.products[productId] : 0
  }
}
export default getters;