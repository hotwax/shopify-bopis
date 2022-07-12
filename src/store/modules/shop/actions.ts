import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import ShopState from './ShopState'
import * as types from './mutation-types'
import { getShopifyConfigId, getStore } from "@/services"
import { hasError, showToast } from '@/utils'
import { translate } from '@/i18n'

const actions: ActionTree<ShopState, RootState> = {
  setShopToken({ commit }, payload) {
    commit(types.SHOP_TOKEN_UPDATED, { token: payload.token })
  },
  setShop({ commit }, payload) {
    commit(types.SHOP_UPDATED, { shop: payload })
  },
  async getShopifyConfigId({commit}, shop){
    let resp;
    const payload = {
      'inputFields': {
        'apiUrl': 'https://'+shop+'/'
      },
      "entityName": "ShopifyConfig",
      "noConditionFind": "Y",
      "fieldList": ['shopifyConfigId']
    }
    try {
      resp = await getShopifyConfigId(payload);
      if(resp.status == 200 && !hasError(resp) && resp.data.docs){
        commit(types.SHOP_CONFIG_ID_UPDATED, resp.data.docs[0].shopifyConfigId)
      } else {
        console.error(resp);
      }
    } catch (err) {
      console.error(err);
    }
  }, 
  async getStore({commit}) {
    let resp;
    const payload = {
      "viewSize": 20
    }

    try {
      resp = await getStore(payload);
      if(resp.status == 200 && !hasError(resp) && resp.data.response?.docs){
        commit(types.SHOP_STORE_UPDATED, resp.data.response.docs[0])
      } else {
        console.error(resp);
      }
    } catch(err) {
      console.error(err);
    }
  }       
}
export default actions;