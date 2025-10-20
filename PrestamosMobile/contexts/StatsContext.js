import React, { createContext, useContext, useState, useEffect } from 'react';
import mobileApi from '../services/mobileApi';

const StatsContext = createContext();

export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats debe ser usado dentro de StatsProvider');
  }
  return context;
};

export const StatsProvider = ({ children }) => {
  const [stats, setStats] = useState({
    pagosHoy: 0,
    prestatariosActivos: 0,
    montoTotalHoy: 0
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      console.log('🔄 [STATS] Cargando estadísticas...');
      setLoading(true);
      
      // Obtener pagos de hoy
      const pagosData = await mobileApi.makeRequest('api_postgres.php?action=pagos-historial');
      
      const hoy = new Date().toISOString().split('T')[0];
      
      let pagosHoy = 0;
      let montoTotalHoy = 0;
      
      if (Array.isArray(pagosData)) {
        const pagosDeHoy = pagosData.filter(pago => {
          const fechaPago = new Date(pago.fecha).toISOString().split('T')[0];
          return fechaPago === hoy;
        });
        
        pagosHoy = pagosDeHoy.length;
        montoTotalHoy = pagosDeHoy.reduce((sum, pago) => sum + parseFloat(pago.monto || 0), 0);
      }

      // Obtener préstamos activos para contar prestatarios
      const prestamosData = await mobileApi.getPrestamos();
      
      let prestatariosActivos = 0;
      
      if (Array.isArray(prestamosData)) {
        const prestamosActivos = prestamosData.filter(prestamo => 
          parseFloat(prestamo.saldo_pendiente) > 0
        );
        
        const prestatariosUnicos = new Set(prestamosActivos.map(p => p.id_prestatario));
        prestatariosActivos = prestatariosUnicos.size;
      }

      const finalStats = {
        pagosHoy,
        prestatariosActivos,
        montoTotalHoy
      };
      
      console.log('✅ [STATS] Estadísticas actualizadas:', finalStats);
      setStats(finalStats);
    } catch (error) {
      console.error('💥 [STATS] Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar estadísticas después de un pago
  const updateStatsAfterPayment = (montoNuevoPago) => {
    console.log('💰 [STATS] Actualizando estadísticas después del pago:', montoNuevoPago);
    setStats(prevStats => ({
      ...prevStats,
      pagosHoy: prevStats.pagosHoy + 1,
      montoTotalHoy: prevStats.montoTotalHoy + parseFloat(montoNuevoPago)
    }));
  };

  // Función para refrescar estadísticas manualmente
  const refreshStats = () => {
    loadStats();
  };

  useEffect(() => {
    loadStats();
  }, []);

  const value = {
    stats,
    loading,
    updateStatsAfterPayment,
    refreshStats,
    loadStats
  };

  return (
    <StatsContext.Provider value={value}>
      {children}
    </StatsContext.Provider>
  );
};