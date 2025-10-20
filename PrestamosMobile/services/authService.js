// Servicio de autenticación para PrestamosMobile
// Maneja la autenticación contra la tabla admin de PostgreSQL

import { apiRequest, buildApiUrl } from '../config/api.js';
import API_CONFIG from '../config/api.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Función helper para manejar storage multiplataforma
const getStorageItem = async (key) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return await AsyncStorage.getItem(key);
};

const setStorageItem = async (key, value) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  return await AsyncStorage.setItem(key, value);
};

const removeStorageItem = async (key) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  return await AsyncStorage.removeItem(key);
};

class AuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.initializeSession();
  }

  /**
   * Inicializa la sesión restaurando datos del AsyncStorage
   */
  async initializeSession() {
    try {
      // Solo restaurar sesión si no estamos en web
      if (typeof window === 'undefined') {
        await this.restoreSession();
      }
    } catch (error) {
      console.error('Error inicializando sesión:', error);
    }
  }

  /**
   * Realiza el login del usuario admin
   * @param {string} usuario - Nombre de usuario
   * @param {string} password - Contraseña
   * @returns {Promise<Object>} - Resultado del login
   */
  async login(usuario, password) {
    try {
      // Validar campos requeridos
      if (!usuario || !password) {
        throw new Error('Usuario y contraseña son requeridos');
      }

      // Preparar datos para el login
      const loginData = {
        usuario: usuario.trim(),
        password: password.trim()
      };

      console.log('Intentando login para usuario:', usuario);

      // Realizar petición de login al backend
      const response = await apiRequest(API_CONFIG.ENDPOINTS.LOGIN_MOBILE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      });

      console.log('Respuesta del servidor:', response);

      // Verificar si el login fue exitoso
      if (response.success) {
        // Guardar información del usuario
        this.currentUser = response.user;
        this.isAuthenticated = true;

        // Persistir la sesión en AsyncStorage
        await setStorageItem('user', JSON.stringify(response.user));
        await setStorageItem('isAuthenticated', 'true');

        console.log('Login exitoso, usuario autenticado:', response.user);

        return {
          success: true,
          user: response.user,
          message: 'Login exitoso'
        };
      } else {
        console.log('Login fallido:', response.error);
        return {
          success: false,
          error: response.error || 'Credenciales inválidas'
        };
      }

    } catch (error) {
      console.error('Error durante el login:', error);
      
      // Limpiar estado en caso de error
      this.currentUser = null;
      this.isAuthenticated = false;

      return {
        success: false,
        error: error.message || 'Error inesperado durante el login'
      };
    }
  }

  /**
   * Cierra la sesión del usuario
   * @returns {Promise<Object>} - Resultado del logout
   */
  async logout() {
    try {
      // Limpiar datos de la sesión
      this.currentUser = null;
      this.isAuthenticated = false;

      // Limpiar AsyncStorage
    await removeStorageItem('user');
    await removeStorageItem('isAuthenticated');

      console.log('Sesión cerrada exitosamente');

      return {
        success: true,
        message: 'Sesión cerrada exitosamente'
      };

    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      return {
        success: false,
        error: 'Error al cerrar sesión'
      };
    }
  }

  /**
   * Obtiene el usuario actual
   * @returns {Object|null} - Usuario actual o null si no está autenticado
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns {boolean} - True si está autenticado, false en caso contrario
   */
  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  /**
   * Verifica la validez del token/sesión (opcional para futuras implementaciones)
   * @returns {Promise<boolean>} - True si la sesión es válida
   */
  async validateSession() {
    try {
      // Por ahora, solo verificamos si hay un usuario en memoria
      // En el futuro se puede implementar validación con el servidor
      return this.isAuthenticated && this.currentUser !== null;
    } catch (error) {
      console.error('Error validando sesión:', error);
      return false;
    }
  }

  /**
   * Establece la sesión del usuario (usado por servicios externos)
   * @param {Object} user - Datos del usuario
   */
  async setUserSession(user) {
    try {
      this.currentUser = user;
      this.isAuthenticated = true;

      // Persistir en AsyncStorage solo si no estamos en web
      if (typeof window === 'undefined') {
        await setStorageItem('user', JSON.stringify(user));
        await setStorageItem('isAuthenticated', 'true');
      }

      console.log('Sesión establecida para usuario:', user.usuario);
      return true;
    } catch (error) {
      console.error('Error estableciendo sesión:', error);
      return false;
    }
  }

  /**
   * Restaura la sesión desde AsyncStorage
   */
  async restoreSession() {
    try {
      // Solo funciona en entornos nativos, no en web
      if (typeof window !== 'undefined') {
        return false;
      }

      const userData = await getStorageItem('user');
      const isAuth = await getStorageItem('isAuthenticated');
      
      if (userData && isAuth === 'true') {
        this.currentUser = JSON.parse(userData);
        this.isAuthenticated = true;
        console.log('Sesión restaurada para usuario:', this.currentUser.usuario);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error restaurando sesión:', error);
      return false;
    }
  }
}

// Exportar instancia singleton del servicio
const authService = new AuthService();
export default authService;