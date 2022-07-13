import api, { client } from '@/api';

const generateAccessToken = async (config: any): Promise <any> => {
  return client({
    url: "/generateShopifyAccessToken",
    method: "post",
    ...config
  });
}

const getShopifyConfigId = async (payload: any): Promise <any> => {
  return api({
    url: "performFind",
    method: "post",
    data: payload
  });
}

const getStore = async (payload: any): Promise <any> => {
  return api({
    url: "storeLookup",
    method: 'post',
    data: payload
  })
}

export {
  generateAccessToken,
  getShopifyConfigId,
  getStore
}