// Configuración centralizada de API para PrestamosMobile
// Esta configuración debe coincidir con la del Dashboard para usar la misma base de datos

const API_CONFIG = {
  // URL base del backend (desde variables de entorno o fallback)
  BASE_URL: process.env.API_BASE_URL || 'http://localhost:8080/api_postgres.php',
  
  // Configuración para desarrollo local
  DEV_URL: 'http://localhost:8080/api_postgres.php',
  
  // Configuración para red local (si necesitas acceder desde dispositivo físico)
  // Cambia esta IP por la IP de tu computadora en la red local
  LOCAL_NETWORK_URL: 'http://192.168.1.100:8080/api_postgres.php',
  
  // Timeout para peticiones (desde variables de entorno o fallback)
  TIMEOUT: parseInt(process.env.API_TIMEOUT) || 10000,
  
  // Headers por defecto
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Endpoints específicos
  ENDPOINTS: {
    LOGIN_MOBILE: '?action=login_mobile',
    PRESTAMOS: '?action=prestamos',
    PRESTATARIOS: '?action=prestatarios',
    PAGOS: '?action=pagos',
  },
};

// Función para obtener la URL correcta según el entorno
export const getApiUrl = () => {
  // IMPORTANTE: Para que PrestamosMobile use la misma base de datos que el Dashboard,
  // debe apuntar a localhost:8080 (donde está corriendo el backend PHP)
  
  // Prioridad: Variable de entorno > Configuración de desarrollo
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  
  // Fallback a configuración de desarrollo (solo la base sin el archivo PHP)
  return 'http://localhost:8080';
};

// Función para construir URL completa con endpoint
export const buildApiUrl = (endpoint) => {
  return getApiUrl() + endpoint;
};

// Configuración de axios por defecto
export const axiosConfig = {
  baseURL: getApiUrl(),
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS,
};

// Función para realizar peticiones HTTP con manejo de errores
export const apiRequest = async (endpoint, options = {}) => {
  const url = buildApiUrl(endpoint);
  const config = {
    method: 'GET',
    headers: API_CONFIG.DEFAULT_HEADERS,
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

export default API_CONFIG;