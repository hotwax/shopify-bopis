import api from '@/api'

const getDraftOrder = async (payload: any): Promise <any>  => {
  return api({
    url: "service/getShopifyDraftOrder",
    method: "post",
    data: payload
  });
}
  
const updateDraftOrder = async (payload: any): Promise <any>  => {
  return api({
    url: "service/updateShopifyDraftOrder",
    method: "post",
    data: payload
  });
}

export const OrderService = {
  getDraftOrder,
  updateDraftOrder
}