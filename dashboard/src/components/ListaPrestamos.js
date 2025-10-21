import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MiniProgress, ProgressBar } from '../components/ProgressCharts';
import { useSyncDashboard } from '../hooks/useSyncDashboard';

const ListaPrestamos = () => {
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('todos'); // todos, activos, pagados
  const [prestamoExpandido, setPrestamoExpandido] = useState(null);
  const [pagosDetalle, setPagosDetalle] = useState({});

  // Sincronización en tiempo real
  useSyncDashboard(['prestamos', 'pagos'], (cambios) => {
    console.log('Cambios detectados en préstamos:', cambios);
    cargarPrestamos();
  });

  useEffect(() => {
    cargarPrestamos();
  }, []);

  const cargarPrestamos = () => {
    setLoading(true);
    axios.get('http://localhost:8080/api_postgres.php?action=obtener_prestamos')
      .then(response => {
        setPrestamos(response.data);
        setLoading(false);
        setError('');
      })
      .catch(error => {
        console.error('Error al cargar préstamos:', error);
        setError('Error al cargar los préstamos');
        setLoading(false);
      });
  };

  const cargarPagosPrestamo = async (idPrestamo) => {
    try {
      const response = await axios.get(`http://localhost:8080/api_postgres.php?action=obtener_pagos&prestamo_id=${idPrestamo}`);
      setPagosDetalle(prev => ({
        ...prev,
        [idPrestamo]: response.data
      }));
    } catch (error) {
      console.error('Error al cargar pagos:', error);
    }
  };

  const toggleExpandirPrestamo = (prestamo) => {
    if (prestamoExpandido === prestamo.id) {
      setPrestamoExpandido(null);
    } else {
      setPrestamoExpandido(prestamo.id);
      if (!pagosDetalle[prestamo.id]) {
        cargarPagosPrestamo(prestamo.id);
      }
    }
  };

  const calcularProgreso = (prestamo) => {
    const montoTotal = parseFloat(prestamo.monto_total);
    const saldoPendiente = parseFloat(prestamo.saldo_pendiente);
    const montoPagado = montoTotal - saldoPendiente;
    return montoTotal > 0 ? (montoPagado / montoTotal) * 100 : 0;
  };

  const prestamosFiltrados = prestamos.filter(prestamo => {
    if (filtro === 'activos') return prestamo.saldo_pendiente > 0;
    if (filtro === 'pagados') return prestamo.saldo_pendiente <= 0;
    return true;
  });

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(monto);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getEstadoPrestamo = (prestamo) => {
    const saldo = parseFloat(prestamo.saldo_pendiente);
    if (saldo <= 0) return 'Pagado';
    
    const fechaVencimiento = new Date(prestamo.fecha_vencimiento);
    const hoy = new Date();
    
    if (fechaVencimiento < hoy) return 'Vencido';
    return 'Activo';
  };

  const getColorEstado = (estado) => {
    switch (estado) {
      case 'Pagado': return 'bg-green-100 text-green-800';
      case 'Vencido': return 'bg-red-100 text-red-800';
      case 'Activo': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-base sm:text-lg text-gray-600">Cargando préstamos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2">📋 Lista de Préstamos</h1>
        <p className="text-sm sm:text-base text-gray-600">Gestión y seguimiento de todos los préstamos registrados</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-red-700 text-sm sm:text-base">{error}</span>
          <button 
            onClick={cargarPrestamos} 
            className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button 
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                filtro === 'todos' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setFiltro('todos')}
            >
              Todos
            </button>
            <button 
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                filtro === 'activos' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setFiltro('activos')}
            >
              Activos
            </button>
            <button 
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                filtro === 'pagados' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setFiltro('pagados')}
            >
              Pagados
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm">
            <span className="text-gray-600">
              <span className="font-medium">Total:</span> {prestamosFiltrados.length}
            </span>
            <span className="text-gray-600">
              <span className="font-medium">Activos:</span> {prestamos.filter(p => p.saldo_pendiente > 0).length}
            </span>
          </div>
        </div>
      </div>

      {/* Vista de tabla para desktop */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prestatario</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progreso</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Inicial</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interés</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Total</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Pendiente</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Inicio</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Vencimiento</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prestamosFiltrados.length > 0 ? (
                prestamosFiltrados.map(prestamo => {
                  const progreso = calcularProgreso(prestamo);
                  const estado = getEstadoPrestamo(prestamo);
                  const colorEstado = getColorEstado(estado);
                  
                  return (
                    <tr key={prestamo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{prestamo.nombre_prestatario}</div>
                        <div className="text-sm text-gray-500">{prestamo.cedula}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${progreso}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{progreso.toFixed(1)}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatearMoneda(prestamo.monto_inicial)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {prestamo.interes}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatearMoneda(prestamo.monto_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatearMoneda(prestamo.saldo_pendiente)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatearFecha(prestamo.fecha_inicio)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatearFecha(prestamo.fecha_vencimiento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorEstado}`}>
                          {estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => toggleExpandirPrestamo(prestamo)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          {prestamoExpandido === prestamo.id ? 'Ocultar' : 'Ver detalles'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      {prestamos.length === 0 ? 'No hay préstamos registrados' : 'No hay préstamos que coincidan con el filtro'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista de tarjetas para móvil y tablet */}
      <div className="lg:hidden space-y-3 sm:space-y-4">
        {prestamosFiltrados.length > 0 ? (
          prestamosFiltrados.map(prestamo => {
            const progreso = calcularProgreso(prestamo);
            const estado = getEstadoPrestamo(prestamo);
            const colorEstado = getColorEstado(estado);
            
            return (
              <div key={prestamo.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Header de la tarjeta */}
                <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm sm:text-base font-medium text-gray-900">{prestamo.nombre_prestatario}</h3>
                      <p className="text-xs sm:text-sm text-gray-500">{prestamo.cedula}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorEstado}`}>
                      {estado}
                    </span>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="p-3 sm:p-4 bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Progreso del préstamo</span>
                    <span className="text-xs sm:text-sm font-medium text-blue-600">{progreso.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progreso}%` }}
                    ></div>
                  </div>
                </div>

                {/* Información principal */}
                <div className="p-3 sm:p-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Monto Total</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">{formatearMoneda(prestamo.monto_total)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Saldo Pendiente</p>
                      <p className="text-sm sm:text-base font-semibold text-orange-600">{formatearMoneda(prestamo.saldo_pendiente)}</p>
                    </div>
                  </div>

                  {/* Botón para expandir detalles */}
                  <button
                    onClick={() => toggleExpandirPrestamo(prestamo)}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {prestamoExpandido === prestamo.id ? '▲ Ocultar detalles' : '▼ Ver más detalles'}
                  </button>

                  {/* Detalles expandidos */}
                  {prestamoExpandido === prestamo.id && (
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Monto Inicial</p>
                            <p className="text-sm font-medium text-gray-900">{formatearMoneda(prestamo.monto_inicial)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Interés</p>
                            <p className="text-sm font-medium text-gray-900">{prestamo.interes}%</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Fecha Inicio</p>
                            <p className="text-sm font-medium text-gray-900">{formatearFecha(prestamo.fecha_inicio)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Fecha Vencimiento</p>
                            <p className="text-sm font-medium text-gray-900">{formatearFecha(prestamo.fecha_vencimiento)}</p>
                          </div>
                        </div>

                        {/* Progreso detallado */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-2">Progreso detallado</p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Pagado:</span>
                              <span className="font-medium text-green-600">
                                {formatearMoneda(prestamo.monto_total - prestamo.saldo_pendiente)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Pendiente:</span>
                              <span className="font-medium text-orange-600">
                                {formatearMoneda(prestamo.saldo_pendiente)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Historial de pagos */}
                        {pagosDetalle[prestamo.id] && pagosDetalle[prestamo.id].length > 0 && (
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-2">Últimos pagos</p>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {pagosDetalle[prestamo.id].slice(0, 3).map((pago, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span>{formatearFecha(pago.fecha_pago)}</span>
                                  <span className="font-medium text-green-600">
                                    {formatearMoneda(pago.monto)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
            <div className="text-gray-500">
              {prestamos.length === 0 ? 'No hay préstamos registrados' : 'No hay préstamos que coincidan con el filtro'}
            </div>
          </div>
        )}
      </div>

      {/* Resumen financiero */}
      <div className="mt-4 sm:mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          <div className="flex items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-lg">
            <span className="text-gray-700 font-medium text-sm sm:text-base">Total Prestado:</span>
            <span className="text-lg sm:text-xl font-bold text-blue-600">
              {formatearMoneda(prestamos.reduce((sum, p) => sum + parseFloat(p.monto_total), 0))}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 sm:p-4 bg-orange-50 rounded-lg">
            <span className="text-gray-700 font-medium text-sm sm:text-base">Saldo Pendiente:</span>
            <span className="text-lg sm:text-xl font-bold text-orange-600">
              {formatearMoneda(prestamos.reduce((sum, p) => sum + parseFloat(p.saldo_pendiente), 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListaPrestamos;
