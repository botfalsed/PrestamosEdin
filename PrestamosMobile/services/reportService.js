/**
 * Servicio de reportes automáticos para PrestamosMobile
 * Maneja la generación automática de reportes diarios y el reinicio de datos
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import storageService from './storageService';
import mobileApi from './mobileApi';

class ReportService {
  constructor() {
    this.isGeneratingReport = false;
  }

  /**
   * Verifica si es necesario generar un reporte diario y lo genera automáticamente
   */
  async checkAndGenerateDailyReport() {
    try {
      if (this.isGeneratingReport) {
        console.log('📊 [REPORT] Ya se está generando un reporte, saltando...');
        return;
      }

      const shouldGenerate = await storageService.shouldGenerateDailyReport();
      
      if (shouldGenerate) {
        console.log('📊 [REPORT] Iniciando generación de reporte diario automático...');
        await this.generateDailyReport();
      }
    } catch (error) {
      console.error('❌ [REPORT] Error verificando reporte diario:', error);
    }
  }

  /**
   * Genera un reporte diario con todos los datos actuales
   */
  async generateDailyReport() {
    try {
      this.isGeneratingReport = true;
      
      const today = new Date();
      const dateString = today.toLocaleDateString('es-ES');
      const timeString = today.toLocaleTimeString('es-ES');
      
      console.log('📊 [REPORT] Generando reporte para:', dateString);

      // Obtener todos los datos actuales
      const [prestamos, prestatarios, pagos] = await Promise.all([
        storageService.getPrestamos(),
        storageService.getPrestatarios(),
        storageService.getPagos()
      ]);

      // Calcular estadísticas del día
      const stats = this.calculateDailyStats(prestamos, prestatarios, pagos);

      // Crear el reporte
      const report = {
        fecha: dateString,
        hora_generacion: timeString,
        timestamp: today.toISOString(),
        estadisticas: stats,
        datos: {
          prestamos: prestamos,
          prestatarios: prestatarios,
          pagos: pagos
        }
      };

      console.log('📊 [REPORT] Reporte generado:', {
        fecha: report.fecha,
        total_prestamos: stats.total_prestamos,
        total_prestatarios: stats.total_prestatarios,
        total_pagos: stats.total_pagos
      });

      // Intentar enviar el reporte al servidor
      try {
        await this.sendReportToServer(report);
        console.log('✅ [REPORT] Reporte enviado al servidor exitosamente');
      } catch (serverError) {
        console.error('❌ [REPORT] Error enviando reporte al servidor:', serverError);
        // Guardar el reporte localmente si no se puede enviar
        await this.saveReportLocally(report);
      }

      // Marcar que el reporte diario fue generado
      await storageService.markDailyReportGenerated();

      // Programar el reinicio de datos para el próximo día
      this.scheduleNextDayReset();

      console.log('✅ [REPORT] Reporte diario completado');

    } catch (error) {
      console.error('❌ [REPORT] Error generando reporte diario:', error);
    } finally {
      this.isGeneratingReport = false;
    }
  }

  /**
   * Calcula estadísticas diarias basadas en los datos
   */
  calculateDailyStats(prestamos, prestatarios, pagos) {
    const today = new Date().toDateString();
    
    // Filtrar pagos del día actual
    const pagosHoy = pagos.filter(pago => {
      const fechaPago = new Date(pago.fecha_pago).toDateString();
      return fechaPago === today;
    });

    // Calcular totales
    const totalPagosHoy = pagosHoy.reduce((sum, pago) => sum + parseFloat(pago.monto || 0), 0);
    const prestamosActivos = prestamos.filter(p => p.estado === 'activo');
    const prestatariosActivos = prestatarios.filter(p => p.estado === 'activo');

    return {
      fecha: today,
      total_prestamos: prestamos.length,
      prestamos_activos: prestamosActivos.length,
      total_prestatarios: prestatarios.length,
      prestatarios_activos: prestatariosActivos.length,
      total_pagos: pagos.length,
      pagos_hoy: pagosHoy.length,
      monto_total_pagos_hoy: totalPagosHoy,
      saldo_pendiente_total: prestamosActivos.reduce((sum, p) => sum + parseFloat(p.saldo_pendiente || 0), 0)
    };
  }

  /**
   * Envía el reporte al servidor
   */
  async sendReportToServer(report) {
    try {
      const response = await mobileApi.makeRequest('api_postgres.php', {
        method: 'POST',
        body: JSON.stringify({
          action: 'save_daily_report',
          report: report
        })
      });

      return response;
    } catch (error) {
      console.error('❌ [REPORT] Error enviando reporte:', error);
      throw error;
    }
  }

  /**
   * Guarda el reporte localmente si no se puede enviar al servidor
   */
  async saveReportLocally(report) {
    try {
      const reportKey = `daily_report_${report.fecha.replace(/\//g, '_')}`;
      await AsyncStorage.setItem(reportKey, JSON.stringify(report));
      console.log('💾 [REPORT] Reporte guardado localmente:', reportKey);
    } catch (error) {
      console.error('❌ [REPORT] Error guardando reporte localmente:', error);
    }
  }

  /**
   * Programa el reinicio de datos para el próximo día
   */
  scheduleNextDayReset() {
    // Calcular tiempo hasta medianoche
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    console.log('⏰ [REPORT] Programando reinicio en:', Math.round(timeUntilMidnight / 1000 / 60 / 60), 'horas');

    // Programar el reinicio
    setTimeout(async () => {
      await this.performDailyReset();
    }, timeUntilMidnight);
  }

  /**
   * Realiza el reinicio diario de datos
   */
  async performDailyReset() {
    try {
      console.log('🔄 [REPORT] Iniciando reinicio diario...');

      // Generar reporte antes del reinicio
      await this.generateDailyReport();

      // Limpiar datos almacenados (excepto reportes)
      await storageService.clearAllData();

      console.log('✅ [REPORT] Reinicio diario completado');

      // Programar el próximo reinicio
      this.scheduleNextDayReset();

    } catch (error) {
      console.error('❌ [REPORT] Error en reinicio diario:', error);
    }
  }

  /**
   * Inicializa el servicio de reportes
   */
  async initialize() {
    try {
      console.log('🚀 [REPORT] Inicializando servicio de reportes...');

      // Verificar si necesita generar reporte
      await this.checkAndGenerateDailyReport();

      // Programar el próximo reinicio
      this.scheduleNextDayReset();

      console.log('✅ [REPORT] Servicio de reportes inicializado');

    } catch (error) {
      console.error('❌ [REPORT] Error inicializando servicio de reportes:', error);
    }
  }

  /**
   * Fuerza la generación de un reporte manual
   */
  async forceGenerateReport() {
    try {
      console.log('🔧 [REPORT] Generando reporte manual...');
      await this.generateDailyReport();
      return true;
    } catch (error) {
      console.error('❌ [REPORT] Error generando reporte manual:', error);
      return false;
    }
  }
}

// Exportar instancia única
export default new ReportService();