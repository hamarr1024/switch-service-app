import axios, { AxiosInstance, AxiosRequestConfig } from "axios";


export const createAxios = (
    config?: AxiosRequestConfig
  ): AxiosInstance => {
    const instance = axios.create({
      timeout: 5000,    //超时配置
      withCredentials: true,  //跨域携带cookie
      ...config,   // 自定义配置覆盖基本配置
    });

    const responseSuccess = response => {
        return Promise.resolve(response.data)
    }

    const responseFailed = error => {
        const { response } = error
        if (response) {
            return Promise.reject('No response')
        } 
        return Promise.reject(error)
    }

    instance.interceptors.response.use(responseSuccess, responseFailed)
    return instance;
  };



  