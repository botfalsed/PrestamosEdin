import React, { useState, useEffect } from 'react';
import { useRealtimeUpdates } from './useRealtimeUpdates';

export const ComponenteSincronizacion = () => {
  const {
    sincronizando,
    ultimaSincronizacion,
    cambiosRecibidos,
    error,
    estadisticas,
    sincronizar,
    obtenerPrestamos,
    procesarCambios
  } = useRealtimeUpdates();

  const [prestamos, setPrestamos] = useState([]);
  const [ultimosCambios, setUltimosCambios] = useState([]);

  // Cargar prestamos inicialmente
  useEffect(() => {
    cargarPrestamos();
  }, [obtenerPrestamos]);

  // Procesar cambios recibidos
  useEffect(() => {
    if (cambiosRecibidos.length > 0) {
      const cambiosProcesados = procesarCambios(cambiosRecibidos);
      
      // Mostrar últimos cambios
      setUltimosCambios(cambiosRecibidos.slice(-5));

      // Si hay cambios en prestamos o pagos, recargar
      if (cambiosProcesados.prestamos || cambiosProcesados.pagos) {
        cargarPrestamos();
      }
    }
  }, [cambiosRecibidos, procesarCambios]);

  const cargarPrestamos = async () => {
    const datos = await obtenerPrestamos();
    setPrestamos(datos);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES');
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      {/* HEADER CON ESTADO */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Estado</p>
          <p className="text-lg font-bold text-blue-600">
            {sincronizando ? '⟳ Sincronizando...' : '✓ Actualizado'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Última Sincronización</p>
          <p className="text-sm font-mono text-gray-700">
            {ultimaSincronizacion ? formatearFecha(ultimaSincronizacion) : 'Nunca'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Cambios Pendientes</p>
          <p className="text-lg font-bold text-orange-600">
            {estadisticas.cambios_pendientes || 0}
          </p>
        </div>

        <button
          onClick={sincronizar}
          disabled={sincronizando}
          className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {sincronizando ? 'Sincronizando...' : 'Sincronizar Ahora'}
        </button>
      </div>

      {/* ERRORES */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          ⚠️ Error: {error}
        </div>
      )}

      {/* ÚLTIMOS CAMBIOS */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold text-lg mb-3">Últimos Cambios Sincronizados</h3>
        {ultimosCambios.length > 0 ? (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {ultimosCambios.map((cambio, idx) => (
              <div key={idx} className="text-sm p-2 bg-gray-100 rounded">
                <span className="font-mono text-xs bg-gray-300 px-2 py-1 rounded">
                  {cambio.tabla.toUpperCase()}
                </span>
                {' '}
                <span className="font-semibold">{cambio.tipo_accion}</span>
                {' '}
                <span className="text-gray-600">
                  ID: {cambio.id_registro}
                </span>
                {' '}
                <span className="text-gray-500 text-xs">
                  {formatearFecha(cambio.timestamp)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No hay cambios recientes</p>
        )}
      </div>

      {/* LISTA DE PRESTAMOS ACTUALIZADA */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold text-lg mb-3">Préstamos Activos ({prestamos.length})</h3>
        
        {prestamos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Cliente</th>
                  <th className="text-left p-2">Monto Inicial</th>
                  <th className="text-left p-2">Saldo</th>
                  <th className="text-left p-2">Estado</th>
                  <th className="text-left p-2">Inicio</th>
                </tr>
              </thead>
              <tbody>
                {prestamos.map((prestamo) => (
                  <tr key={prestamo.id_prestamo} className="border-t hover:bg-gray-50">
                    <td className="p-2 font-bold">{prestamo.id_prestamo}</td>
                    <td className="p-2">{prestamo.nombre}</td>
                    <td className="p-2">${prestamo.monto_inicial}</td>
                    <td className="p-2 font-semibold text-blue-600">
                      ${prestamo.saldo_pendiente}
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        prestamo.estado === 'activo' 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {prestamo.estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-2 text-gray-600">
                      {formatearFecha(prestamo.fecha_inicio)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No hay préstamos activos</p>
        )}
      </div>
    </div>
  );
};