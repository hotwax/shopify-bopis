import api from '@/api';

const generateAccessToken = async (query: any): Promise <any>  => {
  return api({
    url: "/generateShopifyAccessToken",
    method: "post",
    data: query
  });
}

export {
  generateAccessToken
}