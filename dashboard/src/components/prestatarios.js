import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSyncDashboard } from '../hooks/useSyncDashboard';
import '../assets/css/Prestatarios.css';

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
    axios.get('http://192.168.18.22:8080/api_postgres.php?action=prestatarios')
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
    return axios.get('http://192.168.18.22:8080/api_postgres.php?action=prestamos')
      .then(response => {
        if (Array.isArray(response.data)) {
          const prestamos = response.data.filter(prestamo => 
            prestamo.id_prestatario == idPrestatario
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
          const response = await axios.get(`http://192.168.18.22:8080/api_postgres.php?action=pagos&id_prestamo=${prestamo.id_prestamo}`);
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

    axios.post('http://192.168.18.22:8080/api_postgres.php?action=prestatarios', formData)
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
    <div className="prestatarios-container">
      <div className="prestatarios-header">
        <h1>Gestión de Prestatarios</h1>
        <p>Administra los prestatarios del sistema</p>
      </div>

      {message && (
        <div className={`alert alert-${messageType}`}>
          {message}
        </div>
      )}

      <div className="prestatarios-content">
        <div className="form-section">
          <h3>Registrar Nuevo Prestatario</h3>
          <form onSubmit={handleSubmit} className="prestatario-form">
            <div className="form-row">
              <div className="form-group">
                <label>DNI *</label>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleInputChange}
                  placeholder="Ej: 87654321"
                  maxLength="8"
                  required
                />
                <div className="input-info">8 dígitos</div>
              </div>

              <div className="form-group">
                <label>Teléfono *</label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="Ej: 987654321"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Nombre Completo *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Ej: Juan Pérez García"
                required
              />
            </div>

            <div className="form-group">
              <label>Dirección *</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                placeholder="Ej: Av. Principal 123"
                required
              />
            </div>

            <div className="form-group">
              <label>Estado</label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Registrando...' : 'Registrar Prestatario'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={limpiarFormulario}
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>

        <div className="list-section">
          <h3>Lista de Prestatarios ({prestatarios.length})</h3>
          
          {loading ? (
            <div className="loading">Cargando prestatarios...</div>
          ) : prestatarios.length > 0 ? (
            <div className="table-container">
              <table className="prestatarios-table">
                <thead>
                  <tr>
                    <th>DNI</th>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>Dirección</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {prestatarios.map(prestatario => (
                    <tr key={prestatario.id_prestatario}>
                      <td className="dni-cell">
                        <strong>{prestatario.dni}</strong>
                      </td>
                      <td className="nombre-cell">
                        <strong>{prestatario.nombre}</strong>
                      </td>
                      <td>{prestatario.telefono}</td>
                      <td>{prestatario.direccion}</td>
                      <td>
                        <span className={`estado-badge ${prestatario.estado}`}>
                          {prestatario.estado}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn-ver-pagos"
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
            <div className="no-data">
              <p>No hay prestatarios registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para ver pagos */}
      {showModalPagos && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Historial de Pagos - {selectedPrestatario?.nombre}</h3>
              <button className="modal-close" onClick={cerrarModalPagos}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="pagos-info">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">DNI:</span>
                    <span className="info-value">{selectedPrestatario?.dni}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Teléfono:</span>
                    <span className="info-value">{selectedPrestatario?.telefono}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Dirección:</span>
                    <span className="info-value">{selectedPrestatario?.direccion}</span>
                  </div>
                </div>
                
                {prestamosPrestatario.length > 0 && (
                  <div className="prestamos-stats">
                    <h4>Resumen de Préstamos</h4>
                    <div className="stats-grid">
                      <div className="stat-card">
                        <span className="stat-number">{calcularEstadisticasPrestamos(prestamosPrestatario).totalPrestamos}</span>
                        <span className="stat-label">Total Préstamos</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-number">{calcularEstadisticasPrestamos(prestamosPrestatario).prestamosActivos}</span>
                        <span className="stat-label">Préstamos Activos</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-number">{calcularEstadisticasPrestamos(prestamosPrestatario).prestamosPagados}</span>
                        <span className="stat-label">Préstamos Pagados</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {loadingPagos ? (
                <div className="loading">Cargando pagos...</div>
              ) : pagosPrestatario.length > 0 ? (
                <>
                  <div className="estadisticas-pagos">
                    <h4>Resumen de Pagos</h4>
                    <div className="stats-grid">
                      <div className="stat-card">
                        <span className="stat-number">{calcularEstadisticas(pagosPrestatario).diasPagados}</span>
                        <span className="stat-label">Días Pagados</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-number">{formatearMoneda(calcularEstadisticas(pagosPrestatario).totalPagado)}</span>
                        <span className="stat-label">Total Pagado</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-number">
                          {calcularEstadisticas(pagosPrestatario).ultimoPago 
                            ? formatearFecha(calcularEstadisticas(pagosPrestatario).ultimoPago)
                            : 'N/A'}
                        </span>
                        <span className="stat-label">Último Pago</span>
                      </div>
                    </div>
                  </div>

                  <div className="pagos-list">
                    <h4>Detalle de Pagos</h4>
                    <div className="table-container">
                      <table className="pagos-table">
                        <thead>
                          <tr>
                            <th>Fecha de Pago</th>
                            <th>Monto</th>
                            <th>Préstamo</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagosPrestatario.map((pago, index) => (
                            <tr key={index}>
                              <td>
                                <div className="fecha-pago">
                                  <strong>{formatearFecha(pago.fecha)}</strong>
                                </div>
                              </td>
                              <td>
                                <span className="monto-pago">
                                  {formatearMoneda(pago.monto)}
                                </span>
                              </td>
                              <td>
                                <span className="prestamo-id">
                                  Préstamo #{pago.prestamo_id}
                                </span>
                              </td>
                              <td>
                                <span className="estado-pago completado">
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
                <div className="no-pagos">
                  <p>Este prestatario no tiene pagos registrados</p>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={cerrarModalPagos}>
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
