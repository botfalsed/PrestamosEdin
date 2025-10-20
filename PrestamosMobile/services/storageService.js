/**
 * Servicio de almacenamiento para persistencia de datos en PrestamosMobile
 * Maneja el almacenamiento local de datos para evitar pérdida al actualizar/salir de la app
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  constructor() {
    this.KEYS = {
      PRESTAMOS: 'prestamos_data',
      PRESTATARIOS: 'prestatarios_data',
      PAGOS: 'pagos_data',
      LAST_UPDATE: 'last_data_update',
      DAILY_REPORT_DATE: 'daily_report_date',
      APP_STATE: 'app_state'
    };
  }

  /**
   * Guarda los préstamos en el almacenamiento local
   * @param {Array} prestamos - Array de préstamos
   */
  async savePrestamos(prestamos) {
    try {
      await AsyncStorage.setItem(this.KEYS.PRESTAMOS, JSON.stringify(prestamos));
      await this.updateLastUpdate();
      console.log('✅ [STORAGE] Préstamos guardados:', prestamos.length);
    } catch (error) {
      console.error('❌ [STORAGE] Error guardando préstamos:', error);
    }
  }

  /**
   * Obtiene los préstamos del almacenamiento local
   * @returns {Array} Array de préstamos o array vacío
   */
  async getPrestamos() {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.PRESTAMOS);
      const prestamos = data ? JSON.parse(data) : [];
      console.log('📖 [STORAGE] Préstamos cargados:', prestamos.length);
      return prestamos;
    } catch (error) {
      console.error('❌ [STORAGE] Error cargando préstamos:', error);
      return [];
    }
  }

  /**
   * Guarda los prestatarios en el almacenamiento local
   * @param {Array} prestatarios - Array de prestatarios
   */
  async savePrestatarios(prestatarios) {
    try {
      await AsyncStorage.setItem(this.KEYS.PRESTATARIOS, JSON.stringify(prestatarios));
      await this.updateLastUpdate();
      console.log('✅ [STORAGE] Prestatarios guardados:', prestatarios.length);
    } catch (error) {
      console.error('❌ [STORAGE] Error guardando prestatarios:', error);
    }
  }

  /**
   * Obtiene los prestatarios del almacenamiento local
   * @returns {Array} Array de prestatarios o array vacío
   */
  async getPrestatarios() {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.PRESTATARIOS);
      const prestatarios = data ? JSON.parse(data) : [];
      console.log('📖 [STORAGE] Prestatarios cargados:', prestatarios.length);
      return prestatarios;
    } catch (error) {
      console.error('❌ [STORAGE] Error cargando prestatarios:', error);
      return [];
    }
  }

  /**
   * Guarda los pagos en el almacenamiento local
   * @param {Array} pagos - Array de pagos
   */
  async savePagos(pagos) {
    try {
      await AsyncStorage.setItem(this.KEYS.PAGOS, JSON.stringify(pagos));
      await this.updateLastUpdate();
      console.log('✅ [STORAGE] Pagos guardados:', pagos.length);
    } catch (error) {
      console.error('❌ [STORAGE] Error guardando pagos:', error);
    }
  }

  /**
   * Obtiene los pagos del almacenamiento local
   * @returns {Array} Array de pagos o array vacío
   */
  async getPagos() {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.PAGOS);
      const pagos = data ? JSON.parse(data) : [];
      console.log('📖 [STORAGE] Pagos cargados:', pagos.length);
      return pagos;
    } catch (error) {
      console.error('❌ [STORAGE] Error cargando pagos:', error);
      return [];
    }
  }

  /**
   * Actualiza la marca de tiempo de la última actualización
   */
  async updateLastUpdate() {
    try {
      const timestamp = new Date().toISOString();
      await AsyncStorage.setItem(this.KEYS.LAST_UPDATE, timestamp);
    } catch (error) {
      console.error('❌ [STORAGE] Error actualizando timestamp:', error);
    }
  }

  /**
   * Obtiene la fecha de la última actualización
   * @returns {string|null} Fecha de última actualización o null
   */
  async getLastUpdate() {
    try {
      return await AsyncStorage.getItem(this.KEYS.LAST_UPDATE);
    } catch (error) {
      console.error('❌ [STORAGE] Error obteniendo timestamp:', error);
      return null;
    }
  }

  /**
   * Verifica si es necesario generar un reporte diario
   * @returns {boolean} True si es necesario generar reporte
   */
  async shouldGenerateDailyReport() {
    try {
      const lastReportDate = await AsyncStorage.getItem(this.KEYS.DAILY_REPORT_DATE);
      const today = new Date().toDateString();
      
      if (!lastReportDate || lastReportDate !== today) {
        console.log('📊 [STORAGE] Es necesario generar reporte diario');
        return true;
      }
      
      console.log('📊 [STORAGE] Reporte diario ya generado hoy');
      return false;
    } catch (error) {
      console.error('❌ [STORAGE] Error verificando reporte diario:', error);
      return false;
    }
  }

  /**
   * Marca que se ha generado el reporte diario
   */
  async markDailyReportGenerated() {
    try {
      const today = new Date().toDateString();
      await AsyncStorage.setItem(this.KEYS.DAILY_REPORT_DATE, today);
      console.log('✅ [STORAGE] Reporte diario marcado como generado');
    } catch (error) {
      console.error('❌ [STORAGE] Error marcando reporte diario:', error);
    }
  }

  /**
   * Limpia todos los datos almacenados (para reinicio diario)
   */
  async clearAllData() {
    try {
      await AsyncStorage.multiRemove([
        this.KEYS.PRESTAMOS,
        this.KEYS.PRESTATARIOS,
        this.KEYS.PAGOS,
        this.KEYS.LAST_UPDATE,
        this.KEYS.APP_STATE
      ]);
      console.log('🧹 [STORAGE] Todos los datos limpiados');
    } catch (error) {
      console.error('❌ [STORAGE] Error limpiando datos:', error);
    }
  }

  /**
   * Guarda el estado general de la aplicación
   * @param {Object} state - Estado de la aplicación
   */
  async saveAppState(state) {
    try {
      await AsyncStorage.setItem(this.KEYS.APP_STATE, JSON.stringify(state));
      console.log('✅ [STORAGE] Estado de app guardado');
    } catch (error) {
      console.error('❌ [STORAGE] Error guardando estado de app:', error);
    }
  }

  /**
   * Obtiene el estado general de la aplicación
   * @returns {Object|null} Estado de la aplicación o null
   */
  async getAppState() {
    try {
      const data = await AsyncStorage.getItem(this.KEYS.APP_STATE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ [STORAGE] Error cargando estado de app:', error);
      return null;
    }
  }

  /**
   * Verifica si hay datos almacenados
   * @returns {boolean} True si hay datos almacenados
   */
  async hasStoredData() {
    try {
      const prestamos = await AsyncStorage.getItem(this.KEYS.PRESTAMOS);
      const prestatarios = await AsyncStorage.getItem(this.KEYS.PRESTATARIOS);
      return !!(prestamos || prestatarios);
    } catch (error) {
      console.error('❌ [STORAGE] Error verificando datos almacenados:', error);
      return false;
    }
  }
}

// Exportar instancia única
export default new StorageService();