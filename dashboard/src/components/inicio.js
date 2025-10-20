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
      const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api_postgres.php';
      const response = await axios.get(`${apiUrl}?action=prestamos`);
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
    <div className="p-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen font-sans">
      <div className="mb-10 text-left">
        <h1 className="text-4xl text-primary font-bold mb-2 bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
          Panel de Administración
        </h1>
        <p className="text-base text-gray-600 font-medium">Bienvenido de vuelta, administrador</p>
      </div>

      {/* ESTADO DE SINCRONIZACIÓN */}
      <SyncStatus onCambios={handleCambiosSincronizados} />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-lg text-gray-600">Cargando datos...</div>
        </div>
      ) : (
        <>
          {/* ALERTAS DE VENCIMIENTOS - NUEVA SECCIÓN */}
          {totalAlertas > 0 && (
            <div className="mb-12 bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                  🚨 Alertas de Vencimientos
                </h2>
                <span 
                  className="px-4 py-2 rounded-full text-white font-medium text-sm"
                  style={{ backgroundColor: getColorUrgencia() }}
                >
                  {getTextoUrgencia()} ({totalAlertas})
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {alertas.hoy.length > 0 && (
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-2xl">🔥</div>
                      <h4 className="font-semibold text-red-800">Vencen HOY ({alertas.hoy.length})</h4>
                    </div>
                    <div className="space-y-2">
                      {alertas.hoy.slice(0, 3).map((prestamo, index) => (
                        <div key={index} className="text-sm text-red-700 bg-red-100 p-2 rounded">
                          {formatearMensajeAlerta(prestamo)}
                        </div>
                      ))}
                      {alertas.hoy.length > 3 && (
                        <div className="text-sm text-red-600 font-medium">
                          +{alertas.hoy.length - 3} más...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {alertas.en3Dias.length > 0 && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-2xl">⚠️</div>
                      <h4 className="font-semibold text-yellow-800">En 3 Días ({alertas.en3Dias.length})</h4>
                    </div>
                    <div className="space-y-2">
                      {alertas.en3Dias.slice(0, 3).map((prestamo, index) => (
                        <div key={index} className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded">
                          {formatearMensajeAlerta(prestamo)}
                        </div>
                      ))}
                      {alertas.en3Dias.length > 3 && (
                        <div className="text-sm text-yellow-600 font-medium">
                          +{alertas.en3Dias.length - 3} más...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {alertas.vencidos.length > 0 && (
                  <div className="bg-gray-50 border-l-4 border-gray-600 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-2xl">💀</div>
                      <h4 className="font-semibold text-gray-800">Vencidos ({alertas.vencidos.length})</h4>
                    </div>
                    <div className="space-y-2">
                      {alertas.vencidos.slice(0, 3).map((prestamo, index) => (
                        <div key={index} className="text-sm text-gray-700 bg-gray-100 p-2 rounded">
                          {formatearMensajeAlerta(prestamo)}
                        </div>
                      ))}
                      {alertas.vencidos.length > 3 && (
                        <div className="text-sm text-gray-600 font-medium">
                          +{alertas.vencidos.length - 3} más...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {(alertas.hoy.length > 0 || alertas.en3Dias.length > 0 || alertas.vencidos.length > 0) && (
                <div className="mt-6 text-center">
                  <button 
                    className="btn-primary inline-flex items-center gap-2"
                    onClick={() => navigate('/lista-prestamos')}
                  >
                    📋 Gestionar Todas las Alertas
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TARJETAS DE ESTADÍSTICAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200 hover:shadow-medium transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-primary cursor-pointer">
              <div className="text-3xl mb-4 opacity-80">📊</div>
              <div>
                <h3 className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Total de Préstamos</h3>
                <p className="text-3xl font-bold text-gray-800 leading-tight">{stats.totalPrestamos}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200 hover:shadow-medium transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-success cursor-pointer">
              <div className="text-3xl mb-4 opacity-80">✅</div>
              <div>
                <h3 className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Préstamos Activos</h3>
                <p className="text-3xl font-bold text-gray-800 leading-tight">{stats.prestamosActivos}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200 hover:shadow-medium transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-warning cursor-pointer">
              <div className="text-3xl mb-4 opacity-80">⏳</div>
              <div>
                <h3 className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Completados</h3>
                <p className="text-3xl font-bold text-gray-800 leading-tight">{stats.prestamosCompletados}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200 hover:shadow-medium transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-blue-500 cursor-pointer">
              <div className="text-3xl mb-4 opacity-80">💰</div>
              <div>
                <h3 className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Deuda Total</h3>
                <p className="text-3xl font-bold text-gray-800 leading-tight">S/. {stats.totalDeuda}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200 hover:shadow-medium transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-gray-600 cursor-pointer">
              <div className="text-3xl mb-4 opacity-80">📈</div>
              <div>
                <h3 className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Total Desembolsado</h3>
                <p className="text-3xl font-bold text-gray-800 leading-tight">S/. {stats.totalDesembolsado}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200 hover:shadow-medium transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-danger cursor-pointer">
              <div className="text-3xl mb-4 opacity-80">💵</div>
              <div>
                <h3 className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Pagos Realizados</h3>
                <p className="text-3xl font-bold text-gray-800 leading-tight">S/. {stats.pagosRealizados}</p>
              </div>
            </div>
          </div>

          {/* ACCIONES RÁPIDAS */}
          <div className="mb-10">
            <h2 className="text-2xl text-gray-800 mb-5 font-semibold relative pb-3">
              Acciones Rápidas
              <div className="absolute bottom-0 left-0 w-12 h-1 bg-gradient-to-r from-primary to-blue-500 rounded-full"></div>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              <button 
                className="bg-white p-6 rounded-xl shadow-soft border border-gray-200 hover:shadow-medium transition-all duration-300 hover:-translate-y-1 flex flex-col items-center justify-center text-center min-h-[120px] group"
                onClick={() => navigate('/registrar-prestamo')}
              >
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">➕</span>
                <span className="font-semibold text-gray-700">Nuevo Préstamo</span>
              </button>
              
              <button 
                className="bg-white p-6 rounded-xl shadow-soft border border-gray-200 hover:shadow-medium transition-all duration-300 hover:-translate-y-1 flex flex-col items-center justify-center text-center min-h-[120px] group"
                onClick={() => navigate('/lista-prestamos')}
              >
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">📋</span>
                <span className="font-semibold text-gray-700">Ver Préstamos</span>
              </button>
              
              <button 
                className="bg-white p-6 rounded-xl shadow-soft border border-gray-200 hover:shadow-medium transition-all duration-300 hover:-translate-y-1 flex flex-col items-center justify-center text-center min-h-[120px] group"
                onClick={() => navigate('/prestatarios')}
              >
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">👥</span>
                <span className="font-semibold text-gray-700">Prestatarios</span>
              </button>
              
              <button 
                className="bg-white p-6 rounded-xl shadow-soft border border-gray-200 hover:shadow-medium transition-all duration-300 hover:-translate-y-1 flex flex-col items-center justify-center text-center min-h-[120px] group"
                onClick={() => navigate('/gestion-prestamos')}
              >
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">📊</span>
                <span className="font-semibold text-gray-700">Gestión</span>
              </button>
              
              <button 
                className="bg-white p-6 rounded-xl shadow-soft border border-gray-200 hover:shadow-medium transition-all duration-300 hover:-translate-y-1 flex flex-col items-center justify-center text-center min-h-[120px] group"
                onClick={() => navigate('/archivados')}
              >
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">📦</span>
                <span className="font-semibold text-gray-700">Archivados</span>
              </button>
            </div>
          </div>

          {/* RESUMEN FINANCIERO */}
          <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
            <h2 className="text-2xl text-gray-800 mb-5 font-semibold relative pb-3">
              Resumen Financiero
              <div className="absolute bottom-0 left-0 w-12 h-1 bg-gradient-to-r from-primary to-blue-500 rounded-full"></div>
            </h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <span className="block text-sm text-gray-600 font-medium mb-2">Tasa de Recaudación</span>
                  <span className="text-2xl font-bold text-gray-800">
                    {stats.totalDesembolsado > 0 ? 
                      ((stats.pagosRealizados / stats.totalDesembolsado) * 100).toFixed(2) : 0}%
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-sm text-gray-600 font-medium mb-2">Préstamos Vigentes</span>
                  <span className="text-2xl font-bold text-gray-800">
                    {stats.prestamosActivos} / {stats.totalPrestamos}
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-sm text-gray-600 font-medium mb-2">Deuda Pendiente</span>
                  <span className="text-2xl font-bold text-gray-800">S/. {stats.totalDeuda}</span>
                </div>
                <div className="text-center">
                  <span className="block text-sm text-gray-600 font-medium mb-2">Alertas Activas</span>
                  <span 
                    className="text-2xl font-bold"
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
