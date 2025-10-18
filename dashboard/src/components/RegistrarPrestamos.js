import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/css/RegistrarPrestamo.css';

const RegistrarPrestamo = () => {
  const [prestatarios, setPrestatarios] = useState([]);
  const [formData, setFormData] = useState({
    id_prestatario: '',
    monto_inicial: '',
    tasa_interes: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    tipo_periodo: 'dias',
    cantidad_periodo: '',
  });
  const [fechaPrimerPago, setFechaPrimerPago] = useState('');
  const [fechaUltimoPago, setFechaUltimoPago] = useState('');
  const [cuotas, setCuotas] = useState({
    diario: 0,
    semanal: 0,
    mensual: 0,
    mostrar: false,
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Cargar prestatarios al iniciar
  useEffect(() => {
    cargarPrestatarios();
  }, []);

  // ✨ ESTE ES EL USEEFFECT QUE FALTABA - RECALCULA AUTOMÁTICAMENTE
  useEffect(() => {
    // Solo calcular si hay cantidad
    if (formData.cantidad_periodo) {
      calcularFechaVencimiento(formData.tipo_periodo, formData.cantidad_periodo);
    }
    
    // Solo calcular cuotas si hay monto, interés y cantidad
    if (formData.monto_inicial && formData.tasa_interes && formData.cantidad_periodo) {
      calcularCuotas(
        formData.monto_inicial,
        formData.tasa_interes,
        formData.tipo_periodo,
        formData.cantidad_periodo
      );
    }
  }, [formData.monto_inicial, formData.tasa_interes, formData.tipo_periodo, formData.cantidad_periodo]);

  const cargarPrestatarios = () => {
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
      });
  };

  const calcularFechaVencimiento = (tipo, cantidad) => {
    const hoy = new Date();
    let primerPago = new Date(hoy);
    let ultimoPago = new Date(hoy);

    if (tipo === 'dias') {
      // Primer pago: mañana
      primerPago.setDate(primerPago.getDate() + 1);

      // Último pago: hoy + cantidad de días (sin contar domingos)
      let diasContados = 0;
      const diasRequeridos = parseInt(cantidad) || 0;

      while (diasContados < diasRequeridos) {
        ultimoPago.setDate(ultimoPago.getDate() + 1);
        const diaSem = ultimoPago.getDay();
        if (diaSem !== 0) {
          diasContados++;
        }
      }
    } else if (tipo === 'semanal') {
      // Primer pago: en 7 días exactos
      primerPago.setDate(primerPago.getDate() + 7);

      // Último pago: sumar todas las semanas (7 días por semana)
      const semanas = parseInt(cantidad) || 0;
      ultimoPago.setDate(ultimoPago.getDate() + (semanas * 7));
    } else if (tipo === 'meses') {
      // Primer pago: en 30 días (1 mes aproximado)
      primerPago.setDate(primerPago.getDate() + 30);

      // Último pago: sumar meses exactos
      const meses = parseInt(cantidad) || 0;
      ultimoPago.setMonth(ultimoPago.getMonth() + meses);
    }

    setFechaPrimerPago(primerPago.toISOString().split('T')[0]);
    setFechaUltimoPago(ultimoPago.toISOString().split('T')[0]);
  };

  const calcularCuotas = (monto, interes, tipo, cantidad) => {
    if (!monto || !interes) {
      setCuotas({ diario: 0, semanal: 0, mensual: 0, mostrar: false });
      return;
    }

    const montoNum = parseFloat(monto);
    const interesNum = parseFloat(interes);

    if (isNaN(montoNum) || isNaN(interesNum)) {
      setCuotas({ diario: 0, semanal: 0, mensual: 0, mostrar: false });
      return;
    }

    // Calcular monto total (capital + interés)
    const montoTotal = montoNum + (montoNum * interesNum / 100);
    const cantidadNum = parseInt(cantidad) || 0;

    if (cantidadNum === 0) {
      setCuotas({ diario: 0, semanal: 0, mensual: 0, mostrar: false });
      return;
    }

    // Dividir monto total entre el NÚMERO DE CUOTAS
    let cuotaCalculada = 0;
    
    if (tipo === 'dias') {
      // Si paga DIARIO: dividir entre la cantidad de días
      cuotaCalculada = montoTotal / cantidadNum;
    } else if (tipo === 'semanal') {
      // Si paga SEMANAL: dividir entre la cantidad de semanas
      cuotaCalculada = montoTotal / cantidadNum;
    } else if (tipo === 'meses') {
      // Si paga MENSUAL: dividir entre la cantidad de meses
      cuotaCalculada = montoTotal / cantidadNum;
    }

    setCuotas({
      diario: tipo === 'dias' ? parseFloat(cuotaCalculada.toFixed(2)) : 0,
      semanal: tipo === 'semanal' ? parseFloat(cuotaCalculada.toFixed(2)) : 0,
      mensual: tipo === 'meses' ? parseFloat(cuotaCalculada.toFixed(2)) : 0,
      mostrar: true,
      tipo: tipo,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleMontoInteresChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    // NO NECESITAS LLAMAR calcularCuotas aquí, el useEffect lo hace automáticamente
  };

  const handlePeriodoChange = (e) => {
    const { name, value } = e.target;
    const nuevoFormData = { ...formData, [name]: value };
    setFormData(nuevoFormData);
    
    // FORZAR recálculo inmediato para evitar el bug de tipeo rápido
    if (name === 'cantidad_periodo' && value) {
      setTimeout(() => {
        if (nuevoFormData.monto_inicial && nuevoFormData.tasa_interes) {
          calcularCuotas(
            nuevoFormData.monto_inicial,
            nuevoFormData.tasa_interes,
            nuevoFormData.tipo_periodo,
            value
          );
        }
        calcularFechaVencimiento(nuevoFormData.tipo_periodo, value);
      }, 300); // Esperar 300ms para que termine de escribir
    }
  };

  const validarFormulario = () => {
    const newErrors = {};

    if (!formData.id_prestatario) {
      newErrors.id_prestatario = 'Selecciona un prestatario';
    }
    if (!formData.monto_inicial) {
      newErrors.monto_inicial = 'El monto es requerido';
    } else if (parseFloat(formData.monto_inicial) <= 0) {
      newErrors.monto_inicial = 'El monto debe ser mayor a 0';
    }
    if (!formData.tasa_interes) {
      newErrors.tasa_interes = 'La tasa de interés es requerida';
    } else if (parseFloat(formData.tasa_interes) < 0) {
      newErrors.tasa_interes = 'La tasa no puede ser negativa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      setMessage('Por favor completa todos los campos correctamente');
      setMessageType('error');
      return;
    }

    setLoading(true);

    // Preparar datos completos con todas las fechas
    const datosCompletos = {
      id_prestatario: parseInt(formData.id_prestatario),
      monto_inicial: parseFloat(formData.monto_inicial),
      tasa_interes: parseFloat(formData.tasa_interes),
      fecha_inicio: formData.fecha_inicio,
      tipo_periodo: formData.tipo_periodo,
      cantidad_periodo: parseInt(formData.cantidad_periodo),
      fecha_primer_pago: fechaPrimerPago,
      fecha_ultimo_pago: fechaUltimoPago,
    };

    axios.post('http://192.168.18.22:8080/api_postgres.php?action=prestamos', datosCompletos)
      .then(response => {
        if (response.data.success) {
          setMessage('Préstamo registrado exitosamente');
          setMessageType('success');
          setFormData({
            id_prestatario: '',
            monto_inicial: '',
            tasa_interes: '',
            fecha_inicio: new Date().toISOString().split('T')[0],
            tipo_periodo: 'dias',
            cantidad_periodo: '',
          });
          setCuotas({ diario: 0, semanal: 0, mensual: 0, mostrar: false });
          setFechaPrimerPago('');
          setFechaUltimoPago('');
          setTimeout(() => setMessage(''), 4000);
        } else {
          setMessage('Error: ' + (response.data.error || 'No se pudo registrar'));
          setMessageType('error');
        }
      })
      .catch(error => {
        console.error('Error registrando préstamo:', error);
        setMessage('Error de servidor al registrar el préstamo');
        setMessageType('error');
      })
      .finally(() => setLoading(false));
  };

  const limpiarFormulario = () => {
    setFormData({
      id_prestatario: '',
      monto_inicial: '',
      tasa_interes: '',
      fecha_inicio: new Date().toISOString().split('T')[0],
      tipo_periodo: 'dias',
      cantidad_periodo: '',
    });
    setErrors({});
    setCuotas({ diario: 0, semanal: 0, mensual: 0, mostrar: false });
    setFechaPrimerPago('');
    setFechaUltimoPago('');
  };

  return (
    <div className="registrar-container">
      <div className="registrar-form-wrapper">
        <div className="registrar-header">
          <h1>Registrar Nuevo Préstamo</h1>
          <p className="registrar-subtitle">Completa el formulario para registrar un nuevo préstamo</p>
        </div>

        {message && (
          <div className={`alert alert-${messageType}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="registrar-form">
          <div className="form-section">
            <h3>Información del Prestatario</h3>

            <div className="form-group">
              <label>Prestatario *</label>
              <select
                name="id_prestatario"
                value={formData.id_prestatario}
                onChange={handleInputChange}
                className={errors.id_prestatario ? 'input-error' : ''}
              >
                <option value="">-- Selecciona un prestatario --</option>
                {prestatarios.map(prestatario => (
                  <option key={prestatario.id_prestatario} value={prestatario.id_prestatario}>
                    {prestatario.nombre} - {prestatario.telefono}
                  </option>
                ))}
              </select>
              {errors.id_prestatario && <span className="error-text">{errors.id_prestatario}</span>}
            </div>
          </div>

          <div className="form-section">
            <h3>Monto e Interés</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Monto Inicial (S/.) *</label>
                <input
                  type="number"
                  name="monto_inicial"
                  value={formData.monto_inicial}
                  onChange={handleMontoInteresChange}
                  step="0.01"
                  min="0"
                  placeholder="Ej. 1000.00"
                  className={errors.monto_inicial ? 'input-error' : ''}
                />
                {errors.monto_inicial && <span className="error-text">{errors.monto_inicial}</span>}
              </div>

              <div className="form-group">
                <label>Tasa de Interés (%) *</label>
                <input
                  type="number"
                  name="tasa_interes"
                  value={formData.tasa_interes}
                  onChange={handleMontoInteresChange}
                  step="0.01"
                  min="0"
                  placeholder="Ej. 5.00"
                  className={errors.tasa_interes ? 'input-error' : ''}
                />
                {errors.tasa_interes && <span className="error-text">{errors.tasa_interes}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Período del Préstamo</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Tipo de Período *</label>
                <select
                  name="tipo_periodo"
                  value={formData.tipo_periodo}
                  onChange={handlePeriodoChange}
                >
                  <option value="dias">Días</option>
                  <option value="semanal">Semanas</option>
                  <option value="meses">Meses</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  {formData.tipo_periodo === 'dias'
                    ? 'Cantidad de Días *'
                    : formData.tipo_periodo === 'semanal'
                    ? 'Cantidad de Semanas *'
                    : 'Cantidad de Meses (Máx. 3) *'}
                </label>
                <input
                  type="number"
                  name="cantidad_periodo"
                  value={formData.cantidad_periodo}
                  onChange={handlePeriodoChange}
                  min="1"
                  max={formData.tipo_periodo === 'dias' ? '365' : formData.tipo_periodo === 'semanal' ? '52' : '3'}
                  step="1"
                  placeholder={formData.tipo_periodo === 'dias' ? 'Ej. 30' : formData.tipo_periodo === 'semanal' ? 'Ej. 4' : 'Ej. 2'}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Fecha de Préstamo</label>
                <input type="date" value={formData.fecha_inicio} disabled />
                <div className="info-badge">
                  {new Date(formData.fecha_inicio + 'T00:00:00').toLocaleDateString('es-PE', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>

              <div className="form-group">
                <label>Fecha Primer Pago</label>
                <input type="date" value={fechaPrimerPago} disabled />
                {fechaPrimerPago && (
                  <div className="info-badge">
                    {new Date(fechaPrimerPago + 'T00:00:00').toLocaleDateString('es-PE', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Fecha Último Pago</label>
                <input type="date" value={fechaUltimoPago} disabled />
                {fechaUltimoPago && (
                  <div className="info-badge">
                    {new Date(fechaUltimoPago + 'T00:00:00').toLocaleDateString('es-PE', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                )}
                {formData.tipo_periodo === 'dias' && (
                  <div className="info-badge" style={{ marginTop: '8px', background: '#fff3cd', borderColor: '#ffc107', color: '#856404' }}>
                    ⚠ Sin contar domingos
                  </div>
                )}
              </div>
            </div>
          </div>

          {formData.monto_inicial && formData.tasa_interes && cuotas.mostrar && (
            <div className="form-section">
              <h3>Resumen de Cuotas</h3>
              <div className="cuotas-grid">
                {formData.tipo_periodo === 'dias' && (
                  <div className="cuota-card">
                    <div className="cuota-label">Cuota Diaria</div>
                    <div className="cuota-valor">S/. {cuotas.diario}</div>
                    <div className="cuota-info">Durante {formData.cantidad_periodo} días (sin domingos)</div>
                  </div>
                )}
                {formData.tipo_periodo === 'semanal' && (
                  <div className="cuota-card">
                    <div className="cuota-label">Cuota Semanal</div>
                    <div className="cuota-valor">S/. {cuotas.semanal}</div>
                    <div className="cuota-info">Durante {formData.cantidad_periodo} semanas</div>
                  </div>
                )}
                {formData.tipo_periodo === 'meses' && (
                  <div className="cuota-card">
                    <div className="cuota-label">Cuota Mensual</div>
                    <div className="cuota-valor">S/. {cuotas.mensual}</div>
                    <div className="cuota-info">Durante {formData.cantidad_periodo} meses</div>
                  </div>
                )}
              </div>
              <div className="resumen-total">
                <strong>Monto Total a Pagar:</strong> S/. {(parseFloat(formData.monto_inicial) + (parseFloat(formData.monto_inicial) * parseFloat(formData.tasa_interes) / 100)).toFixed(2)}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar Préstamo'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={limpiarFormulario}
            >
              Limpiar
            </button>
          </div>

          <div className="form-info">
            <p>* Campos requeridos | Las fechas se calculan automáticamente excluyendo domingos</p>
          </div>
        </form>
      </div>

      <div className="sidebar-left">
        <div className="info-card tips">
          <h3>💡 Consejos</h3>
          <p>Verifica que el prestatario esté registrado en el sistema antes de crear un nuevo préstamo.</p>
        </div>
        <div className="info-card requirements">
          <h3>📋 Requisitos</h3>
          <p>Todos los campos son obligatorios. La tasa de interés debe ser un porcentaje válido.</p>
        </div>
      </div>
    </div>
  );
};

export default RegistrarPrestamo;
