import React from 'react';

// Componente de Progress Bar horizontal
export const ProgressBar = ({ pagado, total, porcentaje, color = '#28a745', height = 12 }) => {
  const porcentajeReal = porcentaje || (total > 0 ? (pagado / total) * 100 : 0);
  
  return (
    <div className="w-full my-2">
      <div 
        className="bg-gray-200 rounded-lg overflow-hidden relative"
        style={{ height: `${height}px` }}
      >
        <div 
          className="h-full rounded-lg transition-all duration-500 ease-in-out bg-gradient-to-r from-green-500 to-green-400"
          style={{ 
            width: `${porcentajeReal}%`,
            backgroundColor: color
          }}
        />
      </div>
      <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
        <span className="font-semibold">
          {porcentajeReal.toFixed(1)}% Completado
        </span>
        <span className="text-xs">
          {formatearMoneda(pagado)} de {formatearMoneda(total)}
        </span>
      </div>
    </div>
  );
};

// Componente de Progress Circular
export const CircularProgress = ({ porcentaje, size = 80, pagado, total, color = '#28a745' }) => {
  const porcentajeReal = porcentaje || (total > 0 ? (pagado / total) * 100 : 0);
  const radio = size / 2 - 5;
  const circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia - (porcentajeReal / 100) * circunferencia;

  return (
    <div className="relative inline-block m-2" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radio}
          stroke="#e9ecef"
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radio}
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <span className="text-base font-bold text-gray-800">{porcentajeReal.toFixed(0)}%</span>
      </div>
      <div className="mt-2 text-xs text-center text-gray-500">
        <div className="mb-1">Pagado: {formatearMoneda(pagado)}</div>
        <div>Total: {formatearMoneda(total)}</div>
      </div>
    </div>
  );
};

// Componente de Timeline de Pagos
export const TimelinePagos = ({ pagos = [], proximoPago }) => {
  const pagosOrdenados = [...pagos].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  
  return (
    <div className="my-5">
      <h4 className="mb-4 text-gray-800 text-base font-medium">📅 Historial de Pagos</h4>
      <div className="relative pl-5">
        {/* Línea vertical del timeline */}
        <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        {pagosOrdenados.map((pago, index) => (
          <div key={index} className="flex items-start mb-5 relative">
            <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center mr-4 z-10 text-xs">
              ✅
            </div>
            <div className="flex-1 bg-gray-50 p-3 rounded-lg border-l-4 border-green-500">
              <div className="font-semibold text-gray-800 text-sm">{formatearFecha(pago.fecha)}</div>
              <div className="text-base font-bold text-green-500 my-1">{formatearMoneda(pago.monto)}</div>
              <div className="text-xs text-gray-500">Saldo: {formatearMoneda(pago.saldo_restante)}</div>
            </div>
          </div>
        ))}
        
        {proximoPago && (
          <div className="flex items-start mb-5 relative">
            <div className="w-5 h-5 rounded-full bg-yellow-500 text-white flex items-center justify-center mr-4 z-10 text-xs">
              ⏳
            </div>
            <div className="flex-1 bg-gray-50 p-3 rounded-lg border-l-4 border-yellow-500">
              <div className="font-semibold text-gray-800 text-sm">{formatearFecha(proximoPago.fecha)}</div>
              <div className="text-base font-bold text-yellow-500 my-1">{formatearMoneda(proximoPago.monto)}</div>
              <div className="text-xs text-gray-500">Próximo pago</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente Mini Progress para tablas
export const MiniProgress = ({ pagado, total, height = 6 }) => {
  const porcentaje = total > 0 ? (pagado / total) * 100 : 0;
  const getColorClasses = () => {
    if (porcentaje >= 80) return 'bg-green-500';
    if (porcentaje >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <div 
        className="flex-1 bg-gray-200 rounded-lg overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <div 
          className={`h-full rounded-lg transition-all duration-300 ${getColorClasses()}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-800 min-w-[25px] text-right">
        {porcentaje.toFixed(0)}%
      </span>
    </div>
  );
};

// Funciones auxiliares
const formatearMoneda = (monto) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(monto || 0);
};

const formatearFecha = (fecha) => {
  if (!fecha) return 'N/A';
  return new Date(fecha).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export default {
  ProgressBar,
  CircularProgress,
  TimelinePagos,
  MiniProgress
};
