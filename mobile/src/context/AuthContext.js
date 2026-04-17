import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from '../services/api';

const AuthContext = createContext({});

// Configuração global de como exibir notificações com app aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Registra o token Expo Push e salva no backend
async function registerPushToken() {
  try {
    if (!Device.isDevice) return; // Não funciona em emulador

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permissão de notificação negada');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Eu Não Aceito Maus Tratos',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#52B788',
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'eu-nao-aceito-maus-tratos',
    });

    const pushToken = tokenData.data;
    console.log('Push token:', pushToken);

    // Salva no backend
    await api.post('/auth/push-token', { push_token: pushToken });
  } catch (e) {
    console.log('Erro ao registrar push token:', e);
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cityType, setCityType] = useState('prefeitura');

  useEffect(() => {
    loadStoredData();
  }, []);

  // Registra push token sempre que usuário logar
  useEffect(() => {
    if (user) {
      registerPushToken();
    }
  }, [user?.id]);

  // Busca city_type sempre que o user mudar
  useEffect(() => {
    if (user?.city_id) {
      fetchCityType(user.city_id);
    }
  }, [user?.city_id]);

  const fetchCityType = async (cityId) => {
    try {
      const res = await api.get(`/cities/${cityId}`);
      const type = res.data.city?.city_type;
      console.log('cityType fetched:', type, '| city_id:', cityId);
      if (type) {
        setCityType(type);
      }
    } catch (e) {
      console.log('Erro ao buscar city_type:', e);
    }
  };

  const loadStoredData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('causaanimal_token');
      const storedUser = await AsyncStorage.getItem('causaanimal_user');

      if (storedToken && storedUser) {
        api.defaults.headers.Authorization = `Bearer ${storedToken}`;
        try {
          const res = await api.get('/auth/profile');
          if (res.data.user) {
            const updatedUser = res.data.user;
            await AsyncStorage.setItem('causaanimal_user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            return;
          }
        } catch (e) {
          console.log('Usando dados em cache');
        }
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const { token, user } = response.data;
        await AsyncStorage.setItem('causaanimal_token', token);
        await AsyncStorage.setItem('causaanimal_user', JSON.stringify(user));
        api.defaults.headers.Authorization = `Bearer ${token}`;
        setUser(user);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao fazer login'
      };
    }
  };

  const loginWithToken = async (token) => {
    try {
      api.defaults.headers.Authorization = `Bearer ${token}`;
      const res = await api.get('/auth/profile');
      if (res.data.user) {
        const userData = res.data.user;
        await AsyncStorage.setItem('causaanimal_token', token);
        await AsyncStorage.setItem('causaanimal_user', JSON.stringify(userData));
        setUser(userData);
      }
    } catch (error) {
      console.log('Erro ao carregar perfil após verificação:', error);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('causaanimal_token');
    await AsyncStorage.removeItem('causaanimal_user');
    api.defaults.headers.Authorization = null;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, cityType, login, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);