import { GetterTree } from 'vuex'
import UserState from './UserState'
import RootState from '@/store/RootState'

const getters: GetterTree <UserState, RootState> = {
  isAuthenticated (state) {
    return !!state.token;
  },
  isUserAuthenticated(state) {
    return state.token && state.current
  },
  getUserToken (state) {
    return state.token
  },
  getInstanceUrl (state) {
    return state.instanceUrl;
  },
  getUserProfile (state) {
    return state.current
  }
}
export default getters;