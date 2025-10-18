import React from 'react';
import '../assets/css/ProgressCharts.css';

// Componente de Progress Bar horizontal
export const ProgressBar = ({ pagado, total, porcentaje, color = '#28a745', height = 12 }) => {
  const porcentajeReal = porcentaje || (total > 0 ? (pagado / total) * 100 : 0);
  
  return (
    <div className="progress-bar-container">
      <div className="progress-bar" style={{ height: `${height}px` }}>
        <div 
          className="progress-fill"
          style={{ 
            width: `${porcentajeReal}%`,
            backgroundColor: color
          }}
        />
      </div>
      <div className="progress-info">
        <span className="progress-text">
          {porcentajeReal.toFixed(1)}% Completado
        </span>
        <span className="progress-numbers">
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
    <div className="circular-progress-container" style={{ width: size, height: size }}>
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
          className="progress-circle"
        />
      </svg>
      <div className="circular-progress-text">
        <span className="circular-percentage">{porcentajeReal.toFixed(0)}%</span>
      </div>
      <div className="circular-progress-details">
        <div>Pagado: {formatearMoneda(pagado)}</div>
        <div>Total: {formatearMoneda(total)}</div>
      </div>
    </div>
  );
};

// Componente de Timeline de Pagos
export const TimelinePagos = ({ pagos = [], proximoPago }) => {
  const pagosOrdenados = [...pagos].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  
  return (
    <div className="timeline-container">
      <h4>📅 Historial de Pagos</h4>
      <div className="timeline">
        {pagosOrdenados.map((pago, index) => (
          <div key={index} className="timeline-item completed">
            <div className="timeline-marker">✅</div>
            <div className="timeline-content">
              <div className="timeline-date">{formatearFecha(pago.fecha)}</div>
              <div className="timeline-amount">{formatearMoneda(pago.monto)}</div>
              <div className="timeline-saldo">Saldo: {formatearMoneda(pago.saldo_restante)}</div>
            </div>
          </div>
        ))}
        
        {proximoPago && (
          <div className="timeline-item pending">
            <div className="timeline-marker">⏳</div>
            <div className="timeline-content">
              <div className="timeline-date">{formatearFecha(proximoPago.fecha)}</div>
              <div className="timeline-amount">{formatearMoneda(proximoPago.monto)}</div>
              <div className="timeline-status">Próximo pago</div>
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
  const getColor = () => {
    if (porcentaje >= 80) return '#28a745';
    if (porcentaje >= 50) return '#ffc107';
    return '#dc3545';
  };

  return (
    <div className="mini-progress-container">
      <div className="mini-progress-bar" style={{ height: `${height}px` }}>
        <div 
          className="mini-progress-fill"
          style={{ 
            width: `${porcentaje}%`,
            backgroundColor: getColor()
          }}
        />
      </div>
      <span className="mini-progress-text">{porcentaje.toFixed(0)}%</span>
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
