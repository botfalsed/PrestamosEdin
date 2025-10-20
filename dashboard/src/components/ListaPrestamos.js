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

  // Hook de sincronización para actualizar automáticamente
  useSyncDashboard(['prestamos', 'pagos'], (cambios) => {
    console.log('📊 ListaPrestamos recibió cambios:', cambios);
    console.log('🔄 Recargando préstamos por cambios en sincronización');
    cargarPrestamos();
  });

  useEffect(() => {
    cargarPrestamos();
  }, []);

  const cargarPrestamos = () => {
    setLoading(true);
    axios.get('http://localhost:8080/api_postgres.php?action=prestamos')
      .then(response => {
        if (Array.isArray(response.data)) {
          setPrestamos(response.data);
        } else {
          setError('Formato de respuesta inválido');
        }
      })
      .catch(error => {
        console.error('Error fetching prestamos:', error);
        setError('Error al cargar los préstamos');
      })
      .finally(() => setLoading(false));
  };

  const cargarPagosPrestamo = async (idPrestamo) => {
    try {
      const response = await axios.get(`http://localhost:8080/api_postgres.php?action=pagos&id_prestamo=${idPrestamo}`);
      if (Array.isArray(response.data)) {
        setPagosDetalle(prev => ({
          ...prev,
          [idPrestamo]: response.data
        }));
      }
    } catch (error) {
      console.error('Error cargando pagos:', error);
    }
  };

  const toggleExpandirPrestamo = (prestamo) => {
    if (prestamoExpandido === prestamo.id_prestamo) {
      setPrestamoExpandido(null);
    } else {
      setPrestamoExpandido(prestamo.id_prestamo);
      if (!pagosDetalle[prestamo.id_prestamo]) {
        cargarPagosPrestamo(prestamo.id_prestamo);
      }
    }
  };

  const calcularProgreso = (prestamo) => {
    const total = parseFloat(prestamo.monto_total);
    const pagado = total - parseFloat(prestamo.saldo_pendiente);
    const porcentaje = total > 0 ? (pagado / total) * 100 : 0;
    return { pagado, total, porcentaje };
  };

  const prestamosFiltrados = prestamos.filter(prestamo => {
    if (filtro === 'activos') return prestamo.saldo_pendiente > 0;
    if (filtro === 'pagados') return prestamo.saldo_pendiente <= 0;
    return true;
  });

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(monto);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getEstadoPrestamo = (prestamo) => {
    if (prestamo.saldo_pendiente <= 0) return 'Pagado';
    
    const hoy = new Date();
    const ultimoPago = new Date(prestamo.fecha_ultimo_pago);
    
    if (hoy > ultimoPago) return 'Vencido';
    return 'Activo';
  };

  const getColorEstado = (estado) => {
    switch(estado) {
      case 'Pagado': return '#28a745';
      case 'Activo': return '#007bff';
      case 'Vencido': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Cargando préstamos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📋 Lista de Préstamos</h1>
        <p className="text-gray-600">Gestión y seguimiento de todos los préstamos registrados</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <span className="text-red-700">{error}</span>
          <button 
            onClick={cargarPrestamos} 
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtro === 'todos' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setFiltro('todos')}
            >
              Todos
            </button>
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtro === 'activos' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setFiltro('activos')}
            >
              Activos
            </button>
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtro === 'pagados' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setFiltro('pagados')}
            >
              Pagados
            </button>
          </div>
          
          <div className="flex gap-4 text-sm">
            <span className="text-gray-600">
              <span className="font-medium">Total:</span> {prestamosFiltrados.length}
            </span>
            <span className="text-gray-600">
              <span className="font-medium">Activos:</span> {prestamos.filter(p => p.saldo_pendiente > 0).length}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                  const estado = getEstadoPrestamo(prestamo);
                  const progreso = calcularProgreso(prestamo);
                  const estaExpandido = prestamoExpandido === prestamo.id_prestamo;
                  
                  return (
                    <React.Fragment key={prestamo.id_prestamo}>
                      <tr className={`hover:bg-gray-50 transition-colors ${estaExpandido ? 'bg-blue-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{prestamo.nombre}</div>
                            <div className="text-sm text-gray-500">{prestamo.telefono}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            <MiniProgress 
                              pagado={progreso.pagado} 
                              total={progreso.total} 
                            />
                            <div className="text-xs text-gray-600 text-center">
                              {progreso.porcentaje.toFixed(1)}%
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatearMoneda(prestamo.monto_inicial)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {parseFloat(prestamo.tasa_interes).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatearMoneda(prestamo.monto_total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            prestamo.saldo_pendiente > 0 ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {formatearMoneda(prestamo.saldo_pendiente)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatearFecha(prestamo.fecha_inicio)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatearFecha(prestamo.fecha_ultimo_pago)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                            style={{ backgroundColor: getColorEstado(estado) }}
                          >
                            {estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            onClick={() => toggleExpandirPrestamo(prestamo)}
                            title={estaExpandido ? "Ocultar detalles" : "Ver detalles"}
                          >
                            {estaExpandido ? '▲' : '▼'} Detalles
                          </button>
                        </td>
                      </tr>
                      
                      {/* Fila expandida con detalles */}
                      {estaExpandido && (
                        <tr className="bg-blue-50">
                          <td colSpan="10" className="px-6 py-6">
                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <h4 className="text-lg font-semibold text-gray-800">📊 Progreso Detallado del Préstamo</h4>
                                <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                                  Período: {prestamo.cantidad_periodo} {prestamo.tipo_periodo === 'dias' ? 'días' : 
                                  prestamo.tipo_periodo === 'semanal' ? 'semanas' : 'meses'}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <ProgressBar 
                                    pagado={progreso.pagado}
                                    total={progreso.total}
                                    porcentaje={progreso.porcentaje}
                                  />
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                      <div className="text-xs text-gray-500 uppercase tracking-wider">Pagado</div>
                                      <div className="text-lg font-semibold text-green-600">{formatearMoneda(progreso.pagado)}</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                      <div className="text-xs text-gray-500 uppercase tracking-wider">Pendiente</div>
                                      <div className="text-lg font-semibold text-orange-600">{formatearMoneda(prestamo.saldo_pendiente)}</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                      <div className="text-xs text-gray-500 uppercase tracking-wider">Total</div>
                                      <div className="text-lg font-semibold text-blue-600">{formatearMoneda(progreso.total)}</div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <h5 className="text-md font-semibold text-gray-800 mb-4">📅 Historial de Pagos</h5>
                                  {pagosDetalle[prestamo.id_prestamo] ? (
                                    pagosDetalle[prestamo.id_prestamo].length > 0 ? (
                                      <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {pagosDetalle[prestamo.id_prestamo].map((pago, index) => (
                                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <div className="flex flex-col">
                                              <span className="text-sm font-medium text-gray-900">{formatearFecha(pago.fecha)}</span>
                                              <span className="text-xs text-gray-500">Saldo: {formatearMoneda(pago.saldo_restante)}</span>
                                            </div>
                                            <span className="text-sm font-semibold text-green-600">{formatearMoneda(pago.monto)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-gray-500 text-center py-4">No se registraron pagos</p>
                                    )
                                  ) : (
                                    <div className="text-center py-4">
                                      <div className="text-gray-500">Cargando pagos...</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <span className="text-gray-700 font-medium">Total Prestado:</span>
            <span className="text-xl font-bold text-blue-600">
              {formatearMoneda(prestamos.reduce((sum, p) => sum + parseFloat(p.monto_inicial), 0))}
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
            <span className="text-gray-700 font-medium">Saldo Pendiente:</span>
            <span className="text-xl font-bold text-orange-600">
              {formatearMoneda(prestamos.reduce((sum, p) => sum + parseFloat(p.saldo_pendiente), 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListaPrestamos;
