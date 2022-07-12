import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import OrderState from './orderState'
import * as types from './mutation-types'
import { OrderService } from '@/services/OrderService'
import { hasError, showToast } from '@/utils'
import { translate } from '@/i18n'

const actions: ActionTree<OrderState, RootState> = {
  async getDraftOrder ({ commit }, params) {
    const payload = {
      draftOrderId: params.id,
      shopifyConfigId: params.configId
    }
    try {
      const resp = await OrderService.getDraftOrder(payload);
      if (resp.status === 200 && !hasError(resp) && resp.data.response.draft_order) {
        const productId = resp.data.response.draft_order.line_items.map((item: any) => { return item.sku });
        const store = this.getters['shop/getStore'];
        this.dispatch('stock/checkInventory', {productId, facilityId: store.storeCode});
        const order = resp.data.response.draft_order;
        commit(types.DRAFT_ORDER_UPDATED, order);
      } else {
        console.error(resp);
        showToast(translate("Something went wrong"));
      }
    } catch (err) {
      console.error(err);
      showToast(translate("Something went wrong"));
    }
  },

  async updateDraftOrder ({dispatch}, payload) {
    let resp;
    const params = {
      draftOrderId: payload.id,
      payload: {"draft_order": {"line_items": payload.lineItems}},
      shopifyConfigId: payload.configId
    }
    try {
      resp = await OrderService.updateDraftOrder(params);
      if (resp.status === 200 && !hasError(resp)) {
        showToast(translate("Order Updated successfully."));
        await dispatch('getDraftOrder', {id: payload.id, configId: payload.configId});
      } else {
        console.error(resp);
        showToast(translate("Something went wrong"));
      }
    } catch (err) {
      console.error(err);
      showToast(translate("Something went wrong"));
    }
  },

  setCurrentDraftOrderId({commit}, payload){
    commit(types.DRAFT_ORDER_ID_UPDATED, payload);
  }
}
export default actions;