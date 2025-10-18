import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SyncStatus } from './SyncStatus';
import { 
  calcularAlertasVencimientos, 
  obtenerTotalAlertas, 
  obtenerUrgenciaMaxima,
  filtrarPrestamosActivos,
  formatearMensajeAlerta 
} from '../utils/alertas';
import '../assets/css/inicio.css';

const Inicio = (props) => {  // ✅ Recibir props para comunicación global
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPrestamos: 0,
    prestamosActivos: 0,
    prestamosCompletados: 0,
    totalDeuda: 0,
    totalDesembolsado: 0,
    pagosRealizados: 0,
  });

  const [ultimosPagos, setUltimosPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertas, setAlertas] = useState({
    hoy: [],
    en3Dias: [],
    vencidos: [],
    estaSemana: []
  });
  const [totalAlertas, setTotalAlertas] = useState(0);
  const [urgenciaMaxima, setUrgenciaMaxima] = useState('ninguna');

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const response = await axios.get('http://192.168.18.22:8080/api_postgres.php?action=prestamos');
      const prestamos = response.data;

      // Filtrar préstamos activos para las alertas
      const prestamosActivos = filtrarPrestamosActivos(prestamos);
      
      // Calcular alertas
      const alertasCalculadas = calcularAlertasVencimientos(prestamosActivos);
      setAlertas(alertasCalculadas);
      
      const totalAlertasCalculadas = obtenerTotalAlertas(alertasCalculadas);
      setTotalAlertas(totalAlertasCalculadas);
      setUrgenciaMaxima(obtenerUrgenciaMaxima(alertasCalculadas));

      // ✅ COMUNICAR AL APP.JS EL TOTAL DE ALERTAS
      if (props.onAlertasChange) {
        props.onAlertasChange(totalAlertasCalculadas);
      }

      const activos = prestamos.filter(p => p.saldo_pendiente > 0).length;
      const completados = prestamos.filter(p => p.saldo_pendiente === 0).length;
      const totalDeuda = prestamos.reduce((sum, p) => sum + parseFloat(p.saldo_pendiente), 0);
      const totalDesembolsado = prestamos.reduce((sum, p) => sum + parseFloat(p.monto_inicial), 0);
      const pagosRealizados = totalDesembolsado - totalDeuda;

      setStats({
        totalPrestamos: prestamos.length,
        prestamosActivos: activos,
        prestamosCompletados: completados,
        totalDeuda: totalDeuda.toFixed(2),
        totalDesembolsado: totalDesembolsado.toFixed(2),
        pagosRealizados: pagosRealizados.toFixed(2),
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const getColorUrgencia = () => {
    switch (urgenciaMaxima) {
      case 'alta': return '#dc3545';
      case 'media': return '#ffc107';
      case 'baja': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  const getTextoUrgencia = () => {
    switch (urgenciaMaxima) {
      case 'alta': return 'Alta Urgencia';
      case 'media': return 'Atención Requerida';
      case 'baja': return 'En Observación';
      default: return 'Sin Alertas';
    }
  };

  const handleCambiosSincronizados = (cambios) => {
    console.log('Cambios sincronizados detectados:', cambios);
    // Recargar estadísticas cuando hay cambios
    cargarEstadisticas();
  };

  return (
    <div className="inicio-container">
      <div className="inicio-header">
        <h1>Panel de Administración</h1>
        <p className="inicio-saludo">Bienvenido de vuelta, administrador</p>
      </div>

      {/* ESTADO DE SINCRONIZACIÓN */}
      <SyncStatus onCambios={handleCambiosSincronizados} />

      {loading ? (
        <div className="loading">Cargando datos...</div>
      ) : (
        <>
          {/* ALERTAS DE VENCIMIENTOS - NUEVA SECCIÓN */}
          {totalAlertas > 0 && (
            <div className="alertas-section">
              <div className="alertas-header">
                <h2>🚨 Alertas de Vencimientos</h2>
                <span 
                  className="urgencia-badge"
                  style={{ backgroundColor: getColorUrgencia() }}
                >
                  {getTextoUrgencia()} ({totalAlertas})
                </span>
              </div>
              
              <div className="alertas-grid">
                {alertas.hoy.length > 0 && (
                  <div className="alerta-card alerta-urgente">
                    <div className="alerta-icon">🔥</div>
                    <div className="alerta-content">
                      <h4>Vencen HOY ({alertas.hoy.length})</h4>
                      <div className="alerta-list">
                        {alertas.hoy.slice(0, 3).map((prestamo, index) => (
                          <div key={index} className="alerta-item">
                            {formatearMensajeAlerta(prestamo)}
                          </div>
                        ))}
                        {alertas.hoy.length > 3 && (
                          <div className="alerta-more">
                            +{alertas.hoy.length - 3} más...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {alertas.en3Dias.length > 0 && (
                  <div className="alerta-card alerta-advertencia">
                    <div className="alerta-icon">⚠️</div>
                    <div className="alerta-content">
                      <h4>En 3 Días ({alertas.en3Dias.length})</h4>
                      <div className="alerta-list">
                        {alertas.en3Dias.slice(0, 3).map((prestamo, index) => (
                          <div key={index} className="alerta-item">
                            {formatearMensajeAlerta(prestamo)}
                          </div>
                        ))}
                        {alertas.en3Dias.length > 3 && (
                          <div className="alerta-more">
                            +{alertas.en3Dias.length - 3} más...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {alertas.vencidos.length > 0 && (
                  <div className="alerta-card alerta-vencido">
                    <div className="alerta-icon">💀</div>
                    <div className="alerta-content">
                      <h4>Vencidos ({alertas.vencidos.length})</h4>
                      <div className="alerta-list">
                        {alertas.vencidos.slice(0, 3).map((prestamo, index) => (
                          <div key={index} className="alerta-item">
                            {formatearMensajeAlerta(prestamo)}
                          </div>
                        ))}
                        {alertas.vencidos.length > 3 && (
                          <div className="alerta-more">
                            +{alertas.vencidos.length - 3} más...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {(alertas.hoy.length > 0 || alertas.en3Dias.length > 0 || alertas.vencidos.length > 0) && (
                <div className="alertas-actions">
                  <button 
                    className="btn-alertas"
                    onClick={() => navigate('/lista-prestamos')}
                  >
                    📋 Gestionar Todas las Alertas
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TARJETAS DE ESTADÍSTICAS */}
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>Total de Préstamos</h3>
                <p className="stat-value">{stats.totalPrestamos}</p>
              </div>
            </div>

            <div className="stat-card success">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>Préstamos Activos</h3>
                <p className="stat-value">{stats.prestamosActivos}</p>
              </div>
            </div>

            <div className="stat-card warning">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>Completados</h3>
                <p className="stat-value">{stats.prestamosCompletados}</p>
              </div>
            </div>

            <div className="stat-card info">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>Deuda Total</h3>
                <p className="stat-value">S/. {stats.totalDeuda}</p>
              </div>
            </div>

            <div className="stat-card secondary">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <h3>Total Desembolsado</h3>
                <p className="stat-value">S/. {stats.totalDesembolsado}</p>
              </div>
            </div>

            <div className="stat-card danger">
              <div className="stat-icon">💵</div>
              <div className="stat-content">
                <h3>Pagos Realizados</h3>
                <p className="stat-value">S/. {stats.pagosRealizados}</p>
              </div>
            </div>
          </div>

          {/* ACCIONES RÁPIDAS */}
          <div className="inicio-section">
            <h2>Acciones Rápidas</h2>
            <div className="actions-grid">
              <button className="action-btn btn-primary" onClick={() => navigate('/registrar-prestamo')}>
                <span>➕ Nuevo Préstamo</span>
              </button>
              <button className="action-btn btn-secondary" onClick={() => navigate('/lista-prestamos')}>
                <span>📋 Ver Préstamos</span>
              </button>
              <button className="action-btn btn-info" onClick={() => navigate('/prestatarios')}>
                <span>👥 Prestatarios</span>
              </button>
              <button className="action-btn btn-warning" onClick={() => navigate('/gestion-prestamos')}>
                <span>📊 Gestión</span>
              </button>
              <button className="action-btn btn-danger" onClick={() => navigate('/archivados')}>
                <span>📦 Archivados</span>
              </button>
            </div>
          </div>

          {/* RESUMEN FINANCIERO */}
          <div className="inicio-section info-section">
            <h2>Resumen Financiero</h2>
            <div className="info-box">
              <div className="resumen-grid">
                <div className="resumen-item">
                  <span className="resumen-label">Tasa de Recaudación</span>
                  <span className="resumen-value">
                    {stats.totalDesembolsado > 0 ? 
                      ((stats.pagosRealizados / stats.totalDesembolsado) * 100).toFixed(2) : 0}%
                  </span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Préstamos Vigentes</span>
                  <span className="resumen-value">
                    {stats.prestamosActivos} / {stats.totalPrestamos}
                  </span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Deuda Pendiente</span>
                  <span className="resumen-value">S/. {stats.totalDeuda}</span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Alertas Activas</span>
                  <span 
                    className="resumen-value"
                    style={{ color: getColorUrgencia() }}
                  >
                    {totalAlertas} {urgenciaMaxima !== 'ninguna' ? `(${getTextoUrgencia()})` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Inicio;
