// =============================================
// ARCHIVO: src/utils/offline.js
// =============================================

/**
 * Sistema de Modo Offline
 * Detecta conexión y sincroniza cuando vuelve online
 */

class OfflineManager {
  constructor() {
    this.online = navigator.onLine;
    this.listeners = [];
    this.colaAcciones = [];
    this.COLA_KEY = 'prestamos_cola_offline';
    this.init();
  }

  // Inicializar listeners
  init() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Cargar cola de acciones pendientes
    this.cargarCola();
  }

  // Cuando vuelve online
  handleOnline() {
    console.log('🟢 Conexión restaurada');
    this.online = true;
    this.notificar('online');
    
    // Procesar acciones pendientes
    this.procesarCola();
  }

  // Cuando se pierde conexión
  handleOffline() {
    console.log('🔴 Sin conexión');
    this.online = false;
    this.notificar('offline');
  }

  // Verificar si está online
  estaOnline() {
    return this.online;
  }

  // Suscribirse a cambios de conexión
  onChange(callback) {
    this.listeners.push(callback);
  }

  // Notificar a los listeners
  notificar(estado) {
    this.listeners.forEach(callback => callback(estado));
  }

  // Guardar acción en cola para ejecutar cuando vuelva online
  agregarACola(accion) {
    this.colaAcciones.push({
      ...accion,
      timestamp: new Date().toISOString()
    });
    
    // Guardar en localStorage
    localStorage.setItem(this.COLA_KEY, JSON.stringify(this.colaAcciones));
    console.log('📝 Acción guardada en cola offline:', accion.tipo);
  }

  // Cargar cola desde localStorage
  cargarCola() {
    try {
      const colaStr = localStorage.getItem(this.COLA_KEY);
      if (colaStr) {
        this.colaAcciones = JSON.parse(colaStr);
        console.log(`📂 ${this.colaAcciones.length} acciones pendientes cargadas`);
      }
    } catch (error) {
      console.error('Error cargando cola:', error);
      this.colaAcciones = [];
    }
  }

  // Procesar cola de acciones cuando vuelve online
  async procesarCola() {
    if (this.colaAcciones.length === 0) {
      console.log('✅ No hay acciones pendientes');
      return;
    }

    console.log(`🔄 Procesando ${this.colaAcciones.length} acciones pendientes...`);

    const acciones = [...this.colaAcciones];
    this.colaAcciones = [];
    localStorage.removeItem(this.COLA_KEY);

    for (const accion of acciones) {
      try {
        await this.ejecutarAccion(accion);
        console.log('✅ Acción ejecutada:', accion.tipo);
      } catch (error) {
        console.error('❌ Error ejecutando acción:', error);
        // Volver a agregar a la cola
        this.agregarACola(accion);
      }
    }
  }

  // Ejecutar una acción
  async ejecutarAccion(accion) {
    switch (accion.tipo) {
      case 'REGISTRAR_PAGO':
        return await this.ejecutarPago(accion.data);
      case 'ARCHIVAR_PRESTAMO':
        return await this.ejecutarArchivar(accion.data);
      case 'REGISTRAR_PRESTAMO':
        return await this.ejecutarRegistrarPrestamo(accion.data);
      default:
        console.warn('Tipo de acción desconocida:', accion.tipo);
    }
  }

  // Ejecutar pago
  async ejecutarPago(data) {
    const response = await fetch('http://localhost:8080/api_postgres.php?action=pago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  // Ejecutar archivar
  async ejecutarArchivar(data) {
    const response = await fetch('http://localhost:8080/api_postgres.php?action=archivar_prestamo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  // Ejecutar registrar préstamo
  async ejecutarRegistrarPrestamo(data) {
    const response = await fetch('http://localhost:8080/api_postgres.php?action=prestamos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  // Obtener cantidad de acciones pendientes
  obtenerAccionesPendientes() {
    return this.colaAcciones.length;
  }
}

// Exportar instancia única
const offlineManager = new OfflineManager();
export default offlineManager;


// =============================================
// CÓMO USAR EN TUS COMPONENTES:
// =============================================

// EJEMPLO 1: Detectar estado de conexión
/*
import offlineManager from '../utils/offline';

const App = () => {
  const [online, setOnline] = useState(offlineManager.estaOnline());

  useEffect(() => {
    offlineManager.onChange((estado) => {
      setOnline(estado === 'online');
      
      if (estado === 'online') {
        // Mostrar notificación
        alert('✅ Conexión restaurada. Sincronizando datos...');
      } else {
        alert('⚠️ Sin conexión. Los cambios se guardarán localmente.');
      }
    });
  }, []);

  return (
    <div>
      {!online && (
        <div style={{
          background: '#ff9800',
          color: 'white',
          padding: '10px',
          textAlign: 'center'
        }}>
          🔴 Modo Offline - Los cambios se sincronizarán cuando vuelvas online
        </div>
      )}
      {/* resto de la app *\/}
    </div>
  );
};
*/

// EJEMPLO 2: Registrar pago con soporte offline
/*
const procesarPago = async () => {
  const pagoData = {
    id_prestamo: parseInt(prestamoSeleccionado.id_prestamo),
    monto_pago: parseFloat(montoPago)
  };

  if (!offlineManager.estaOnline()) {
    // Guardar en cola para ejecutar después
    offlineManager.agregarACola({
      tipo: 'REGISTRAR_PAGO',
      data: pagoData
    });
    
    setMessage('⚠️ Sin conexión. Pago guardado para sincronizar después.');
    return;
  }

  // Si hay conexión, ejecutar normalmente
  try {
    const response = await axios.post('http://localhost:8080/api_postgres.php?action=pago', pagoData);
    // ... resto del código
  } catch (error) {
    console.error(error);
  }
};
*/

// EJEMPLO 3: Indicador de acciones pendientes
/*
const AccionesPendientes = () => {
  const [pendientes, setPendientes] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPendientes(offlineManager.obtenerAccionesPendientes());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (pendientes === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: 20,
      background: '#ff9800',
      color: 'white',
      padding: '10px 15px',
      borderRadius: '8px',
      fontSize: '14px'
    }}>
      📋 {pendientes} acciones pendientes de sincronizar
    </div>
  );
};
*/
