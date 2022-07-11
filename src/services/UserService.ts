import api from '@/api'

const login = async (username: string, password: string): Promise <any> => {
  return api({
    url: "login", 
    method: "post",
    data: {
      'USERNAME': username, 
      'PASSWORD': password
    }
  });
}

const getProfile = async (): Promise <any>  => {
  return api({
    url: "user-profile", 
    method: "get",
  });
}

export const UserService = {
  login,
  getProfile
}