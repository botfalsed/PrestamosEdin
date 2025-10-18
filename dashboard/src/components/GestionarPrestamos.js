import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ProgressBar, CircularProgress, TimelinePagos } from '../components/ProgressCharts';
import { useSyncDashboard } from '../hooks/useSyncDashboard';
import '../assets/css/GestionarPagos.css';

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
      const response = await axios.get('http://192.168.18.22:8080/api_postgres.php?action=prestamos');
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
      const response = await axios.get(`http://192.168.18.22:8080/api_postgres.php?action=pagos&id_prestamo=${idPrestamo}`);
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
      const response = await axios.post('http://192.168.18.22:8080/api_postgres.php?action=pago', {
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
        const response = await axios.post('http://192.168.18.22:8080/api_postgres.php?action=pago', {
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

        const response = await axios.post('http://192.168.18.22:8080/api_postgres.php?action=archivar_prestamo', {
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
    <div className="gestion-container">
      <div className="gestion-header">
        <h1>🏦 Gestión de Préstamos</h1>
        <p>Administra y realiza seguimiento a todos los préstamos activos</p>
      </div>
      <button 
        onClick={cargarPrestamos} 
        className="btn-actualizar"
        style={{marginTop: '10px'}}
      >
        📊 Cargar Estadísticas
      </button>

      {message && (
        <div className={`alert ${message.includes('✅') || message.includes('📁') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={cargarPrestamos} className="btn-reintentar">
            Reintentar
          </button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total de Préstamos</h3>
            <p className="stat-value">{estadisticas.totalPrestamos}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <h3>Préstamos Activos</h3>
            <p className="stat-value">{estadisticas.totalActivos}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔴</div>
          <div className="stat-content">
            <h3>Vencidos</h3>
            <p className="stat-value">{estadisticas.totalVencidos}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Pagados</h3>
            <p className="stat-value">{estadisticas.totalPagados}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Prestado</h3>
            <p className="stat-value">{formatearMoneda(estadisticas.montoTotalPrestado)}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Saldo Pendiente</h3>
            <p className="stat-value">{formatearMoneda(estadisticas.saldoPendienteTotal)}</p>
          </div>
        </div>
      </div>

      <div className="controles-section">
        <div className="filtros">
          <button 
            className={`filtro-btn ${filtro === 'todos' ? 'active' : ''}`}
            onClick={() => setFiltro('todos')}
          >
            Todos ({prestamos.length})
          </button>
          <button 
            className={`filtro-btn ${filtro === 'activos' ? 'active' : ''}`}
            onClick={() => setFiltro('activos')}
          >
            Por Pagar ({estadisticas.totalActivos})
          </button>
          <button 
            className={`filtro-btn ${filtro === 'vencidos' ? 'active' : ''}`}
            onClick={() => setFiltro('vencidos')}
          >
            Vencidos ({estadisticas.totalVencidos})
          </button>
          <button 
            className={`filtro-btn ${filtro === 'pagados' ? 'active' : ''}`}
            onClick={() => setFiltro('pagados')}
          >
            Pagados ({estadisticas.totalPagados})
          </button>
        </div>
        
        <button 
          onClick={cargarPrestamos} 
          className="btn-actualizar"
          disabled={loading}
        >
          🔄 {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      <div className="table-container">
        {loading && prestamos.length === 0 ? (
          <div className="loading">Cargando préstamos...</div>
        ) : prestamosFiltrados.length > 0 ? (
          <table className="prestamos-table">
            <thead>
              <tr>
                <th>Prestatario</th>
                <th>Progreso</th>
                <th>Monto Inicial</th>
                <th>Interés</th>
                <th>Total a Pagar</th>
                <th>Saldo Pendiente</th>
                <th>Fecha Inicio</th>
                <th>Fecha Vencimiento</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {prestamosFiltrados.map(prestamo => {
                const estado = getEstadoPrestamo(prestamo);
                const saldoPendiente = parseFloat(prestamo.saldo_pendiente);
                const progreso = calcularProgreso(prestamo);
                
                return (
                  <tr key={prestamo.id_prestamo}>
                    <td className="prestatario-cell">
                      <strong>{prestamo.nombre}</strong>
                      <br />
                      <small>{prestamo.telefono}</small>
                    </td>
                    <td className="progreso-cell">
                      <ProgressBar 
                        pagado={progreso.pagado}
                        total={progreso.total}
                        porcentaje={progreso.porcentaje}
                        height={8}
                      />
                      <div className="progreso-porcentaje">
                        {progreso.porcentaje.toFixed(1)}%
                      </div>
                    </td>
                    <td className="monto">{formatearMoneda(prestamo.monto_inicial)}</td>
                    <td className="interes">{prestamo.tasa_interes}%</td>
                    <td className="monto-total">{formatearMoneda(prestamo.monto_total)}</td>
                    <td className={`saldo ${saldoPendiente > 0 ? 'pendiente' : 'pagado'}`}>
                      {formatearMoneda(saldoPendiente)}
                    </td>
                    <td>{formatearFecha(prestamo.fecha_inicio)}</td>
                    <td className={estado.clase === 'vencido' ? 'fecha-vencida' : ''}>
                      {formatearFecha(prestamo.fecha_ultimo_pago)}
                    </td>
                    <td>
                      <span className={`estado-badge ${estado.clase}`}>
                        {estado.texto}
                      </span>
                    </td>
                    <td className="acciones-cell">
                      <div className="acciones-grid">
                        <button 
                          className="btn-detalle"
                          onClick={() => verDetallesCompletos(prestamo)}
                          title="Ver detalles"
                        >
                          📊
                        </button>
                        {saldoPendiente > 0 ? (
                          <>
                            <button 
                              className="btn-pago"
                              onClick={() => handleRegistrarPago(prestamo)}
                              title="Registrar pago"
                            >
                              💰
                            </button>
                            <button 
                              className="btn-pagado"
                              onClick={() => marcarComoPagado(prestamo)}
                              title="Marcar pagado"
                            >
                              ✅
                            </button>
                          </>
                        ) : (
                          <button 
                            className="btn-archivar"
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
        ) : (
          <div className="no-data">
            <p>No hay préstamos {filtro !== 'todos' ? `con filtro "${filtro}"` : 'registrados'}</p>
            {prestamos.length === 0 && (
              <button onClick={cargarPrestamos} className="btn-reintentar">
                Reintentar carga
              </button>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE PAGO */}
      {mostrarModalPago && prestamoSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-content modal-pago">
            <div className="modal-header modal-header-pago">
              <div className="modal-icon">💰</div>
              <div className="modal-title">
                <h3>Registrar Pago</h3>
                <p>Completa los datos del pago</p>
              </div>
              <button 
                className="modal-close"
                onClick={() => setMostrarModalPago(false)}
                disabled={loading}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="prestamo-card">
                <div className="prestamo-header">
                  <div className="prestatario-avatar">
                    {prestamoSeleccionado.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="prestatario-info">
                    <h4>{prestamoSeleccionado.nombre}</h4>
                    <p>Tel: {prestamoSeleccionado.telefono}</p>
                  </div>
                </div>
                
                <div className="prestamo-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total Préstamo:</span>
                    <span className="stat-value">{formatearMoneda(prestamoSeleccionado.monto_total)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Pagado:</span>
                    <span className="stat-value success">
                      {formatearMoneda(calcularProgreso(prestamoSeleccionado).pagado)}
                    </span>
                  </div>
                  <div className="stat-item destacado">
                    <span className="stat-label">Saldo Pendiente:</span>
                    <span className="stat-value warning">
                      {formatearMoneda(prestamoSeleccionado.saldo_pendiente)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-group">
                  <label className="form-label">💵 Monto del Pago</label>
                  <div className="input-group">
                    <span className="input-prefix">S/</span>
                    <input
                      type="number"
                      value={montoPago}
                      onChange={(e) => setMontoPago(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                      max={prestamoSeleccionado.saldo_pendiente}
                      disabled={loading}
                      className="form-input"
                    />
                  </div>
                  <div className="input-helper">
                    Máximo: <strong>{formatearMoneda(prestamoSeleccionado.saldo_pendiente)}</strong>
                  </div>
                </div>

                {montoPago && parseFloat(montoPago) > 0 && (
                  <div className="pago-preview">
                    <div className="preview-item">
                      <span>Nuevo saldo:</span>
                      <span className="preview-value">
                        {formatearMoneda(parseFloat(prestamoSeleccionado.saldo_pendiente) - parseFloat(montoPago))}
                      </span>
                    </div>
                    <div className="preview-item">
                      <span>Nuevo progreso:</span>
                      <span className="preview-value">
                        {(((calcularProgreso(prestamoSeleccionado).pagado + parseFloat(montoPago)) / calcularProgreso(prestamoSeleccionado).total) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setMostrarModalPago(false)}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary"
                onClick={procesarPago}
                disabled={loading || !montoPago || parseFloat(montoPago) <= 0}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
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
        <div className="modal-overlay">
          <div className="modal-content modal-detalles">
            <div className="modal-header modal-header-detalles">
              <div className="modal-icon">📊</div>
              <div className="modal-title">
                <h3>Detalles del Préstamo</h3>
                <p>Información completa y progreso</p>
              </div>
              <button 
                className="modal-close"
                onClick={() => setMostrarModalDetalles(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="prestatario-header">
                <div className="avatar-large">
                  {prestamoSeleccionado.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="prestatario-details">
                  <h2>{prestamoSeleccionado.nombre}</h2>
                  <div className="contact-info">
                    <span className="contact-item">📱 {prestamoSeleccionado.telefono}</span>
                    <span className="contact-item">🆔 {prestamoSeleccionado.dni}</span>
                    <span className="contact-item">📅 {prestamoSeleccionado.cantidad_periodo} {prestamoSeleccionado.tipo_periodo}</span>
                  </div>
                </div>
                <div className="estado-global">
                  <span className={`estado-badge grande ${getEstadoPrestamo(prestamoSeleccionado).clase}`}>
                    {getEstadoPrestamo(prestamoSeleccionado).texto}
                  </span>
                </div>
              </div>

              <div className="detalles-grid">
                <div className="seccion-progreso">
                  <div className="seccion-header">
                    <h4>📈 Progreso del Préstamo</h4>
                  </div>
                  <div className="progreso-container">
                    <div className="progreso-circular">
                      <CircularProgress 
                        porcentaje={calcularProgreso(prestamoSeleccionado).porcentaje}
                        pagado={calcularProgreso(prestamoSeleccionado).pagado}
                        total={calcularProgreso(prestamoSeleccionado).total}
                        size={140}
                      />
                    </div>
                    <div className="progreso-stats">
                      <div className="stat-card-detalle">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                          <span className="stat-value">{formatearMoneda(calcularProgreso(prestamoSeleccionado).pagado)}</span>
                          <span className="stat-label">Pagado</span>
                        </div>
                      </div>
                      <div className="stat-card-detalle">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-content">
                          <span className="stat-value warning">{formatearMoneda(prestamoSeleccionado.saldo_pendiente)}</span>
                          <span className="stat-label">Pendiente</span>
                        </div>
                      </div>
                      <div className="stat-card-detalle">
                        <div className="stat-icon">🎯</div>
                        <div className="stat-content">
                          <span className="stat-value">{formatearMoneda(calcularProgreso(prestamoSeleccionado).total)}</span>
                          <span className="stat-label">Total</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="progreso-barra-completa">
                    <ProgressBar 
                      pagado={calcularProgreso(prestamoSeleccionado).pagado}
                      total={calcularProgreso(prestamoSeleccionado).total}
                      porcentaje={calcularProgreso(prestamoSeleccionado).porcentaje}
                      height={12}
                    />
                  </div>
                </div>

                <div className="seccion-financiera">
                  <div className="seccion-header">
                    <h4>💰 Información Financiera</h4>
                  </div>
                  <div className="info-cards">
                    <div className="info-card">
                      <div className="info-icon">🏦</div>
                      <div className="info-content">
                        <span className="info-label">Monto Inicial</span>
                        <span className="info-value">{formatearMoneda(prestamoSeleccionado.monto_inicial)}</span>
                      </div>
                    </div>
                    <div className="info-card">
                      <div className="info-icon">📊</div>
                      <div className="info-content">
                        <span className="info-label">Tasa de Interés</span>
                        <span className="info-value">{prestamoSeleccionado.tasa_interes}%</span>
                      </div>
                    </div>
                    <div className="info-card">
                      <div className="info-icon">📅</div>
                      <div className="info-content">
                        <span className="info-label">Fecha Inicio</span>
                        <span className="info-value">{formatearFecha(prestamoSeleccionado.fecha_inicio)}</span>
                      </div>
                    </div>
                    <div className="info-card">
                      <div className="info-icon">⏰</div>
                      <div className="info-content">
                        <span className="info-label">Fecha Vencimiento</span>
                        <span className={`info-value ${getEstadoPrestamo(prestamoSeleccionado).clase === 'vencido' ? 'vencido' : ''}`}>
                          {formatearFecha(prestamoSeleccionado.fecha_ultimo_pago)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="seccion-historial">
                  <div className="seccion-header">
                    <h4>📅 Historial de Pagos</h4>
                  </div>
                  <div className="historial-container">
                    {cargandoPagos ? (
                      <div className="loading-pagos">
                        <div className="loading-spinner"></div>
                        Cargando historial de pagos...
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
                      <div className="no-pagos">
                        <div className="no-pagos-icon">📝</div>
                        <p>No se registraron pagos para este préstamo</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setMostrarModalDetalles(false)}
              >
                Cerrar
              </button>
              {parseFloat(prestamoSeleccionado.saldo_pendiente) > 0 && (
                <button 
                  className="btn btn-primary"
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
  );
};

export default GestionarPrestamos;
