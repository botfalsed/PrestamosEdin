import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ProgressBar, CircularProgress, TimelinePagos } from '../components/ProgressCharts';
import { useSyncDashboard } from '../hooks/useSyncDashboard';

const GestionarPrestamos = () => {
  const [prestamos, setPrestamos] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    totalPrestamos: 0,
    totalActivos: 0,
    totalPagados: 0,
    totalVencidos: 0,
    montoTotalPrestado: 0,
    saldoPendienteTotal: 0
  });
  const [filtro, setFiltro] = useState('todos');
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState(null);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [mostrarModalDetalles, setMostrarModalDetalles] = useState(false);
  const [montoPago, setMontoPago] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pagosDetalle, setPagosDetalle] = useState([]);
  const [cargandoPagos, setCargandoPagos] = useState(false);

  // Hook de sincronización para actualizar automáticamente
  useSyncDashboard(['prestamos', 'pagos'], (cambios) => {
    console.log('💼 GestionarPrestamos recibió cambios:', cambios);
    console.log('🔄 Recargando préstamos por cambios en sincronización');
    cargarPrestamos();
  });

  useEffect(() => {
    // cargarPrestamos(); // Comentado - usar botón manual
  }, []);

  const cargarPrestamos = async () => {
    if (loading) {
      console.log('⏸️ Ya está cargando, esperando...');
      return;
    }

    setLoading(true);
    setError('');
    try {
      console.log('🔍 Cargando préstamos...');
      const response = await axios.get('http://localhost:8080/api_postgres.php?action=prestamos');
      console.log('✅ Préstamos cargados:', response.data);

      if (Array.isArray(response.data)) {
        const prestamosNoArchivados = response.data.filter(prestamo => prestamo.estado !== 'archivado');
        
        const totalPrestamos = prestamosNoArchivados.length;
        const totalActivos = prestamosNoArchivados.filter(p => parseFloat(p.saldo_pendiente) > 0).length;
        const totalPagados = prestamosNoArchivados.filter(p => parseFloat(p.saldo_pendiente) <= 0).length;
        
        const hoy = new Date();
        const totalVencidos = prestamosNoArchivados.filter(p => {
          if (parseFloat(p.saldo_pendiente) <= 0) return false;
          const fechaVencimiento = new Date(p.fecha_ultimo_pago);
          return hoy > fechaVencimiento;
        }).length;

        const montoTotalPrestado = prestamosNoArchivados.reduce((sum, p) => sum + parseFloat(p.monto_inicial || 0), 0);
        const saldoPendienteTotal = prestamosNoArchivados.reduce((sum, p) => sum + parseFloat(p.saldo_pendiente || 0), 0);

        setPrestamos(prestamosNoArchivados);
        setEstadisticas({
          totalPrestamos,
          totalActivos,
          totalPagados,
          totalVencidos,
          montoTotalPrestado,
          saldoPendienteTotal
        });
        
        setMessage('');
      }
    } catch (error) {
      console.error('❌ Error cargando préstamos:', error);
      setError('Error al cargar préstamos. Verifica que el servidor esté funcionando.');
    } finally {
      setLoading(false);
    }
  };

  const cargarPagosPrestamo = async (idPrestamo) => {
    setCargandoPagos(true);
    try {
      const response = await axios.get(`http://localhost:8080/api_postgres.php?action=pagos&id_prestamo=${idPrestamo}`);
      if (Array.isArray(response.data)) {
        setPagosDetalle(response.data);
      } else {
        setPagosDetalle([]);
      }
    } catch (error) {
      console.error('Error cargando pagos:', error);
      setPagosDetalle([]);
    } finally {
      setCargandoPagos(false);
    }
  };

  const calcularProgreso = (prestamo) => {
    const total = parseFloat(prestamo.monto_total);
    const pagado = total - parseFloat(prestamo.saldo_pendiente);
    const porcentaje = total > 0 ? (pagado / total) * 100 : 0;
    return { pagado, total, porcentaje };
  };

  const verDetallesCompletos = async (prestamo) => {
    setPrestamoSeleccionado(prestamo);
    setMostrarModalDetalles(true);
    await cargarPagosPrestamo(prestamo.id_prestamo);
  };

  const handleRegistrarPago = (prestamo) => {
    setPrestamoSeleccionado(prestamo);
    setMontoPago('');
    setMostrarModalPago(true);
    setMessage('');
  };

  const procesarPago = async () => {
    if (!montoPago || parseFloat(montoPago) <= 0) {
      setMessage('❌ Ingresa un monto válido');
      return;
    }

    const monto = parseFloat(montoPago);
    const saldoPendiente = parseFloat(prestamoSeleccionado.saldo_pendiente);

    if (monto > saldoPendiente) {
      setMessage(`❌ El monto excede el saldo pendiente. Máximo: ${formatearMoneda(saldoPendiente)}`);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8080/api_postgres.php?action=pago', {
        id_prestamo: parseInt(prestamoSeleccionado.id_prestamo),
        monto_pago: monto
      });

      if (response.data.success) {
        const nuevoSaldo = saldoPendiente - monto;
        
        // ✅ CERRAR MODAL Y DESACTIVAR LOADING
        setMostrarModalPago(false);
        setLoading(false);
        
        // ✅ ESPERAR 150ms PARA QUE REACT LIMPIE EL DOM
        setTimeout(async () => {
          await cargarPrestamos();
          
          if (nuevoSaldo <= 0) {
            setMessage('✅ Pago registrado exitosamente. Préstamo completado!');
            setTimeout(() => {
              if (window.confirm('✅ Préstamo completamente pagado. ¿Quieres archivarlo ahora?')) {
                archivarPrestamo(prestamoSeleccionado);
              }
            }, 500);
          } else {
            setMessage('✅ Pago registrado exitosamente');
          }
          
          setTimeout(() => setMessage(''), 3000);
        }, 150);
        
      } else {
        setMessage(`❌ Error: ${response.data.error || 'No se pudo procesar el pago'}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error procesando pago:', error);
      setMessage('❌ Error al procesar el pago. Verifica la conexión.');
      setLoading(false);
    }
  };

  const marcarComoPagado = async (prestamo) => {
    const saldoPendiente = parseFloat(prestamo.saldo_pendiente);
    
    if (saldoPendiente <= 0) {
      setMessage('✅ Este préstamo ya está pagado');
      return;
    }

    if (window.confirm(`¿Marcar el préstamo de ${prestamo.nombre} como completamente pagado? Saldo: ${formatearMoneda(saldoPendiente)}`)) {
      setLoading(true);
      try {
        const response = await axios.post('http://localhost:8080/api_postgres.php?action=pago', {
          id_prestamo: parseInt(prestamo.id_prestamo),
          monto_pago: saldoPendiente
        });

        if (response.data.success) {
          setMessage('✅ Préstamo marcado como pagado');
          setLoading(false);
          
          setTimeout(async () => {
            await cargarPrestamos();
            
            setTimeout(() => {
              if (window.confirm('¿Quieres archivar este préstamo ahora?')) {
                archivarPrestamo(prestamo);
              }
            }, 500);
            
            setTimeout(() => setMessage(''), 3000);
          }, 150);
        } else {
          setMessage(`❌ Error: ${response.data.error}`);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error marcando como pagado:', error);
        setMessage('❌ Error al marcar como pagado');
        setLoading(false);
      }
    }
  };

  const archivarPrestamo = async (prestamo) => {
    if (window.confirm(`¿Archivar el préstamo de ${prestamo.nombre}? Este préstamo desaparecerá de esta lista.`)) {
      setLoading(true);
      try {
        const saldoPendiente = parseFloat(prestamo.saldo_pendiente);
        if (saldoPendiente > 0) {
          if (!window.confirm(`⚠️ Este préstamo aún tiene saldo pendiente: ${formatearMoneda(saldoPendiente)}. ¿Estás seguro?`)) {
            setLoading(false);
            return;
          }
        }

        const response = await axios.post('http://localhost:8080/api_postgres.php?action=archivar_prestamo', {
          id_prestamo: parseInt(prestamo.id_prestamo)
        });

        if (response.data.success) {
          setMessage('📁 Préstamo archivado exitosamente.');
          setLoading(false);
          
          setTimeout(async () => {
            await cargarPrestamos();
            setTimeout(() => setMessage(''), 4000);
          }, 150);
        } else {
          setMessage(`❌ Error: ${response.data.error || 'No se pudo archivar'}`);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error archivando préstamo:', error);
        
        if (error.response && error.response.status === 404) {
          setMessage('📁 Préstamo archivado (simulado).');
          setLoading(false);
          setTimeout(async () => {
            await cargarPrestamos();
          }, 150);
        } else {
          setMessage('❌ Error al archivar el préstamo');
          setLoading(false);
        }
      }
    }
  };

  const prestamosFiltrados = prestamos.filter(prestamo => {
    const saldo = parseFloat(prestamo.saldo_pendiente);
    
    if (filtro === 'activos') return saldo > 0;
    if (filtro === 'pagados') return saldo <= 0;
    if (filtro === 'vencidos') {
      const hoy = new Date();
      const fechaVencimiento = new Date(prestamo.fecha_ultimo_pago);
      return saldo > 0 && hoy > fechaVencimiento;
    }
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
    const saldo = parseFloat(prestamo.saldo_pendiente);
    
    if (saldo <= 0) return { texto: 'Pagado', clase: 'pagado' };
    
    const hoy = new Date();
    const fechaVencimiento = new Date(prestamo.fecha_ultimo_pago);
    
    if (hoy > fechaVencimiento) return { texto: 'Vencido', clase: 'vencido' };
    return { texto: 'Activo', clase: 'activo' };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            🏦 Gestión de Préstamos
          </h1>
          <p className="text-gray-600 mb-4">Administra y realiza seguimiento a todos los préstamos activos</p>
          <button 
            onClick={cargarPrestamos} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            📊 Cargar Estadísticas
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.includes('✅') || message.includes('📁') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-lg mb-6">
            {error}
            <button onClick={cargarPrestamos} className="ml-4 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200">
              Reintentar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="text-2xl">📊</div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Total de Préstamos</h3>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totalPrestamos}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🟢</div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Préstamos Activos</h3>
                <p className="text-2xl font-bold text-green-600">{estadisticas.totalActivos}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔴</div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Vencidos</h3>
                <p className="text-2xl font-bold text-red-600">{estadisticas.totalVencidos}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="text-2xl">✅</div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Pagados</h3>
                <p className="text-2xl font-bold text-blue-600">{estadisticas.totalPagados}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="text-2xl">💰</div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Total Prestado</h3>
                <p className="text-lg font-bold text-gray-900">{formatearMoneda(estadisticas.montoTotalPrestado)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="text-2xl">📈</div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Saldo Pendiente</h3>
                <p className="text-lg font-bold text-orange-600">{formatearMoneda(estadisticas.saldoPendienteTotal)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap gap-2">
              <button 
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${filtro === 'todos' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setFiltro('todos')}
              >
                Todos ({prestamos.length})
              </button>
              <button 
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${filtro === 'activos' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setFiltro('activos')}
              >
                Por Pagar ({estadisticas.totalActivos})
              </button>
              <button 
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${filtro === 'vencidos' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setFiltro('vencidos')}
              >
                Vencidos ({estadisticas.totalVencidos})
              </button>
              <button 
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${filtro === 'pagados' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setFiltro('pagados')}
              >
                Pagados ({estadisticas.totalPagados})
              </button>
            </div>
            
            <button 
              onClick={cargarPrestamos} 
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              🔄 {loading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading && prestamos.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando préstamos...</p>
              </div>
            </div>
          ) : prestamosFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prestatario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progreso</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Inicial</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interés</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total a Pagar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Pendiente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Inicio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Vencimiento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prestamosFiltrados.map(prestamo => {
                    const estado = getEstadoPrestamo(prestamo);
                    const saldoPendiente = parseFloat(prestamo.saldo_pendiente);
                    const progreso = calcularProgreso(prestamo);
                    
                    return (
                      <tr key={prestamo.id_prestamo} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{prestamo.nombre}</div>
                          <div className="text-sm text-gray-500">{prestamo.telefono}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-24">
                            <ProgressBar 
                              pagado={progreso.pagado}
                              total={progreso.total}
                              porcentaje={progreso.porcentaje}
                              height={8}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {progreso.porcentaje.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatearMoneda(prestamo.monto_inicial)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {prestamo.tasa_interes}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatearMoneda(prestamo.monto_total)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          saldoPendiente > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatearMoneda(saldoPendiente)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatearFecha(prestamo.fecha_inicio)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          estado.clase === 'vencido' ? 'text-red-600 font-medium' : 'text-gray-900'
                        }`}>
                          {formatearFecha(prestamo.fecha_ultimo_pago)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            estado.clase === 'pagado' 
                              ? 'bg-green-100 text-green-800'
                              : estado.clase === 'vencido'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {estado.texto}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              className="text-blue-600 hover:text-blue-900 transition-colors duration-150"
                              onClick={() => verDetallesCompletos(prestamo)}
                              title="Ver detalles"
                            >
                              📊
                            </button>
                            {saldoPendiente > 0 ? (
                              <>
                                <button 
                                  className="text-green-600 hover:text-green-900 transition-colors duration-150"
                                  onClick={() => handleRegistrarPago(prestamo)}
                                  title="Registrar pago"
                                >
                                  💰
                                </button>
                                <button 
                                  className="text-purple-600 hover:text-purple-900 transition-colors duration-150"
                                  onClick={() => marcarComoPagado(prestamo)}
                                  title="Marcar pagado"
                                >
                                  ✅
                                </button>
                              </>
                            ) : (
                              <button 
                                className="text-gray-600 hover:text-gray-900 transition-colors duration-150"
                                onClick={() => archivarPrestamo(prestamo)}
                                title="Archivar"
                              >
                                📁
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No hay préstamos {filtro !== 'todos' ? `con filtro "${filtro}"` : 'registrados'}</p>
              {prestamos.length === 0 && (
                <button 
                  onClick={cargarPrestamos} 
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Reintentar carga
                </button>
              )}
            </div>
          )}
        </div>

        {/* MODAL DE PAGO */}
        {mostrarModalPago && prestamoSeleccionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">💰</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Registrar Pago</h3>
                      <p className="text-sm text-gray-600">Completa los datos del pago</p>
                    </div>
                  </div>
                  <button 
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setMostrarModalPago(false)}
                    disabled={loading}
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        {prestamoSeleccionado.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{prestamoSeleccionado.nombre}</h4>
                        <p className="text-sm text-gray-600">Tel: {prestamoSeleccionado.telefono}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Préstamo:</span>
                        <span className="font-medium">{formatearMoneda(prestamoSeleccionado.monto_total)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pagado:</span>
                        <span className="font-medium text-green-600">
                          {formatearMoneda(calcularProgreso(prestamoSeleccionado).pagado)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span className="text-gray-600 font-medium">Saldo Pendiente:</span>
                        <span className="font-bold text-red-600">
                          {formatearMoneda(prestamoSeleccionado.saldo_pendiente)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💵 Monto del Pago
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">S/</span>
                      <input
                        type="number"
                        value={montoPago}
                        onChange={(e) => setMontoPago(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        placeholder="0.00"
                        step="0.01"
                        min="0.01"
                        max={prestamoSeleccionado.saldo_pendiente}
                        disabled={loading}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Máximo: <strong>{formatearMoneda(prestamoSeleccionado.saldo_pendiente)}</strong>
                    </div>
                  </div>

                  {montoPago && parseFloat(montoPago) > 0 && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Vista Previa</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nuevo saldo:</span>
                          <span className="font-medium text-green-600">
                            {formatearMoneda(parseFloat(prestamoSeleccionado.saldo_pendiente) - parseFloat(montoPago))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nuevo progreso:</span>
                          <span className="font-medium text-blue-600">
                            {(((calcularProgreso(prestamoSeleccionado).pagado + parseFloat(montoPago)) / calcularProgreso(prestamoSeleccionado).total) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button 
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
                  onClick={() => setMostrarModalPago(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button 
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  onClick={procesarPago}
                  disabled={loading || !montoPago || parseFloat(montoPago) <= 0}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Procesando...
                    </>
                  ) : (
                    '💳 Confirmar Pago'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE DETALLES COMPLETOS */}
        {mostrarModalDetalles && prestamoSeleccionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">📊</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Detalles del Préstamo</h3>
                      <p className="text-sm text-gray-600">Información completa y progreso</p>
                    </div>
                  </div>
                  <button 
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setMostrarModalDetalles(false)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                      {prestamoSeleccionado.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900">{prestamoSeleccionado.nombre}</h2>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">📱 {prestamoSeleccionado.telefono}</span>
                        <span className="flex items-center gap-1">🆔 {prestamoSeleccionado.dni}</span>
                        <span className="flex items-center gap-1">📅 {prestamoSeleccionado.cantidad_periodo} {prestamoSeleccionado.tipo_periodo}</span>
                      </div>
                    </div>
                    <div>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        getEstadoPrestamo(prestamoSeleccionado).clase === 'pagado' 
                          ? 'bg-green-100 text-green-800'
                          : getEstadoPrestamo(prestamoSeleccionado).clase === 'vencido'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getEstadoPrestamo(prestamoSeleccionado).texto}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">📈 Progreso del Préstamo</h4>
                    </div>
                    <div className="flex flex-col items-center space-y-4">
                      <div className="flex justify-center">
                        <CircularProgress 
                          porcentaje={calcularProgreso(prestamoSeleccionado).porcentaje}
                          pagado={calcularProgreso(prestamoSeleccionado).pagado}
                          total={calcularProgreso(prestamoSeleccionado).total}
                          size={140}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4 w-full">
                        <div className="text-center bg-white rounded-lg p-3">
                          <div className="text-2xl mb-1">💰</div>
                          <div className="text-sm font-medium text-green-600">{formatearMoneda(calcularProgreso(prestamoSeleccionado).pagado)}</div>
                          <div className="text-xs text-gray-500">Pagado</div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-3">
                          <div className="text-2xl mb-1">⏳</div>
                          <div className="text-sm font-medium text-red-600">{formatearMoneda(prestamoSeleccionado.saldo_pendiente)}</div>
                          <div className="text-xs text-gray-500">Pendiente</div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-3">
                          <div className="text-2xl mb-1">🎯</div>
                          <div className="text-sm font-medium text-gray-900">{formatearMoneda(calcularProgreso(prestamoSeleccionado).total)}</div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>
                      </div>
                      <div className="w-full">
                        <ProgressBar 
                          pagado={calcularProgreso(prestamoSeleccionado).pagado}
                          total={calcularProgreso(prestamoSeleccionado).total}
                          porcentaje={calcularProgreso(prestamoSeleccionado).porcentaje}
                          height={12}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">💰 Información Financiera</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-white rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="text-lg">🏦</div>
                          <span className="text-sm font-medium text-gray-600">Monto Inicial</span>
                        </div>
                        <span className="font-medium text-gray-900">{formatearMoneda(prestamoSeleccionado.monto_inicial)}</span>
                      </div>
                      <div className="flex items-center justify-between bg-white rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="text-lg">📊</div>
                          <span className="text-sm font-medium text-gray-600">Tasa de Interés</span>
                        </div>
                        <span className="font-medium text-gray-900">{prestamoSeleccionado.tasa_interes}%</span>
                      </div>
                      <div className="flex items-center justify-between bg-white rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="text-lg">📅</div>
                          <span className="text-sm font-medium text-gray-600">Fecha Inicio</span>
                        </div>
                        <span className="font-medium text-gray-900">{formatearFecha(prestamoSeleccionado.fecha_inicio)}</span>
                      </div>
                      <div className="flex items-center justify-between bg-white rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="text-lg">⏰</div>
                          <span className="text-sm font-medium text-gray-600">Fecha Vencimiento</span>
                        </div>
                        <span className={`font-medium ${
                          getEstadoPrestamo(prestamoSeleccionado).clase === 'vencido' ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {formatearFecha(prestamoSeleccionado.fecha_ultimo_pago)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 bg-yellow-50 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">📅 Historial de Pagos</h4>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {cargandoPagos ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                          <span className="text-gray-600">Cargando historial de pagos...</span>
                        </div>
                      ) : pagosDetalle.length > 0 ? (
                        <TimelinePagos 
                          pagos={pagosDetalle}
                          proximoPago={prestamoSeleccionado.saldo_pendiente > 0 ? {
                            fecha: prestamoSeleccionado.fecha_ultimo_pago,
                            monto: prestamoSeleccionado.saldo_pendiente
                          } : null}
                        />
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-2">📝</div>
                          <p className="text-gray-600">No se registraron pagos para este préstamo</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button 
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
                  onClick={() => setMostrarModalDetalles(false)}
                >
                  Cerrar
                </button>
                {parseFloat(prestamoSeleccionado.saldo_pendiente) > 0 && (
                  <button 
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
                    onClick={() => {
                      setMostrarModalDetalles(false);
                      setTimeout(() => handleRegistrarPago(prestamoSeleccionado), 300);
                    }}
                  >
                    💰 Registrar Pago
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionarPrestamos;
