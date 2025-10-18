// Configuración global de sincronización

const SYNC_CONFIG = {
  // URL base del API
  API_BASE_URL: 'http://192.168.18.22:8080/api_postgres.php',
  
  // Intervalo de sincronización en milisegundos
  SYNC_INTERVAL: 5000, // 5 segundos
  
  // Intervalo máximo de sincronización (si falla, aumenta)
  MAX_SYNC_INTERVAL: 30000, // 30 segundos
  
  // Número de reintentos antes de fallar
  MAX_RETRIES: 3,
  
  // Timeout para cada petición
  REQUEST_TIMEOUT: 10000, // 10 segundos
  
  // Limpiar cambios antiguos cada cuántos días
  CLEANUP_DAYS: 7,
  
  // Máximo de cambios a obtener por sincronización
  MAX_CHANGES_PER_SYNC: 100,
  
  // Almacenar último timestamp de sincronización en localStorage
  STORAGE_KEY_LAST_SYNC: 'prestamos_last_sync',
  STORAGE_KEY_QUEUE: 'prestamos_sync_queue',
  
  // Tipos de cambios
  CHANGE_TYPES: {
    INSERT: 'INSERT',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE'
  },
  
  // Tablas monitoreadas
  MONITORED_TABLES: ['pagos', 'prestamos', 'prestatarios'],
  
  // Callbacks (se pueden override)
  onSyncSuccess: null,
  onSyncError: null,
  onChangeDetected: null,
  onOffline: null,
  onOnline: null,
};

export default SYNC_CONFIG;
