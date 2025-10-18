// =============================================
// ARCHIVO: src/utils/notificaciones.js
// =============================================

/**
 * Sistema de Notificaciones Push para el Sistema de Préstamos
 */

class NotificationManager {
  constructor() {
    this.permiso = null;
    this.init();
  }

  // Inicializar y pedir permiso
  async init() {
    if (!("Notification" in window)) {
      console.warn("Este navegador no soporta notificaciones");
      return false;
    }

    if (Notification.permission === "granted") {
      this.permiso = true;
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      this.permiso = permission === "granted";
      return this.permiso;
    }

    return false;
  }

  // Verificar si están habilitadas
  estaHabilitado() {
    return this.permiso && Notification.permission === "granted";
  }

  // Mostrar notificación
  mostrar(titulo, opciones = {}) {
    if (!this.estaHabilitado()) {
      console.log("Notificaciones no habilitadas");
      return;
    }

    const opcionesDefault = {
      icon: '/logo192.png', // Logo de tu app
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      ...opciones
    };

    const notificacion = new Notification(titulo, opcionesDefault);

    // Auto-cerrar después de 5 segundos
    setTimeout(() => notificacion.close(), 5000);

    return notificacion;
  }

  // Notificación de pago completado
  notificarPago(prestatario, monto) {
    return this.mostrar("💰 Pago Registrado", {
      body: `${prestatario} pagó ${monto}`,
      icon: '💰',
      tag: 'pago-completado'
    });
  }

  // Notificación de préstamo completado
  notificarPrestamoCompletado(prestatario) {
    return this.mostrar("✅ Préstamo Completado", {
      body: `${prestatario} completó su préstamo`,
      icon: '✅',
      tag: 'prestamo-completado'
    });
  }

  // Notificación de vencimiento próximo
  notificarVencimiento(prestatario, dias) {
    return this.mostrar("⚠️ Préstamo por Vencer", {
      body: `${prestatario} vence en ${dias} días`,
      icon: '⚠️',
      tag: 'vencimiento-proximo'
    });
  }

  // Notificación de préstamo vencido
  notificarVencido(prestatario) {
    return this.mostrar("🔴 Préstamo Vencido", {
      body: `${prestatario} tiene un préstamo vencido`,
      icon: '🔴',
      tag: 'prestamo-vencido',
      requireInteraction: true // No se cierra automáticamente
    });
  }
}

// Exportar instancia única
const notificationManager = new NotificationManager();
export default notificationManager;


// =============================================
// CÓMO USAR EN TUS COMPONENTES:
// =============================================

// 1. Importar al inicio del archivo
// import notificationManager from '../utils/notificaciones';

// 2. Pedir permiso cuando el usuario entre (en App.js o Inicio.js)
// useEffect(() => {
//   notificationManager.init();
// }, []);

// 3. Usar en tus funciones:

// EJEMPLO: En procesarPago() de GestionarPrestamos.js
/*
const procesarPago = async () => {
  // ... código existente ...
  
  if (response.data.success) {
    // 🔔 NOTIFICACIÓN
    notificationManager.notificarPago(
      prestamoSeleccionado.nombre,
      formatearMoneda(monto)
    );
    
    if (nuevoSaldo <= 0) {
      // 🔔 NOTIFICACIÓN DE COMPLETADO
      notificationManager.notificarPrestamoCompletado(
        prestamoSeleccionado.nombre
      );
    }
  }
};
*/

// EJEMPLO: Verificar vencimientos al cargar (en Inicio.js)
/*
useEffect(() => {
  const verificarVencimientos = () => {
    const hoy = new Date();
    prestamos.forEach(prestamo => {
      const fechaVencimiento = new Date(prestamo.fecha_ultimo_pago);
      const diasRestantes = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
      
      if (diasRestantes === 3 || diasRestantes === 1) {
        notificationManager.notificarVencimiento(prestamo.nombre, diasRestantes);
      }
      
      if (diasRestantes < 0 && parseFloat(prestamo.saldo_pendiente) > 0) {
        notificationManager.notificarVencido(prestamo.nombre);
      }
    });
  };
  
  verificarVencimientos();
  // Verificar cada hora
  const interval = setInterval(verificarVencimientos, 3600000);
  return () => clearInterval(interval);
}, [prestamos]);
*/
