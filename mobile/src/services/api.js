import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://eu-nao-aceito-maus-tratos-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Adiciona token em todas as requisições
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('causaanimal_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.log('Erro ao buscar token:', error);
  }
  return config;
});

export default api;