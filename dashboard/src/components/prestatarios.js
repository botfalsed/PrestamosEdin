import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSyncDashboard } from '../hooks/useSyncDashboard';

const Prestatarios = () => {
  const [prestatarios, setPrestatarios] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    direccion: '',
    telefono: '',
    estado: 'activo',
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPrestatario, setSelectedPrestatario] = useState(null);
  const [pagosPrestatario, setPagosPrestatario] = useState([]);
  const [showModalPagos, setShowModalPagos] = useState(false);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [prestamosPrestatario, setPrestamosPrestatario] = useState([]);

  // Hook de sincronización para actualizar automáticamente
  useSyncDashboard(['prestatarios', 'prestamos', 'pagos'], (cambios) => {
    console.log('👥 Prestatarios recibió cambios:', cambios);
    console.log('🔄 Recargando prestatarios por cambios en sincronización');
    cargarPrestatarios();
  });

  useEffect(() => {
    cargarPrestatarios();
  }, []);

  const cargarPrestatarios = () => {
    setLoading(true);
    axios.get('http://localhost:8080/api_postgres.php?action=prestatarios')
      .then(response => {
        if (Array.isArray(response.data)) {
          setPrestatarios(response.data);
        }
      })
      .catch(error => {
        console.error('Error fetching prestatarios:', error);
        setMessage('Error al cargar prestatarios');
        setMessageType('error');
      })
      .finally(() => setLoading(false));
  };

  // Cargar préstamos del prestatario
  const cargarPrestamosPrestatario = (idPrestatario) => {
    return axios.get('http://localhost:8080/api_postgres.php?action=prestamos')
      .then(response => {
        if (Array.isArray(response.data)) {
          const prestamos = response.data.filter(prestamo => 
            prestamo.id_prestatario === idPrestatario
          );
          setPrestamosPrestatario(prestamos);
          return prestamos;
        }
        return [];
      })
      .catch(error => {
        console.error('Error cargando préstamos:', error);
        return [];
      });
  };

  // Cargar pagos de todos los préstamos del prestatario
  const cargarPagosPrestatario = async (idPrestatario) => {
    setLoadingPagos(true);
    try {
      // Primero cargar los préstamos del prestatario
      const prestamos = await cargarPrestamosPrestatario(idPrestatario);
      
      if (prestamos.length === 0) {
        setPagosPrestatario([]);
        return;
      }

      // Cargar pagos de cada préstamo
      const allPagos = [];
      
      for (const prestamo of prestamos) {
        try {
          const response = await axios.get(`http://localhost:8080/api_postgres.php?action=pagos&id_prestamo=${prestamo.id_prestamo}`);
          if (Array.isArray(response.data)) {
            const pagosConInfo = response.data.map(pago => ({
              ...pago,
              prestamo_id: prestamo.id_prestamo,
              monto_prestamo: prestamo.monto_total,
              nombre_prestamo: `Préstamo ${prestamo.id_prestamo}`
            }));
            allPagos.push(...pagosConInfo);
          }
        } catch (error) {
          console.error(`Error cargando pagos del préstamo ${prestamo.id_prestamo}:`, error);
        }
      }

      // Ordenar pagos por fecha (más reciente primero)
      allPagos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setPagosPrestatario(allPagos);
      
    } catch (error) {
      console.error('Error cargando pagos del prestatario:', error);
      setPagosPrestatario([]);
    } finally {
      setLoadingPagos(false);
    }
  };

  const verPagosPrestatario = (prestatario) => {
    setSelectedPrestatario(prestatario);
    setShowModalPagos(true);
    cargarPagosPrestatario(prestatario.id_prestatario);
  };

  const cerrarModalPagos = () => {
    setShowModalPagos(false);
    setSelectedPrestatario(null);
    setPagosPrestatario([]);
    setPrestamosPrestatario([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'dni') {
      const soloNumeros = value.replace(/\D/g, '').slice(0, 8);
      setFormData({ ...formData, [name]: soloNumeros });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validarDNI = (dni) => {
    if (!dni) return 'El DNI es requerido';
    if (dni.length !== 8) return 'El DNI debe tener 8 dígitos';
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const errorDNI = validarDNI(formData.dni);
    if (errorDNI) {
      setMessage(errorDNI);
      setMessageType('error');
      return;
    }

    setLoading(true);

    axios.post('http://localhost:8080/api_postgres.php?action=prestatarios', formData)
      .then(response => {
        if (response.data.success) {
          setMessage('Prestatario registrado exitosamente');
          setMessageType('success');
          setFormData({ 
            nombre: '', 
            dni: '', 
            direccion: '', 
            telefono: '', 
            estado: 'activo' 
          });
          cargarPrestatarios();
          setTimeout(() => setMessage(''), 4000);
        } else {
          setMessage('Error: ' + (response.data.error || 'No se pudo registrar'));
          setMessageType('error');
        }
      })
      .catch(error => {
        console.error('Error registrando prestatario:', error);
        setMessage('Error de servidor al registrar el prestatario');
        setMessageType('error');
      })
      .finally(() => setLoading(false));
  };

  const limpiarFormulario = () => {
    setFormData({ 
      nombre: '', 
      dni: '', 
      direccion: '', 
      telefono: '', 
      estado: 'activo' 
    });
    setMessage('');
  };

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Calcular estadísticas de pagos
  const calcularEstadisticas = (pagos) => {
    const totalPagado = pagos.reduce((sum, pago) => sum + parseFloat(pago.monto || 0), 0);
    const diasPagados = pagos.length;
    const ultimoPago = pagos.length > 0 ? pagos[0].fecha : null; // Ya están ordenados por fecha

    return { totalPagado, diasPagados, ultimoPago };
  };

  // Calcular estadísticas de préstamos
  const calcularEstadisticasPrestamos = (prestamos) => {
    const totalPrestamos = prestamos.length;
    const prestamosActivos = prestamos.filter(p => parseFloat(p.saldo_pendiente) > 0).length;
    const prestamosPagados = prestamos.filter(p => parseFloat(p.saldo_pendiente) <= 0).length;
    const montoTotalPrestado = prestamos.reduce((sum, p) => sum + parseFloat(p.monto_inicial || 0), 0);
    const saldoPendienteTotal = prestamos.reduce((sum, p) => sum + parseFloat(p.saldo_pendiente || 0), 0);

    return { totalPrestamos, prestamosActivos, prestamosPagados, montoTotalPrestado, saldoPendienteTotal };
  };

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(monto);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Prestatarios</h1>
          <p className="text-gray-600">Administra los prestatarios del sistema</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            messageType === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Registrar Nuevo Prestatario</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">DNI *</label>
                  <input
                    type="text"
                    name="dni"
                    value={formData.dni}
                    onChange={handleInputChange}
                    placeholder="Ej: 87654321"
                    maxLength="8"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <div className="text-xs text-gray-500 mt-1">8 dígitos</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="Ej: 987654321"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Juan Pérez García"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dirección *</label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  placeholder="Ej: Av. Principal 123"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Registrando...' : 'Registrar Prestatario'}
                </button>
                <button 
                  type="button" 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  onClick={limpiarFormulario}
                >
                  Limpiar
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Lista de Prestatarios ({prestatarios.length})</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Cargando prestatarios...</div>
              </div>
            ) : prestatarios.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-gray-700">DNI</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700">Nombre</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700">Teléfono</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700">Dirección</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700">Estado</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prestatarios.map(prestatario => (
                      <tr key={prestatario.id_prestatario} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <strong className="text-gray-900">{prestatario.dni}</strong>
                        </td>
                        <td className="py-3 px-2">
                          <strong className="text-gray-900">{prestatario.nombre}</strong>
                        </td>
                        <td className="py-3 px-2 text-gray-600">{prestatario.telefono}</td>
                        <td className="py-3 px-2 text-gray-600">{prestatario.direccion}</td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            prestatario.estado === 'activo' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {prestatario.estado}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <button 
                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                            onClick={() => verPagosPrestatario(prestatario)}
                            title="Ver historial de pagos"
                          >
                            📊 Ver Pagos
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay prestatarios registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para ver pagos */}
      {showModalPagos && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Historial de Pagos - {selectedPrestatario?.nombre}</h3>
              <button 
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                onClick={cerrarModalPagos}
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="block text-sm font-medium text-gray-700">DNI:</span>
                    <span className="text-gray-900">{selectedPrestatario?.dni}</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="block text-sm font-medium text-gray-700">Teléfono:</span>
                    <span className="text-gray-900">{selectedPrestatario?.telefono}</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="block text-sm font-medium text-gray-700">Dirección:</span>
                    <span className="text-gray-900">{selectedPrestatario?.direccion}</span>
                  </div>
                </div>
                
                {prestamosPrestatario.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Préstamos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-blue-600">{calcularEstadisticasPrestamos(prestamosPrestatario).totalPrestamos}</span>
                        <span className="text-sm text-blue-700">Total Préstamos</span>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-green-600">{calcularEstadisticasPrestamos(prestamosPrestatario).prestamosActivos}</span>
                        <span className="text-sm text-green-700">Préstamos Activos</span>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-gray-600">{calcularEstadisticasPrestamos(prestamosPrestatario).prestamosPagados}</span>
                        <span className="text-sm text-gray-700">Préstamos Pagados</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {loadingPagos ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Cargando pagos...</div>
                </div>
              ) : pagosPrestatario.length > 0 ? (
                <>
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Pagos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-purple-600">{calcularEstadisticas(pagosPrestatario).diasPagados}</span>
                        <span className="text-sm text-purple-700">Días Pagados</span>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-green-600">{formatearMoneda(calcularEstadisticas(pagosPrestatario).totalPagado)}</span>
                        <span className="text-sm text-green-700">Total Pagado</span>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-blue-600">
                          {calcularEstadisticas(pagosPrestatario).ultimoPago 
                            ? formatearFecha(calcularEstadisticas(pagosPrestatario).ultimoPago)
                            : 'N/A'}
                        </span>
                        <span className="text-sm text-blue-700">Último Pago</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Detalle de Pagos</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha de Pago</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Monto</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Préstamo</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagosPrestatario.map((pago, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div>
                                  <strong className="text-gray-900">{formatearFecha(pago.fecha)}</strong>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-green-600">
                                  {formatearMoneda(pago.monto)}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-blue-600 font-medium">
                                  Préstamo #{pago.prestamo_id}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                  ✅ Completado
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Este prestatario no tiene pagos registrados</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button 
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                onClick={cerrarModalPagos}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prestatarios;
