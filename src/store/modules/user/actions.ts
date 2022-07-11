import { UserService } from '@/services/UserService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import UserState from './UserState'
import { hasError, showToast } from '@/utils'
import * as types from './mutation-types'
import { translate } from '@/i18n'
import store from '@/store'

const actions: ActionTree<UserState, RootState> = {
  async login ({ commit, dispatch }, { username, password }) {
    try {
      const resp = await UserService.login(username, password)
      if (resp.status === 200 && resp.data) {
        if (resp.data.token) {
          commit(types.USER_TOKEN_CHANGED, { newToken: resp.data.token })
          await dispatch('getProfile')
          return resp.data;
        } else if (hasError(resp)) {
          showToast(translate('Sorry, your username or password is incorrect. Please try again.'));
          console.error("error", resp.data._ERROR_MESSAGE_);
          return Promise.reject(new Error(resp.data._ERROR_MESSAGE_));
        }
      } else {
        showToast(translate('Something went wrong'));
        console.error("error", resp.data._ERROR_MESSAGE_);
        return Promise.reject(new Error(resp.data._ERROR_MESSAGE_));
      }
    } catch (err: any) {
      showToast(translate('Something went wrong'));
      console.error("error", err);
      return Promise.reject(new Error(err))
    }
    // return resp
  },
  async logout ({ commit }) {
    // TODO add any other tasks if need
    // TODO need to import shop mutation types to use mutation type to commit the mutation.
    store.commit('shop/shop/CONFIG_ID_UPDATED', "");
    commit(types.USER_END_SESSION)
  },
  
  setUserInstanceUrl ({ commit }, instanceUrl){
    commit(types.USER_INSTANCE_URL_UPDATED, instanceUrl)
  },

  async getProfile ( { commit }) {
    const resp = await UserService.getProfile()
    if (resp.status === 200) {
      commit(types.USER_INFO_UPDATED, resp.data);
    }
  },

  
}
export default actions;