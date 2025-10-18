// =============================================
// ARCHIVO: src/utils/backup.js
// =============================================

/**
 * Sistema de Backup Automático
 * Guarda datos en LocalStorage como respaldo
 */

class BackupManager {
  constructor() {
    this.BACKUP_KEY = 'prestamos_backup';
    this.BACKUP_TIMESTAMP = 'prestamos_backup_timestamp';
    this.AUTO_BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutos
    this.interval = null;
  }

  // Guardar backup
  guardar(data) {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: data
      };

      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));
      localStorage.setItem(this.BACKUP_TIMESTAMP, backup.timestamp);
      
      console.log('💾 Backup guardado:', new Date().toLocaleString());
      return true;
    } catch (error) {
      console.error('❌ Error guardando backup:', error);
      return false;
    }
  }

  // Cargar backup
  cargar() {
    try {
      const backupStr = localStorage.getItem(this.BACKUP_KEY);
      if (!backupStr) {
        console.log('No hay backup disponible');
        return null;
      }

      const backup = JSON.parse(backupStr);
      console.log('📂 Backup cargado:', new Date(backup.timestamp).toLocaleString());
      return backup.data;
    } catch (error) {
      console.error('❌ Error cargando backup:', error);
      return null;
    }
  }

  // Obtener fecha del último backup
  obtenerUltimoBackup() {
    const timestamp = localStorage.getItem(this.BACKUP_TIMESTAMP);
    return timestamp ? new Date(timestamp) : null;
  }

  // Verificar si hay backup disponible
  hayBackup() {
    return localStorage.getItem(this.BACKUP_KEY) !== null;
  }

  // Eliminar backup
  eliminar() {
    localStorage.removeItem(this.BACKUP_KEY);
    localStorage.removeItem(this.BACKUP_TIMESTAMP);
    console.log('🗑️ Backup eliminado');
  }

  // Iniciar backup automático
  iniciarBackupAutomatico(getData) {
    if (this.interval) {
      console.warn('Backup automático ya iniciado');
      return;
    }

    console.log(`💾 Backup automático iniciado (cada ${this.AUTO_BACKUP_INTERVAL/60000} minutos)`);

    this.interval = setInterval(() => {
      const data = getData();
      if (data) {
        this.guardar(data);
      }
    }, this.AUTO_BACKUP_INTERVAL);
  }

  // Detener backup automático
  detenerBackupAutomatico() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('🛑 Backup automático detenido');
    }
  }

  // Exportar backup como archivo JSON
  exportarComoArchivo(data, nombreArchivo = 'backup-prestamos.json') {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: data
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      a.click();
      URL.revokeObjectURL(url);

      console.log('📥 Backup exportado como archivo');
      return true;
    } catch (error) {
      console.error('❌ Error exportando backup:', error);
      return false;
    }
  }

  // Importar backup desde archivo
  importarDesdeArchivo(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target.result);
          console.log('📤 Backup importado desde archivo');
          resolve(backup.data);
        } catch (error) {
          console.error('❌ Error importando backup:', error);
          reject(error);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
}

// Exportar instancia única
const backupManager = new BackupManager();
export default backupManager;


// =============================================
// CÓMO USAR EN TUS COMPONENTES:
// =============================================

// EJEMPLO 1: Backup automático en GestionarPrestamos.js
/*
import backupManager from '../utils/backup';

const GestionarPrestamos = () => {
  const [prestamos, setPrestamos] = useState([]);

  useEffect(() => {
    // Iniciar backup automático
    backupManager.iniciarBackupAutomatico(() => ({
      prestamos: prestamos,
      estadisticas: estadisticas,
      timestamp: new Date()
    }));

    return () => {
      backupManager.detenerBackupAutomatico();
    };
  }, [prestamos, estadisticas]);

  // Guardar backup manual
  const hacerBackupManual = () => {
    const exito = backupManager.guardar({
      prestamos,
      estadisticas
    });
    
    if (exito) {
      setMessage('✅ Backup guardado exitosamente');
    }
  };

  // Restaurar desde backup
  const restaurarBackup = () => {
    const data = backupManager.cargar();
    if (data) {
      setPrestamos(data.prestamos);
      setEstadisticas(data.estadisticas);
      setMessage('✅ Datos restaurados desde backup');
    }
  };

  // Exportar backup
  const exportarBackup = () => {
    backupManager.exportarComoArchivo({
      prestamos,
      estadisticas
    }, `backup-${new Date().toISOString().split('T')[0]}.json`);
  };

  return (
    <div>
      {/* Botón de backup manual *\/}
      <button onClick={hacerBackupManual}>💾 Backup Manual</button>
      <button onClick={restaurarBackup}>📂 Restaurar</button>
      <button onClick={exportarBackup}>📥 Exportar</button>
    </div>
  );
};
*/

// EJEMPLO 2: Indicador de último backup
/*
const UltimoBackup = () => {
  const [ultimoBackup, setUltimoBackup] = useState(null);

  useEffect(() => {
    const fecha = backupManager.obtenerUltimoBackup();
    setUltimoBackup(fecha);

    const interval = setInterval(() => {
      const fecha = backupManager.obtenerUltimoBackup();
      setUltimoBackup(fecha);
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, []);

  if (!ultimoBackup) return null;

  return (
    <div style={{ fontSize: '12px', color: '#666' }}>
      💾 Último backup: {ultimoBackup.toLocaleString()}
    </div>
  );
};
*/
