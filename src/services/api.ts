import axios, { InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export let API_URL = 'https://carboneye-api.onrender.com';

if (__DEV__) {
  API_URL = Platform.OS === 'android' ? 'http://192.168.0.7:3000' : 'http://localhost:3000';
}
const api = axios.create({
  baseURL: API_URL,
  timeout: 120000,
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    try {
      const token = await AsyncStorage.getItem('@carboneye:token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error fetching auth token for request:', e);
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error: any) => {
    // Verificar se é um erro de integração padronizado pelo backend
    const msg = error.response?.data?.message || '';
    
    // O erro será repassado e deverá ser tratado pela interface ou pelo React Query
    if (typeof msg === 'string' && msg.includes('INTEGRATION_ERROR')) {
      // Interceptado silenciosamente aqui, mas a interface fará o Alert
      console.warn('Erro de integração interceptado no backend');
    }
    
    // Tenta enviar o log de erro para o backend silenciosamente
    try {
      const isPostLog = error.config && error.config.url === '/logs';
      if (!isPostLog) {
        axios.post(`${API_URL}/logs`, {
          acao: 'Frontend Error',
          nivel: 'ERROR',
          detalhes: {
            url: error.config?.url,
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
          }
        }).catch(() => { /* Ignora erro ao tentar logar para evitar loop */ });
      }
    } catch (e) {
      // Catch genérico do logger
    }

    return Promise.reject(error);
  }
);

export default api;
