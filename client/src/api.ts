import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Android emulator -> 10.0.2.2 ; physical phone -> your PC's LAN IP, e.g. http://192.168.1.20:4000
export const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    'EXPO_PUBLIC_API_URL is missing. Please configure your client/.env file.'
  );
}

export const api = axios.create({ baseURL: API_URL, timeout: 10000 });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});