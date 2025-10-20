// PrestamosMobile/services/apiService.js
import axios from 'axios';
import { getApiUrl } from '../config/api';

class ApiService {
  constructor() {
    this.baseURL = getApiUrl();
    this.timeout = 10000; // 10 segundos
  }

  // Función utilitaria para logging detallado
  logRequest(method, url, data = null) {
    console.log(`🔄 [API REQUEST] ${method.toUpperCase()} ${url}`);
    if (data) {
      console.log('📤 [REQUEST DATA]:', JSON.stringify(data, null, 2));
    }
  }

  logResponse(method, url, response) {
    console.log(`✅ [API RESPONSE] ${method.toUpperCase()} ${url} - Status: ${response.status}`);
    console.log('📥 [RESPONSE DATA]:', JSON.stringify(response.data, null, 2));
  }

  logError(method, url, error, rawResponse = null) {
    console.error(`❌ [API ERROR] ${method.toUpperCase()} ${url}`);
    console.error('🔍 [ERROR DETAILS]:', error.message);
    
    if (rawResponse) {
      console.error('📄 [RAW RESPONSE]:', rawResponse);
    }
    
    if (error.response) {
      console.error('📊 [ERROR STATUS]:', error.response.status);
      console.error('📋 [ERROR HEADERS]:', error.response.headers);
      console.error('📄 [ERROR DATA]:', error.response.data);
    } else if (error.request) {
      console.error('📡 [NO RESPONSE RECEIVED]:', error.request);
    }
  }

  // Función para manejar respuestas JSON de forma tolerante
  async parseJsonResponse(response, method, url) {
    try {
      // Si ya es un objeto, devolverlo directamente
      if (typeof response.data === 'object') {
        return response.data;
      }

      // Si es string, intentar parsearlo
      if (typeof response.data === 'string') {
        // Si está vacío, devolver error estructurado
        if (response.data.trim() === '') {
          console.error('⚠️ [EMPTY RESPONSE] Respuesta vacía del servidor');
          return {
            success: false,
            error: 'El servidor devolvió una respuesta vacía',
            raw_response: response.data
          };
        }

        // Intentar parsear JSON
        try {
          return JSON.parse(response.data);
        } catch (parseError) {
          console.error('⚠️ [JSON PARSE ERROR] No se pudo parsear la respuesta como JSON');
          console.error('📄 [RAW RESPONSE]:', response.data);
          return {
            success: false,
            error: 'Respuesta del servidor no es JSON válido',
            raw_response: response.data,
            parse_error: parseError.message
          };
        }
      }

      // Si no es ni objeto ni string, devolver error
      return {
        success: false,
        error: 'Tipo de respuesta inesperado',
        raw_response: response.data
      };
    } catch (error) {
      console.error('⚠️ [RESPONSE PROCESSING ERROR]:', error);
      return {
        success: false,
        error: 'Error procesando respuesta del servidor',
        raw_response: response.data
      };
    }
  }

  // GET request con manejo robusto de errores
  async get(action, params = {}) {
    const url = `${this.baseURL}?action=${action}`;
    const fullUrl = Object.keys(params).length > 0 
      ? `${url}&${new URLSearchParams(params).toString()}`
      : url;

    this.logRequest('GET', fullUrl);

    try {
      const response = await axios.get(fullUrl, {
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      const parsedData = await this.parseJsonResponse(response, 'GET', fullUrl);
      this.logResponse('GET', fullUrl, { ...response, data: parsedData });
      
      return {
        success: true,
        data: parsedData,
        status: response.status
      };
    } catch (error) {
      this.logError('GET', fullUrl, error);
      
      return {
        success: false,
        error: error.message,
        details: {
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        }
      };
    }
  }

  // POST request con manejo robusto de errores
  async post(data) {
    const url = this.baseURL;
    this.logRequest('POST', url, data);

    try {
      const response = await axios.post(url, data, {
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      const parsedData = await this.parseJsonResponse(response, 'POST', url);
      this.logResponse('POST', url, { ...response, data: parsedData });
      
      return {
        success: true,
        data: parsedData,
        status: response.status
      };
    } catch (error) {
      this.logError('POST', url, error);
      
      return {
        success: false,
        error: error.message,
        details: {
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        }
      };
    }
  }

  // PUT request con manejo robusto de errores
  async put(data) {
    const url = this.baseURL;
    this.logRequest('PUT', url, data);

    try {
      const response = await axios.put(url, data, {
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      const parsedData = await this.parseJsonResponse(response, 'PUT', url);
      this.logResponse('PUT', url, { ...response, data: parsedData });
      
      return {
        success: true,
        data: parsedData,
        status: response.status
      };
    } catch (error) {
      this.logError('PUT', url, error);
      
      return {
        success: false,
        error: error.message,
        details: {
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        }
      };
    }
  }

  // DELETE request con manejo robusto de errores
  async delete(data) {
    const url = this.baseURL;
    this.logRequest('DELETE', url, data);

    try {
      const response = await axios.delete(url, {
        data: data,
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      const parsedData = await this.parseJsonResponse(response, 'DELETE', url);
      this.logResponse('DELETE', url, { ...response, data: parsedData });
      
      return {
        success: true,
        data: parsedData,
        status: response.status
      };
    } catch (error) {
      this.logError('DELETE', url, error);
      
      return {
        success: false,
        error: error.message,
        details: {
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        }
      };
    }
  }

  // Métodos específicos para endpoints comunes
  async getPrestamos() {
    return await this.get('prestamos');
  }

  async getPrestatarios() {
    return await this.get('prestatarios');
  }

  async getPagos(idPrestamo) {
    return await this.get('pagos', { id_prestamo: idPrestamo });
  }

  async registrarPago(pagoData) {
    return await this.post({
      action: 'pago',
      ...pagoData
    });
  }

  async sync(lastSync) {
    return await this.get('sync', { last_sync: lastSync });
  }

  async markSynced(ids) {
    return await this.post({
      action: 'mark_synced',
      ids: ids
    });
  }
}

// Crear instancia singleton
const apiService = new ApiService();

export default apiService;