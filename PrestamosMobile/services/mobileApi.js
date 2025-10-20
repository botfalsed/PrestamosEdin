/**
 * Servicio de API móvil independiente para PrestamosMobile
 * Este servicio maneja exclusivamente las peticiones de la aplicación móvil
 * SIN interferir con la lógica del Dashboard
 */

import { getApiUrl } from '../config/api';

class MobileApiService {
  constructor() {
    this.baseURL = getApiUrl();
    this.timeout = 10000;
  }

  /**
   * Realiza una petición HTTP genérica
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} options - Opciones de la petición
   * @returns {Promise<Object>} Respuesta de la API
   */
  async makeRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}/${endpoint}`;
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: this.timeout,
      ...options
    };

    try {
      console.log(`[MobileAPI] Realizando petición a: ${url}`);
      console.log(`[MobileAPI] Opciones:`, defaultOptions);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log(`[MobileAPI] Respuesta recibida:`, response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[MobileAPI] Datos recibidos:`, data);

      return data;
    } catch (error) {
      console.error(`[MobileAPI] Error en petición a ${url}:`, error);
      
      if (error.name === 'AbortError') {
        throw new Error('Tiempo de espera agotado. Verifica tu conexión.');
      }
      
      throw new Error(error.message || 'Error de conexión con el servidor');
    }
  }

  /**
   * Autentica un usuario usando el endpoint específico para móvil
   * @param {string} usuario - Nombre de usuario
   * @param {string} password - Contraseña
   * @returns {Promise<Object>} Resultado de la autenticación
   */
  async authenticateUser(usuario, password) {
    try {
      console.log(`🔐 [MobileAPI] Iniciando autenticación para usuario: ${usuario}`);
      console.log(`🔐 [MobileAPI] Password length: ${password ? password.length : 0}`);

      if (!usuario || !password) {
        console.log('❌ [MobileAPI] Faltan credenciales - Usuario:', !!usuario, 'Password:', !!password);
        throw new Error('Usuario y contraseña son requeridos');
      }

      const loginData = {
        action: 'login_mobile',
        usuario: usuario.trim(),
        password: password.trim()
      };

      console.log('📤 [MobileAPI] Enviando datos de login:', { 
        action: loginData.action, 
        usuario: loginData.usuario, 
        passwordLength: loginData.password.length 
      });

      const response = await this.makeRequest('api_postgres.php', {
        method: 'POST',
        body: JSON.stringify(loginData)
      });

      console.log('📥 [MobileAPI] Respuesta del backend:', JSON.stringify(response, null, 2));

      // Verificar si la respuesta indica éxito
      if (response && response.success) {
        console.log('✅ [MobileAPI] Autenticación exitosa');
        return {
          success: true,
          user: response.user,
          message: response.message || 'Login exitoso'
        };
      } else {
        console.log('❌ [MobileAPI] Autenticación fallida:', response);
        return {
          success: false,
          error: response.error || response.message || 'Credenciales inválidas'
        };
      }

    } catch (error) {
      console.error('💥 [MobileAPI] Error en authenticateUser:', error);
      console.error('📋 [MobileAPI] Stack trace:', error.stack);
      return {
        success: false,
        error: error.message || 'Error de conexión con el servidor'
      };
    }
  }

  /**
   * Obtiene datos de préstamos
   * @returns {Promise<Object>} Lista de préstamos
   */
  async getPrestamos() {
    try {
      return await this.makeRequest('api_postgres.php?action=prestamos');
    } catch (error) {
      console.error('[MobileAPI] Error obteniendo préstamos:', error);
      throw error;
    }
  }

  /**
   * Obtiene datos de prestatarios
   * @returns {Promise<Object>} Lista de prestatarios
   */
  async getPrestatarios() {
    try {
      return await this.makeRequest('api_postgres.php?action=prestatarios');
    } catch (error) {
      console.error('[MobileAPI] Error obteniendo prestatarios:', error);
      throw error;
    }
  }

  /**
   * Registra un pago
   * @param {Object} pagoData - Datos del pago
   * @returns {Promise<Object>} Resultado del registro
   */
  async registrarPago(pagoData) {
    try {
      return await this.makeRequest('api_postgres.php', {
        method: 'POST',
        body: JSON.stringify({
          action: 'pago',
          ...pagoData
        })
      });
    } catch (error) {
      console.error('[MobileAPI] Error registrando pago:', error);
      throw error;
    }
  }

  /**
   * Sincroniza datos con el servidor
   * @returns {Promise<Object>} Estado de la sincronización
   */
  async syncData() {
    try {
      return await this.makeRequest('api_postgres.php?action=sync');
    } catch (error) {
      console.error('[MobileAPI] Error en sincronización:', error);
      throw error;
    }
  }

  /**
   * Verifica la conectividad con el servidor
   * @returns {Promise<boolean>} Estado de la conexión
   */
  async checkConnection() {
    try {
      const response = await this.makeRequest('api_postgres.php?action=ping', {
        method: 'GET'
      });
      return response.success === true;
    } catch (error) {
      console.error('[MobileAPI] Error verificando conexión:', error);
      return false;
    }
  }
}

// Exportar una instancia única del servicio
export const mobileApiService = new MobileApiService();
export default mobileApiService;