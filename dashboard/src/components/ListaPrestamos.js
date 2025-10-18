import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MiniProgress, ProgressBar } from '../components/ProgressCharts';
import { useSyncDashboard } from '../hooks/useSyncDashboard';
import '../assets/css/ListaPrestamos.css';

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
    axios.get('http://192.168.18.22:8080/api_postgres.php?action=prestamos')
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
      const response = await axios.get(`http://192.168.18.22:8080/api_postgres.php?action=pagos&id_prestamo=${idPrestamo}`);
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
      <div className="lista-container">
        <div className="loading">Cargando préstamos...</div>
      </div>
    );
  }

  return (
    <div className="lista-container">
      <div className="lista-header">
        <h1>📋 Lista de Préstamos</h1>
        <p>Gestión y seguimiento de todos los préstamos registrados</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={cargarPrestamos} className="btn-reintentar">
            Reintentar
          </button>
        </div>
      )}

      <div className="filtros-container">
        <div className="filtros">
          <button 
            className={`filtro-btn ${filtro === 'todos' ? 'active' : ''}`}
            onClick={() => setFiltro('todos')}
          >
            Todos
          </button>
          <button 
            className={`filtro-btn ${filtro === 'activos' ? 'active' : ''}`}
            onClick={() => setFiltro('activos')}
          >
            Activos
          </button>
          <button 
            className={`filtro-btn ${filtro === 'pagados' ? 'active' : ''}`}
            onClick={() => setFiltro('pagados')}
          >
            Pagados
          </button>
        </div>
        
        <div className="contador">
          <span className="total">Total: {prestamosFiltrados.length}</span>
          <span className="activos">
            Activos: {prestamos.filter(p => p.saldo_pendiente > 0).length}
          </span>
        </div>
      </div>

      <div className="table-container">
        <table className="prestamos-table">
          <thead>
            <tr>
              <th>Prestatario</th>
              <th>Progreso</th>
              <th>Monto Inicial</th>
              <th>Interés</th>
              <th>Monto Total</th>
              <th>Saldo Pendiente</th>
              <th>Fecha Inicio</th>
              <th>Fecha Vencimiento</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {prestamosFiltrados.length > 0 ? (
              prestamosFiltrados.map(prestamo => {
                const estado = getEstadoPrestamo(prestamo);
                const progreso = calcularProgreso(prestamo);
                const estaExpandido = prestamoExpandido === prestamo.id_prestamo;
                
                return (
                  <React.Fragment key={prestamo.id_prestamo}>
                    <tr className={`prestamo-row ${estaExpandido ? 'expanded' : ''}`}>
                      <td className="prestatario-cell">
                        <div className="prestatario-info">
                          <strong>{prestamo.nombre}</strong>
                          <small>{prestamo.telefono}</small>
                        </div>
                      </td>
                      <td className="progreso-cell">
                        <MiniProgress 
                          pagado={progreso.pagado} 
                          total={progreso.total} 
                        />
                        <div className="progreso-text">
                          {progreso.porcentaje.toFixed(1)}%
                        </div>
                      </td>
                      <td className="monto">{formatearMoneda(prestamo.monto_inicial)}</td>
                      <td className="interes">{parseFloat(prestamo.tasa_interes).toFixed(1)}%</td>
                      <td className="monto-total">{formatearMoneda(prestamo.monto_total)}</td>
                      <td className={`saldo ${prestamo.saldo_pendiente > 0 ? 'pendiente' : 'pagado'}`}>
                        {formatearMoneda(prestamo.saldo_pendiente)}
                      </td>
                      <td>{formatearFecha(prestamo.fecha_inicio)}</td>
                      <td>{formatearFecha(prestamo.fecha_ultimo_pago)}</td>
                      <td>
                        <span 
                          className="estado-badge"
                          style={{ backgroundColor: getColorEstado(estado) }}
                        >
                          {estado}
                        </span>
                      </td>
                      <td className="acciones-cell">
                        <button 
                          className="btn-detalle"
                          onClick={() => toggleExpandirPrestamo(prestamo)}
                          title={estaExpandido ? "Ocultar detalles" : "Ver detalles"}
                        >
                          {estaExpandido ? '▲' : '▼'} Detalles
                        </button>
                      </td>
                    </tr>
                    
                    {/* Fila expandida con detalles */}
                    {estaExpandido && (
                      <tr className="detalle-row">
                        <td colSpan="10">
                          <div className="detalle-content">
                            <div className="detalle-header">
                              <h4>📊 Progreso Detallado del Préstamo</h4>
                              <span className="periodo-info">
                                Período: {prestamo.cantidad_periodo} {prestamo.tipo_periodo === 'dias' ? 'días' : 
                                prestamo.tipo_periodo === 'semanal' ? 'semanas' : 'meses'}
                              </span>
                            </div>
                            
                            <div className="detalle-grid">
                              <div className="progreso-completo">
                                <ProgressBar 
                                  pagado={progreso.pagado}
                                  total={progreso.total}
                                  porcentaje={progreso.porcentaje}
                                />
                                <div className="progreso-stats">
                                  <div className="stat-item">
                                    <span className="stat-label">Pagado:</span>
                                    <span className="stat-value success">{formatearMoneda(progreso.pagado)}</span>
                                  </div>
                                  <div className="stat-item">
                                    <span className="stat-label">Pendiente:</span>
                                    <span className="stat-value warning">{formatearMoneda(prestamo.saldo_pendiente)}</span>
                                  </div>
                                  <div className="stat-item">
                                    <span className="stat-label">Total:</span>
                                    <span className="stat-value info">{formatearMoneda(progreso.total)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="historial-pagos">
                                <h5>📅 Historial de Pagos</h5>
                                {pagosDetalle[prestamo.id_prestamo] ? (
                                  pagosDetalle[prestamo.id_prestamo].length > 0 ? (
                                    <div className="pagos-lista">
                                      {pagosDetalle[prestamo.id_prestamo].map((pago, index) => (
                                        <div key={index} className="pago-item">
                                          <span className="pago-fecha">{formatearFecha(pago.fecha)}</span>
                                          <span className="pago-monto">{formatearMoneda(pago.monto)}</span>
                                          <span className="pago-saldo">Saldo: {formatearMoneda(pago.saldo_restante)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="no-pagos">No se registraron pagos</p>
                                  )
                                ) : (
                                  <div className="loading-pagos">Cargando pagos...</div>
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
                <td colSpan="10" className="no-data">
                  {prestamos.length === 0 ? 'No hay préstamos registrados' : 'No hay préstamos que coincidan con el filtro'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <div className="resumen-total">
          <strong>Total Prestado:</strong> {formatearMoneda(prestamos.reduce((sum, p) => sum + parseFloat(p.monto_inicial), 0))}
        </div>
        <div className="resumen-saldo">
          <strong>Saldo Pendiente:</strong> {formatearMoneda(prestamos.reduce((sum, p) => sum + parseFloat(p.saldo_pendiente), 0))}
        </div>
      </div>
    </div>
  );
};

export default ListaPrestamos;
