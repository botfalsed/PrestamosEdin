import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useSyncDashboard } from '../hooks/useSyncDashboard';

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
    axios.get('http://localhost:8080/api_postgres.php?action=prestamos_archivados')
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
      const response = await axios.get(`http://localhost:8080/api_postgres.php?action=pagos&id_prestamo=${idPrestamo}`);
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
        const response = await axios.post('http://localhost:8080/api_postgres.php?action=reactivar_prestamo', {
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
    <div className="p-5 max-w-7xl mx-auto w-full">
      <div className="text-center mb-8">
        <h1 className="text-gray-800 mb-2 text-4xl font-bold">📁 Préstamos Archivados</h1>
        <p className="text-gray-500 text-lg">Historial de préstamos completamente pagados y archivados</p>
        <button 
          onClick={cargarArchivados} 
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={loading}
        >
          🔄 {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-soft flex items-center gap-4 transition-transform duration-300 hover:-translate-y-1 border-l-4 border-green-600">
          <div className="text-3xl">📊</div>
          <div>
            <h3 className="text-3xl font-bold text-gray-800 m-0">{estadisticas.totalArchivados}</h3>
            <p className="text-gray-500 text-sm m-0">Total Archivados</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-soft flex items-center gap-4 transition-transform duration-300 hover:-translate-y-1 border-l-4 border-green-600">
          <div className="text-3xl">📅</div>
          <div>
            <h3 className="text-3xl font-bold text-gray-800 m-0">{estadisticas.totalEsteMes}</h3>
            <p className="text-gray-500 text-sm m-0">Pagados este mes</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-soft flex items-center gap-4 transition-transform duration-300 hover:-translate-y-1 border-l-4 border-green-600">
          <div className="text-3xl">💰</div>
          <div>
            <h3 className="text-3xl font-bold text-gray-800 m-0">{formatearMoneda(estadisticas.montoRecuperado)}</h3>
            <p className="text-gray-500 text-sm m-0">Total Recuperado</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex justify-between items-center mb-5 flex-wrap gap-4">
        <div className="flex gap-3 flex-wrap">
          <button 
            className={`py-3 px-5 border-2 rounded-full cursor-pointer transition-all duration-300 font-medium ${
              filtro === 'todos' 
                ? 'bg-green-600 text-white border-green-600' 
                : 'bg-white border-gray-200 hover:border-green-600 hover:text-green-600'
            }`}
            onClick={() => setFiltro('todos')}
          >
            Todos ({archivados.length})
          </button>
          <button 
            className={`py-3 px-5 border-2 rounded-full cursor-pointer transition-all duration-300 font-medium ${
              filtro === 'este_mes' 
                ? 'bg-green-600 text-white border-green-600' 
                : 'bg-white border-gray-200 hover:border-green-600 hover:text-green-600'
            }`}
            onClick={() => setFiltro('este_mes')}
          >
            Este Mes ({estadisticas.totalEsteMes})
          </button>
          <button 
            className={`py-3 px-5 border-2 rounded-full cursor-pointer transition-all duration-300 font-medium ${
              filtro === 'ultimos_3_meses' 
                ? 'bg-green-600 text-white border-green-600' 
                : 'bg-white border-gray-200 hover:border-green-600 hover:text-green-600'
            }`}
            onClick={() => setFiltro('ultimos_3_meses')}
          >
            Últimos 3 Meses
          </button>
        </div>
        <div className="text-gray-500 text-sm py-2 px-4 bg-gray-50 rounded-full">
          Mostrando: {archivadosFiltrados.length} de {archivados.length}
        </div>
      </div>

      {/* Tabla de Archivados */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden mb-5">
        {loading ? (
          <div className="text-center py-10 text-xl text-blue-600">Cargando préstamos archivados...</div>
        ) : archivadosFiltrados.length > 0 ? (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-green-600 text-white p-4 text-left font-semibold text-sm">Prestatario</th>
                <th className="bg-green-600 text-white p-4 text-left font-semibold text-sm">DNI</th>
                <th className="bg-green-600 text-white p-4 text-left font-semibold text-sm">Monto Inicial</th>
                <th className="bg-green-600 text-white p-4 text-left font-semibold text-sm">Total Pagado</th>
                <th className="bg-green-600 text-white p-4 text-left font-semibold text-sm">Fecha Inicio</th>
                <th className="bg-green-600 text-white p-4 text-left font-semibold text-sm">Fecha Pago Final</th>
                <th className="bg-green-600 text-white p-4 text-left font-semibold text-sm">Días desde Pago</th>
                <th className="bg-green-600 text-white p-4 text-left font-semibold text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {archivadosFiltrados.map(prestamo => {
                const diasDesdePago = calcularDiasDesdePago(prestamo.fecha_ultimo_pago);
                return (
                  <tr key={prestamo.id_prestamo} className="hover:bg-gray-50">
                    <td className="p-3 border-b border-gray-100 font-medium">
                      <strong>{prestamo.nombre || 'N/A'}</strong>
                      <br />
                      <small className="text-gray-500 text-xs">{prestamo.telefono || 'Sin teléfono'}</small>
                    </td>
                    <td className="p-3 border-b border-gray-100 font-mono font-semibold text-gray-800">{prestamo.dni || 'N/A'}</td>
                    <td className="p-3 border-b border-gray-100 font-mono font-semibold text-right text-gray-800">{formatearMoneda(prestamo.monto_inicial)}</td>
                    <td className="p-3 border-b border-gray-100 font-mono font-semibold text-right text-green-600">{formatearMoneda(prestamo.monto_total)}</td>
                    <td className="p-3 border-b border-gray-100">{formatearFecha(prestamo.fecha_inicio)}</td>
                    <td className="p-3 border-b border-gray-100 text-green-600 font-medium">{formatearFecha(prestamo.fecha_ultimo_pago)}</td>
                    <td className="p-3 border-b border-gray-100">
                      <span className={`py-1 px-2 rounded-xl text-xs font-semibold ${
                        diasDesdePago > 90 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {diasDesdePago} días
                      </span>
                    </td>
                    <td className="p-3 border-b border-gray-100">
                      <div className="flex gap-2 flex-wrap">
                        <button 
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-3 rounded-lg transition-colors duration-200"
                          onClick={() => verDetalles(prestamo)}
                          title="Ver detalles completos"
                        >
                          👁️ Ver
                        </button>
                        <button 
                          className="bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-3 rounded-lg transition-colors duration-200 disabled:opacity-50"
                          onClick={() => exportarPDF(prestamo)}
                          disabled={generandoPDF}
                          title="Exportar a PDF"
                        >
                          {generandoPDF ? '⏳' : '📄'} PDF
                        </button>
                        <button 
                          className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-3 rounded-lg transition-colors duration-200"
                          onClick={() => reabrirPrestamo(prestamo)}
                          title="Reabrir préstamo"
                        >
                          🔄 Reabrir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay préstamos archivados</h3>
            <p className="text-gray-500 mb-6">Los préstamos que archives desde la gestión aparecerán aquí automáticamente</p>
            <button 
              onClick={cargarArchivados} 
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              🔄 Reintentar carga
            </button>
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {mostrarModal && prestamoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-strong max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">📋 Detalles del Préstamo Archivado</h3>
              <button 
                onClick={() => setMostrarModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prestatario:</label>
                    <span className="text-gray-900">{prestamoSeleccionado.nombre}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DNI:</label>
                    <span className="text-gray-900">{prestamoSeleccionado.dni}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono:</label>
                    <span className="text-gray-900">{prestamoSeleccionado.telefono}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto Inicial:</label>
                    <span className="text-gray-900">{formatearMoneda(prestamoSeleccionado.monto_inicial)}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tasa de Interés:</label>
                    <span className="text-gray-900">{prestamoSeleccionado.tasa_interes}%</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Pagado:</label>
                    <span className="text-green-600 font-semibold">{formatearMoneda(prestamoSeleccionado.monto_total)}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio:</label>
                    <span className="text-gray-900">{formatearFecha(prestamoSeleccionado.fecha_inicio)}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Pago Final:</label>
                    <span className="text-gray-900">{formatearFecha(prestamoSeleccionado.fecha_ultimo_pago)}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Período:</label>
                    <span className="text-gray-900">{prestamoSeleccionado.cantidad_periodo} {prestamoSeleccionado.tipo_periodo}</span>
                  </div>
                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado:</label>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      ✅ Completamente Pagado y Archivado
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 border-t border-gray-200">
              <button 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                onClick={() => setMostrarModal(false)}
              >
                Cerrar
              </button>
              <button 
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                onClick={() => {
                  setMostrarModal(false);
                  exportarPDF(prestamoSeleccionado);
                }}
                disabled={generandoPDF}
              >
                {generandoPDF ? '⏳' : '📄'} Exportar PDF
              </button>
              <button 
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
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
