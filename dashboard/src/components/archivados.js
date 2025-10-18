import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useSyncDashboard } from '../hooks/useSyncDashboard';
import '../assets/css/Archivados.css';

const Archivados = () => {
  const [archivados, setArchivados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    totalArchivados: 0,
    totalEsteMes: 0,
    montoRecuperado: 0
  });
  const [pagosPrestamo, setPagosPrestamo] = useState([]);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  // Hook de sincronización para actualizar automáticamente
  useSyncDashboard(['prestamos', 'pagos'], (cambios) => {
    console.log('📁 Archivados recibió cambios:', cambios);
    console.log('🔄 Recargando archivados por cambios en sincronización');
    cargarArchivados();
  });

  useEffect(() => {
    cargarArchivados();
  }, []);

  const cargarArchivados = () => {
    setLoading(true);
    axios.get('http://192.168.18.22:8080/api_postgres.php?action=prestamos_archivados')
      .then(response => {
        console.log('📁 Préstamos archivados cargados:', response.data);
        if (Array.isArray(response.data)) {
          setArchivados(response.data);
          calcularEstadisticas(response.data);
        } else {
          console.error('Formato de respuesta inválido:', response.data);
          setArchivados([]);
        }
      })
      .catch(error => {
        console.error('Error cargando archivados:', error);
        setArchivados([]);
      })
      .finally(() => setLoading(false));
  };

  const cargarPagosPrestamo = async (idPrestamo) => {
    try {
      const response = await axios.get(`http://192.168.18.22:8080/api_postgres.php?action=pagos&id_prestamo=${idPrestamo}`);
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error cargando pagos:', error);
      return [];
    }
  };

  const calcularEstadisticas = (archivadosData) => {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    const esteMes = archivadosData.filter(prestamo => {
      try {
        const fechaArchivado = new Date(prestamo.fecha_ultimo_pago);
        return fechaArchivado >= inicioMes;
      } catch (error) {
        return false;
      }
    });

    const montoRecuperado = archivadosData.reduce((sum, prestamo) => 
      sum + parseFloat(prestamo.monto_total || 0), 0
    );

    setEstadisticas({
      totalArchivados: archivadosData.length,
      totalEsteMes: esteMes.length,
      montoRecuperado: montoRecuperado
    });
  };

  const verDetalles = (prestamo) => {
    setPrestamoSeleccionado(prestamo);
    setMostrarModal(true);
  };

  const exportarPDF = async (prestamo) => {
    setGenerandoPDF(true);
    try {
      // Cargar los pagos del préstamo
      const pagos = await cargarPagosPrestamo(prestamo.id_prestamo);
      
      // Crear PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = margin;

      // Función para agregar nueva página si es necesario
      const addNewPageIfNeeded = (spaceNeeded) => {
        if (yPosition + spaceNeeded > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Encabezado
      pdf.setFillColor(41, 128, 185);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REPORTE DE PRÉSTAMO ARCHIVADO', pageWidth / 2, 25, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.text(`Generado el: ${new Date().toLocaleDateString('es-PE')}`, pageWidth / 2, 35, { align: 'center' });

      yPosition = 60;

      // Información del Prestatario
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INFORMACIÓN DEL PRESTATARIO', margin, yPosition);
      yPosition += 15;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Nombre: ${prestamo.nombre || 'N/A'}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`DNI: ${prestamo.dni || 'N/A'}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Teléfono: ${prestamo.telefono || 'N/A'}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Dirección: ${prestamo.direccion || 'N/A'}`, margin, yPosition);
      yPosition += 15;

      // Detalles del Préstamo
      addNewPageIfNeeded(50);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DETALLES DEL PRÉSTAMO', margin, yPosition);
      yPosition += 15;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Monto Inicial: ${formatearMoneda(prestamo.monto_inicial)}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Tasa de Interés: ${prestamo.tasa_interes}%`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Total Pagado: ${formatearMoneda(prestamo.monto_total)}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Fecha de Inicio: ${formatearFecha(prestamo.fecha_inicio)}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Fecha de Pago Final: ${formatearFecha(prestamo.fecha_ultimo_pago)}`, margin, yPosition);
      yPosition += 7;
      pdf.text(`Período: ${prestamo.cantidad_periodo} ${prestamo.tipo_periodo}`, margin, yPosition);
      yPosition += 15;

      // Resumen de Pagos
      addNewPageIfNeeded(30);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RESUMEN DE PAGOS', margin, yPosition);
      yPosition += 10;

      if (pagos.length > 0) {
        // Encabezado de la tabla de pagos
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPosition, pageWidth - (margin * 2), 8, 'F');
        yPosition += 6;
        
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        pdf.text('FECHA', margin + 5, yPosition);
        pdf.text('MONTO', margin + 50, yPosition);
        pdf.text('SALDO', margin + 85, yPosition);
        pdf.text('ESTADO', pageWidth - margin - 25, yPosition);
        yPosition += 4;

        // Línea separadora
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;

        // Detalles de pagos
        pdf.setFontSize(8);
        let totalPagado = 0;

        pagos.forEach((pago, index) => {
          addNewPageIfNeeded(10);
          
          if (index % 2 === 0) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(margin, yPosition - 6, pageWidth - (margin * 2), 6, 'F');
          }

          pdf.setTextColor(0, 0, 0);
          pdf.text(formatearFecha(pago.fecha), margin + 5, yPosition);
          pdf.text(formatearMoneda(pago.monto), margin + 50, yPosition);
          pdf.text(formatearMoneda(pago.saldo_restante), margin + 85, yPosition);
          pdf.text('✅ PAGADO', pageWidth - margin - 25, yPosition);
          
          totalPagado += parseFloat(pago.monto || 0);
          yPosition += 6;
        });

        yPosition += 5;
        pdf.setFont('helvetica', 'bold');
        pdf.text(`TOTAL PAGADO: ${formatearMoneda(totalPagado)}`, margin, yPosition);
        yPosition += 10;
      } else {
        pdf.text('No se registraron pagos para este préstamo', margin, yPosition);
        yPosition += 10;
      }

      // Estado Final
      addNewPageIfNeeded(20);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 100, 0);
      pdf.text('✅ PRÉSTAMO COMPLETAMENTE PAGADO Y ARCHIVADO', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Este préstamo ha sido saldado en su totalidad y archivado en el sistema.', margin, yPosition);

      // Pie de página
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' });
        pdf.text('Sistema de Gestión de Préstamos - Generado automáticamente', pageWidth / 2, pdf.internal.pageSize.getHeight() - 5, { align: 'center' });
      }

      // Guardar PDF
      pdf.save(`prestamo_archivado_${prestamo.dni}_${prestamo.nombre?.replace(/\s+/g, '_')}.pdf`);

      alert('✅ PDF generado exitosamente');

    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('❌ Error al generar el PDF');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const reabrirPrestamo = async (prestamo) => {
    if (window.confirm(`¿Reabrir el préstamo de ${prestamo.nombre}?`)) {
      try {
        const response = await axios.post('http://192.168.18.22:8080/api_postgres.php?action=reactivar_prestamo', {
          id_prestamo: parseInt(prestamo.id_prestamo)
        });

        if (response.data.success) {
          alert('✅ Préstamo reactivado exitosamente');
          cargarArchivados();
        } else {
          alert(`❌ Error: ${response.data.error}`);
        }
      } catch (error) {
        console.error('Error reactivando préstamo:', error);
        alert('❌ Error al reactivar el préstamo');
      }
    }
  };

  const eliminarArchivado = (prestamo) => {
    if (window.confirm(`¿Eliminar permanentemente el registro de ${prestamo.nombre}? Esta acción no se puede deshacer.`)) {
      alert(`Registro de ${prestamo.nombre} eliminado (función en desarrollo)`);
    }
  };

  const archivadosFiltrados = archivados.filter(prestamo => {
    try {
      const fechaPago = new Date(prestamo.fecha_ultimo_pago);
      const hoy = new Date();
      
      switch (filtro) {
        case 'este_mes':
          const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          return fechaPago >= inicioMes;
        case 'ultimos_3_meses':
          const hace3Meses = new Date(hoy.getFullYear(), hoy.getMonth() - 3, hoy.getDate());
          return fechaPago >= hace3Meses;
        default:
          return true;
      }
    } catch (error) {
      return false;
    }
  });

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(monto || 0);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      return new Date(fecha).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const calcularDiasDesdePago = (fechaUltimoPago) => {
    if (!fechaUltimoPago) return 0;
    try {
      const hoy = new Date();
      const ultimoPago = new Date(fechaUltimoPago);
      const diferencia = hoy.getTime() - ultimoPago.getTime();
      return Math.floor(diferencia / (1000 * 3600 * 24));
    } catch (error) {
      return 0;
    }
  };

  return (
    <div className="archivados-container">
      <div className="archivados-header">
        <h1>📁 Préstamos Archivados</h1>
        <p>Historial de préstamos completamente pagados y archivados</p>
        <button 
          onClick={cargarArchivados} 
          className="btn-actualizar"
          disabled={loading}
        >
          🔄 {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      {/* Estadísticas */}
      <div className="estadisticas-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>{estadisticas.totalArchivados}</h3>
            <p>Total Archivados</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>{estadisticas.totalEsteMes}</h3>
            <p>Pagados este mes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>{formatearMoneda(estadisticas.montoRecuperado)}</h3>
            <p>Total Recuperado</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filtros-section">
        <div className="filtros">
          <button 
            className={`filtro-btn ${filtro === 'todos' ? 'active' : ''}`}
            onClick={() => setFiltro('todos')}
          >
            Todos ({archivados.length})
          </button>
          <button 
            className={`filtro-btn ${filtro === 'este_mes' ? 'active' : ''}`}
            onClick={() => setFiltro('este_mes')}
          >
            Este Mes ({estadisticas.totalEsteMes})
          </button>
          <button 
            className={`filtro-btn ${filtro === 'ultimos_3_meses' ? 'active' : ''}`}
            onClick={() => setFiltro('ultimos_3_meses')}
          >
            Últimos 3 Meses
          </button>
        </div>
        <div className="contador">
          Mostrando: {archivadosFiltrados.length} de {archivados.length}
        </div>
      </div>

      {/* Tabla de Archivados */}
      <div className="table-container">
        {loading ? (
          <div className="loading">Cargando préstamos archivados...</div>
        ) : archivadosFiltrados.length > 0 ? (
          <table className="archivados-table">
            <thead>
              <tr>
                <th>Prestatario</th>
                <th>DNI</th>
                <th>Monto Inicial</th>
                <th>Total Pagado</th>
                <th>Fecha Inicio</th>
                <th>Fecha Pago Final</th>
                <th>Días desde Pago</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {archivadosFiltrados.map(prestamo => {
                const diasDesdePago = calcularDiasDesdePago(prestamo.fecha_ultimo_pago);
                return (
                  <tr key={prestamo.id_prestamo} className="archivado-row">
                    <td className="prestatario-cell">
                      <strong>{prestamo.nombre || 'N/A'}</strong>
                      <br />
                      <small>{prestamo.telefono || 'Sin teléfono'}</small>
                    </td>
                    <td className="dni-cell">{prestamo.dni || 'N/A'}</td>
                    <td className="monto">{formatearMoneda(prestamo.monto_inicial)}</td>
                    <td className="monto-total">{formatearMoneda(prestamo.monto_total)}</td>
                    <td>{formatearFecha(prestamo.fecha_inicio)}</td>
                    <td className="fecha-pago">{formatearFecha(prestamo.fecha_ultimo_pago)}</td>
                    <td>
                      <span className={`dias-badge ${diasDesdePago > 90 ? 'antiguo' : 'reciente'}`}>
                        {diasDesdePago} días
                      </span>
                    </td>
                    <td className="acciones-cell">
                      <button 
                        className="btn-detalles"
                        onClick={() => verDetalles(prestamo)}
                        title="Ver detalles completos"
                      >
                        👁️ Ver
                      </button>
                      <button 
                        className="btn-pdf"
                        onClick={() => exportarPDF(prestamo)}
                        disabled={generandoPDF}
                        title="Exportar a PDF"
                      >
                        {generandoPDF ? '⏳' : '📄'} PDF
                      </button>
                      <button 
                        className="btn-reabrir"
                        onClick={() => reabrirPrestamo(prestamo)}
                        title="Reabrir préstamo"
                      >
                        🔄 Reabrir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="no-data">
            <div className="no-data-icon">📁</div>
            <h3>No hay préstamos archivados</h3>
            <p>Los préstamos que archives desde la gestión aparecerán aquí automáticamente</p>
            <button onClick={cargarArchivados} className="btn-reintentar">
              🔄 Reintentar carga
            </button>
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {mostrarModal && prestamoSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>📋 Detalles del Préstamo Archivado</h3>
              <button onClick={() => setMostrarModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detalles-grid">
                <div className="detalle-item">
                  <label>Prestatario:</label>
                  <span>{prestamoSeleccionado.nombre}</span>
                </div>
                <div className="detalle-item">
                  <label>DNI:</label>
                  <span>{prestamoSeleccionado.dni}</span>
                </div>
                <div className="detalle-item">
                  <label>Teléfono:</label>
                  <span>{prestamoSeleccionado.telefono}</span>
                </div>
                <div className="detalle-item">
                  <label>Monto Inicial:</label>
                  <span>{formatearMoneda(prestamoSeleccionado.monto_inicial)}</span>
                </div>
                <div className="detalle-item">
                  <label>Tasa de Interés:</label>
                  <span>{prestamoSeleccionado.tasa_interes}%</span>
                </div>
                <div className="detalle-item">
                  <label>Total Pagado:</label>
                  <span className="monto-total">{formatearMoneda(prestamoSeleccionado.monto_total)}</span>
                </div>
                <div className="detalle-item">
                  <label>Fecha de Inicio:</label>
                  <span>{formatearFecha(prestamoSeleccionado.fecha_inicio)}</span>
                </div>
                <div className="detalle-item">
                  <label>Fecha de Pago Final:</label>
                  <span>{formatearFecha(prestamoSeleccionado.fecha_ultimo_pago)}</span>
                </div>
                <div className="detalle-item">
                  <label>Período:</label>
                  <span>{prestamoSeleccionado.cantidad_periodo} {prestamoSeleccionado.tipo_periodo}</span>
                </div>
                <div className="detalle-item full-width">
                  <label>Estado:</label>
                  <span className="estado-completado">✅ Completamente Pagado y Archivado</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-cerrar"
                onClick={() => setMostrarModal(false)}
              >
                Cerrar
              </button>
              <button 
                className="btn-pdf"
                onClick={() => {
                  setMostrarModal(false);
                  exportarPDF(prestamoSeleccionado);
                }}
                disabled={generandoPDF}
              >
                {generandoPDF ? '⏳' : '📄'} Exportar PDF
              </button>
              <button 
                className="btn-reabrir"
                onClick={() => {
                  setMostrarModal(false);
                  reabrirPrestamo(prestamoSeleccionado);
                }}
              >
                🔄 Reabrir Préstamo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Archivados;
