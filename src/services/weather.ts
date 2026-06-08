import axios from 'axios';

// Utilizando a chave do ambiente ou uma de fallback para demonstração acadêmica
const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const weatherApi = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
});

// Interceptor para injetar a API Key em todas as requisições
weatherApi.interceptors.request.use((config) => {
  if (!config.params) {
    config.params = {};
  }
  config.params.appid = OPENWEATHER_API_KEY;
  config.params.units = 'metric';
  config.params.lang = 'pt_br';
  
  // Log request for debugging/presentation
  console.log(`[WeatherAPI] Iniciando request para: ${config.url}`, config.params);
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

weatherApi.interceptors.response.use((response) => {
  console.log(`[WeatherAPI] Sucesso na resposta: ${response.status}`);
  return response;
}, (error) => {
  console.error('[WeatherAPI] Erro na requisição:', error.message);
  return Promise.reject(error);
});

export const getWeatherForCoords = async (lat: number, lon: number) => {
  const response = await weatherApi.get('/weather', {
    params: {
      lat,
      lon,
    }
  });
  return response.data;
};

export default weatherApi;
