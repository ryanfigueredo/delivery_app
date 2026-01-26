import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'https://delivery-back-eosin.vercel.app';

export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  tenant_id?: string | null;
}

const STORAGE_KEYS = {
  USER: '@auth:user',
  SESSION_TOKEN: '@auth:session',
};

class AuthService {
  private currentUser: User | null = null;

  /**
   * Faz login e armazena as credenciais
   */
  async login(username: string, password: string): Promise<User> {
    try {
      // Tentar primeiro a API mobile, depois a API web
      let response;
      try {
        response = await axios.post<{ success: boolean; user: User }>(
          `${API_BASE_URL}/api/auth/mobile-login`,
          { username, password },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      } catch (mobileError: any) {
        // Se a API mobile não existir, tentar a API web
        if (mobileError.response?.status === 404) {
          response = await axios.post<{ success: boolean; user: User }>(
            `${API_BASE_URL}/api/auth/login`,
            { username, password },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
        } else {
          throw mobileError;
        }
      }

      if (response.data.success && response.data.user) {
        const user = response.data.user;
        await this.setUser(user);
        // Armazenar credenciais para uso nas requisições autenticadas
        await AsyncStorage.setItem('@auth:username', username);
        await AsyncStorage.setItem('@auth:password', password);
        return user;
      }

      throw new Error('Credenciais inválidas');
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Usuário ou senha incorretos');
      }
      throw new Error(error.response?.data?.error || 'Erro ao fazer login');
    }
  }

  /**
   * Faz logout
   */
  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER,
      STORAGE_KEYS.SESSION_TOKEN,
      '@auth:username',
      '@auth:password',
    ]);
    this.currentUser = null;
  }

  /**
   * Obtém as credenciais armazenadas
   */
  async getCredentials(): Promise<{ username: string; password: string } | null> {
    try {
      const username = await AsyncStorage.getItem('@auth:username');
      const password = await AsyncStorage.getItem('@auth:password');
      if (username && password) {
        return { username, password };
      }
    } catch (error) {
      console.error('Erro ao obter credenciais:', error);
    }
    return null;
  }

  /**
   * Verifica se o usuário está autenticado
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getUser();
    return user !== null;
  }

  /**
   * Obtém o usuário atual
   */
  async getUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userJson) {
        this.currentUser = JSON.parse(userJson);
        return this.currentUser;
      }
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
    }

    return null;
  }

  /**
   * Armazena o usuário
   */
  private async setUser(user: User): Promise<void> {
    this.currentUser = user;
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  /**
   * Obtém o token de sessão (se necessário no futuro)
   */
  async getSessionToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    } catch (error) {
      return null;
    }
  }

  /**
   * Valida se a sessão ainda é válida fazendo uma requisição ao servidor
   */
  async validateSession(): Promise<boolean> {
    try {
      const user = await this.getUser();
      if (!user) {
        return false;
      }

      // Tentar fazer uma requisição autenticada para validar a sessão
      // Por enquanto, apenas verifica se temos um usuário armazenado
      // No futuro, pode fazer uma chamada para /api/auth/me
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const authService = new AuthService();
