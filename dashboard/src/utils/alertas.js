// src/utils/alertas.js

// Función principal para calcular alertas de vencimientos
export const calcularAlertasVencimientos = (prestamos) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // Normalizar a inicio del día
  
  const alertas = {
    hoy: [],
    en3Dias: [],
    vencidos: [],
    estaSemana: []
  };

  prestamos.forEach(prestamo => {
    if (!prestamo.fecha_ultimo_pago && !prestamo.proxima_fecha_pago) return;

    // Usar próxima fecha de pago si existe, sino usar fecha_ultimo_pago + periodo
    let fechaProximoVencimiento;
    
    if (prestamo.proxima_fecha_pago) {
      fechaProximoVencimiento = new Date(prestamo.proxima_fecha_pago);
    } else if (prestamo.fecha_ultimo_pago && prestamo.tipo_periodo) {
      // Calcular próxima fecha basada en el último pago + periodo
      fechaProximoVencimiento = calcularProximaFecha(
        new Date(prestamo.fecha_ultimo_pago), 
        prestamo.tipo_periodo,
        prestamo.cantidad_periodo
      );
    } else {
      return; // No hay datos suficientes
    }

    fechaProximoVencimiento.setHours(0, 0, 0, 0);
    
    const diferenciaMs = fechaProximoVencimiento - hoy;
    const diasHastaVencimiento = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

    // Clasificar las alertas
    if (diasHastaVencimiento === 0) {
      alertas.hoy.push({ ...prestamo, diasRestantes: 0 });
    } else if (diasHastaVencimiento > 0 && diasHastaVencimiento <= 3) {
      alertas.en3Dias.push({ ...prestamo, diasRestantes: diasHastaVencimiento });
    } else if (diasHastaVencimiento > 3 && diasHastaVencimiento <= 7) {
      alertas.estaSemana.push({ ...prestamo, diasRestantes: diasHastaVencimiento });
    } else if (diasHastaVencimiento < 0) {
      alertas.vencidos.push({ ...prestamo, diasVencidos: Math.abs(diasHastaVencimiento) });
    }
  });

  return alertas;
};

// Función para calcular próxima fecha de pago
const calcularProximaFecha = (fechaUltimoPago, tipoPeriodo, cantidadPeriodo = 1) => {
  const fecha = new Date(fechaUltimoPago);
  
  switch (tipoPeriodo?.toLowerCase()) {
    case 'diario':
    case 'dias':
      fecha.setDate(fecha.getDate() + parseInt(cantidadPeriodo));
      break;
    case 'semanal':
    case 'semanas':
      fecha.setDate(fecha.getDate() + (parseInt(cantidadPeriodo) * 7));
      break;
    case 'mensual':
    case 'meses':
      fecha.setMonth(fecha.getMonth() + parseInt(cantidadPeriodo));
      break;
    case 'quincenal':
      fecha.setDate(fecha.getDate() + 15);
      break;
    default:
      // Por defecto 30 días
      fecha.setDate(fecha.getDate() + 30);
  }
  
  return fecha;
};

// Obtener el total de alertas para el badge
export const obtenerTotalAlertas = (alertas) => {
  return alertas.hoy.length + alertas.en3Dias.length + alertas.vencidos.length;
};

// Obtener la urgencia más alta para colores
export const obtenerUrgenciaMaxima = (alertas) => {
  if (alertas.hoy.length > 0 || alertas.vencidos.length > 0) return 'alta';
  if (alertas.en3Dias.length > 0) return 'media';
  if (alertas.estaSemana.length > 0) return 'baja';
  return 'ninguna';
};

// Formatear mensajes de alerta
export const formatearMensajeAlerta = (prestamo) => {
  const nombre = prestamo.nombre || 'Cliente';
  const monto = prestamo.monto_pendiente || prestamo.monto_total;
  
  if (prestamo.diasVencidos) {
    return `${nombre} - Vencido hace ${prestamo.diasVencidos} días - ${formatearMoneda(monto)}`;
  } else if (prestamo.diasRestantes === 0) {
    return `${nombre} - Vence HOY - ${formatearMoneda(monto)}`;
  } else {
    return `${nombre} - Vence en ${prestamo.diasRestantes} días - ${formatearMoneda(monto)}`;
  }
};

// Función auxiliar para formatear moneda
const formatearMoneda = (monto) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(monto || 0);
};

// Filtrar préstamos activos (que no estén archivados/completados)
export const filtrarPrestamosActivos = (prestamos) => {
  return prestamos.filter(prestamo => {
    // Asumiendo que los préstamos archivados tienen estado 'archivado' o 'completado'
    // O que los préstamos activos tienen saldo pendiente > 0
    const estado = prestamo.estado?.toLowerCase();
    const saldoPendiente = parseFloat(prestamo.saldo_pendiente || 0);
    
    return estado !== 'archivado' && 
           estado !== 'completado' && 
           estado !== 'pagado' &&
           saldoPendiente > 0;
  });
};
