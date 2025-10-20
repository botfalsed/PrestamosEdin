import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
    axios.get('http://localhost:8080/api_postgres.php?action=prestatarios')
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

    axios.post('http://localhost:8080/api_postgres.php?action=prestamos', datosCompletos)
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
    <div className="flex flex-col items-center justify-center gap-10 p-10 min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 font-sans">
      <div className="w-full max-w-4xl shadow-2xl rounded-3xl overflow-hidden mx-auto bg-white">
        <div className="text-center mb-0 p-10 bg-gradient-to-br from-blue-500 to-purple-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 opacity-10"></div>
          <h1 className="text-4xl m-0 font-extrabold tracking-tight relative text-shadow-sm">Registrar Nuevo Préstamo</h1>
          <p className="text-base text-white/90 mt-3 font-medium relative">Completa el formulario para registrar un nuevo préstamo</p>
        </div>

        {message && (
          <div className={`p-5 rounded-xl mx-8 mb-6 font-semibold animate-slide-in flex items-center gap-3 shadow-md relative overflow-hidden border-none ${
            messageType === 'error' 
              ? 'bg-gradient-to-br from-red-50 to-red-50 text-red-700 border-l-4 border-red-500' 
              : 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-l-4 border-green-500'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-12 bg-white">
          <div className="mb-12 relative after:absolute after:-bottom-6 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-slate-200 after:to-transparent">
            <h3 className="text-xl text-slate-800 m-0 mb-8 font-bold flex items-center gap-3 relative pb-3 after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-gradient-to-r after:from-blue-500 after:to-purple-600 after:rounded-sm">
              Información del Prestatario
            </h3>

            <div className="mb-8 flex flex-col relative">
              <label className="block mb-3 font-semibold text-gray-600 text-sm uppercase tracking-wide">Prestatario *</label>
              <select
                name="id_prestatario"
                value={formData.id_prestatario}
                onChange={handleInputChange}
                className={`w-full p-4 border-2 rounded-xl text-base transition-all duration-300 font-inherit bg-slate-50 text-slate-800 box-border font-medium ${
                  errors.id_prestatario 
                    ? 'border-red-500 bg-red-50 shadow-red-100' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-white hover:shadow-md focus:outline-none focus:border-blue-500 focus:shadow-blue-100 focus:bg-white focus:-translate-y-px'
                }`}
              >
                <option value="">-- Selecciona un prestatario --</option>
                {prestatarios.map(prestatario => (
                  <option key={prestatario.id_prestatario} value={prestatario.id_prestatario}>
                    {prestatario.nombre} - {prestatario.telefono}
                  </option>
                ))}
              </select>
              {errors.id_prestatario && (
                <span className="block text-red-500 text-sm mt-2 font-semibold animate-shake flex items-center gap-2">
                  {errors.id_prestatario}
                </span>
              )}
            </div>
          </div>

          <div className="mb-12 relative after:absolute after:-bottom-6 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-slate-200 after:to-transparent">
            <h3 className="text-xl text-slate-800 m-0 mb-8 font-bold flex items-center gap-3 relative pb-3 after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-gradient-to-r after:from-blue-500 after:to-purple-600 after:rounded-sm">
              Monto e Interés
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="mb-8 flex flex-col relative">
                <label className="block mb-3 font-semibold text-gray-600 text-sm uppercase tracking-wide">Monto Inicial (S/.) *</label>
                <input
                  type="number"
                  name="monto_inicial"
                  value={formData.monto_inicial}
                  onChange={handleMontoInteresChange}
                  step="0.01"
                  min="0"
                  placeholder="Ej. 1000.00"
                  className={`w-full p-4 border-2 rounded-xl text-base transition-all duration-300 font-inherit bg-slate-50 text-slate-800 box-border font-medium placeholder:text-slate-400 placeholder:font-normal ${
                    errors.monto_inicial 
                      ? 'border-red-500 bg-red-50 shadow-red-100' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-white hover:shadow-md focus:outline-none focus:border-blue-500 focus:shadow-blue-100 focus:bg-white focus:-translate-y-px'
                  }`}
                />
                {errors.monto_inicial && (
                  <span className="block text-red-500 text-sm mt-2 font-semibold animate-shake flex items-center gap-2">
                    {errors.monto_inicial}
                  </span>
                )}
              </div>

              <div className="mb-8 flex flex-col relative">
                <label className="block mb-3 font-semibold text-gray-600 text-sm uppercase tracking-wide">Tasa de Interés (%) *</label>
                <input
                  type="number"
                  name="tasa_interes"
                  value={formData.tasa_interes}
                  onChange={handleMontoInteresChange}
                  step="0.01"
                  min="0"
                  placeholder="Ej. 5.00"
                  className={`w-full p-4 border-2 rounded-xl text-base transition-all duration-300 font-inherit bg-slate-50 text-slate-800 box-border font-medium placeholder:text-slate-400 placeholder:font-normal ${
                    errors.tasa_interes 
                      ? 'border-red-500 bg-red-50 shadow-red-100' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-white hover:shadow-md focus:outline-none focus:border-blue-500 focus:shadow-blue-100 focus:bg-white focus:-translate-y-px'
                  }`}
                />
                {errors.tasa_interes && (
                  <span className="block text-red-500 text-sm mt-2 font-semibold animate-shake flex items-center gap-2">
                    {errors.tasa_interes}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mb-12 relative after:absolute after:-bottom-6 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-slate-200 after:to-transparent">
            <h3 className="text-xl text-slate-800 m-0 mb-8 font-bold flex items-center gap-3 relative pb-3 after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-gradient-to-r after:from-blue-500 after:to-purple-600 after:rounded-sm">
              Período del Préstamo
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="mb-8 flex flex-col relative">
                <label className="block mb-3 font-semibold text-gray-600 text-sm uppercase tracking-wide">Tipo de Período *</label>
                <select
                  name="tipo_periodo"
                  value={formData.tipo_periodo}
                  onChange={handlePeriodoChange}
                  className="w-full p-4 border-2 border-slate-200 rounded-xl text-base transition-all duration-300 font-inherit bg-slate-50 text-slate-800 box-border font-medium hover:border-slate-300 hover:bg-white hover:shadow-md focus:outline-none focus:border-blue-500 focus:shadow-blue-100 focus:bg-white focus:-translate-y-px"
                >
                  <option value="dias">Días</option>
                  <option value="semanal">Semanas</option>
                  <option value="meses">Meses</option>
                </select>
              </div>

              <div className="mb-8 flex flex-col relative">
                <label className="block mb-3 font-semibold text-gray-600 text-sm uppercase tracking-wide">
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
                  className="w-full p-4 border-2 border-slate-200 rounded-xl text-base transition-all duration-300 font-inherit bg-slate-50 text-slate-800 box-border font-medium placeholder:text-slate-400 placeholder:font-normal hover:border-slate-300 hover:bg-white hover:shadow-md focus:outline-none focus:border-blue-500 focus:shadow-blue-100 focus:bg-white focus:-translate-y-px"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="mb-8 flex flex-col relative">
                <label className="block mb-3 font-semibold text-gray-600 text-sm uppercase tracking-wide">Fecha de Préstamo</label>
                <input 
                  type="date" 
                  value={formData.fecha_inicio} 
                  disabled 
                  className="w-full p-4 border-2 border-slate-200 rounded-xl text-base transition-all duration-300 font-inherit bg-slate-50 text-slate-800 box-border font-medium opacity-60 cursor-not-allowed"
                />
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-sky-200 rounded-xl p-4 mt-3 text-sm text-blue-700 font-semibold leading-relaxed flex items-center gap-3">
                  {new Date(formData.fecha_inicio + 'T00:00:00').toLocaleDateString('es-PE', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>

              <div className="mb-8 flex flex-col relative">
                <label className="block mb-3 font-semibold text-gray-600 text-sm uppercase tracking-wide">Fecha Primer Pago</label>
                <input 
                  type="date" 
                  value={fechaPrimerPago} 
                  disabled 
                  className="w-full p-4 border-2 border-slate-200 rounded-xl text-base transition-all duration-300 font-inherit bg-slate-50 text-slate-800 box-border font-medium opacity-60 cursor-not-allowed"
                />
                {fechaPrimerPago && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-sky-200 rounded-xl p-4 mt-3 text-sm text-blue-700 font-semibold leading-relaxed flex items-center gap-3">
                    {new Date(fechaPrimerPago + 'T00:00:00').toLocaleDateString('es-PE', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                )}
              </div>

              <div className="mb-8 flex flex-col relative">
                <label className="block mb-3 font-semibold text-gray-600 text-sm uppercase tracking-wide">Fecha Último Pago</label>
                <input 
                  type="date" 
                  value={fechaUltimoPago} 
                  disabled 
                  className="w-full p-4 border-2 border-slate-200 rounded-xl text-base transition-all duration-300 font-inherit bg-slate-50 text-slate-800 box-border font-medium opacity-60 cursor-not-allowed"
                />
                {fechaUltimoPago && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-sky-200 rounded-xl p-4 mt-3 text-sm text-blue-700 font-semibold leading-relaxed flex items-center gap-3">
                    {new Date(fechaUltimoPago + 'T00:00:00').toLocaleDateString('es-PE', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                )}
                {formData.tipo_periodo === 'dias' && (
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl p-4 mt-2 text-sm text-yellow-700 font-semibold leading-relaxed flex items-center gap-3">
                    ⚠ Sin contar domingos
                  </div>
                )}
              </div>
            </div>
          </div>

          {formData.monto_inicial && formData.tasa_interes && cuotas.mostrar && (
            <div className="mb-12 relative after:absolute after:-bottom-6 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-slate-200 after:to-transparent">
              <h3 className="text-xl text-slate-800 m-0 mb-8 font-bold flex items-center gap-3 relative pb-3 after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-gradient-to-r after:from-blue-500 after:to-purple-600 after:rounded-sm">
                Resumen de Cuotas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
                {formData.tipo_periodo === 'dias' && (
                  <div className="bg-gradient-to-br from-blue-50 to-sky-100 border-2 border-sky-500 rounded-2xl p-6 text-center transition-all duration-300 relative overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/20 hover:border-blue-600 before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-sky-500 before:to-blue-600">
                    <div className="text-sm text-blue-700 font-bold uppercase tracking-wide mb-3">Cuota Diaria</div>
                    <div className="text-3xl font-extrabold text-sky-500 text-shadow-sm">S/. {cuotas.diario}</div>
                    <div className="text-sm text-blue-600 mt-2">Durante {formData.cantidad_periodo} días (sin domingos)</div>
                  </div>
                )}
                {formData.tipo_periodo === 'semanal' && (
                  <div className="bg-gradient-to-br from-blue-50 to-sky-100 border-2 border-sky-500 rounded-2xl p-6 text-center transition-all duration-300 relative overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/20 hover:border-blue-600 before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-sky-500 before:to-blue-600">
                    <div className="text-sm text-blue-700 font-bold uppercase tracking-wide mb-3">Cuota Semanal</div>
                    <div className="text-3xl font-extrabold text-sky-500 text-shadow-sm">S/. {cuotas.semanal}</div>
                    <div className="text-sm text-blue-600 mt-2">Durante {formData.cantidad_periodo} semanas</div>
                  </div>
                )}
                {formData.tipo_periodo === 'meses' && (
                  <div className="bg-gradient-to-br from-blue-50 to-sky-100 border-2 border-sky-500 rounded-2xl p-6 text-center transition-all duration-300 relative overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/20 hover:border-blue-600 before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-sky-500 before:to-blue-600">
                    <div className="text-sm text-blue-700 font-bold uppercase tracking-wide mb-3">Cuota Mensual</div>
                    <div className="text-3xl font-extrabold text-sky-500 text-shadow-sm">S/. {cuotas.mensual}</div>
                    <div className="text-sm text-blue-600 mt-2">Durante {formData.cantidad_periodo} meses</div>
                  </div>
                )}
              </div>
              <div className="mt-6 p-4 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl text-center">
                <strong className="text-slate-700">Monto Total a Pagar:</strong> 
                <span className="text-xl font-bold text-slate-800 ml-2">
                  S/. {(parseFloat(formData.monto_inicial) + (parseFloat(formData.monto_inicial) * parseFloat(formData.tasa_interes) / 100)).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-12 pt-8 border-t-2 border-slate-200">
            <button 
              type="submit" 
              className="flex-1 p-4 border-none rounded-xl text-base font-bold cursor-pointer transition-all duration-300 uppercase tracking-wide text-center flex items-center justify-center gap-2 min-h-14 relative overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-all before:duration-500 hover:before:left-full"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrar Préstamo'}
            </button>
            <button 
              type="button" 
              className="flex-1 p-4 border-2 border-slate-300 rounded-xl text-base font-bold cursor-pointer transition-all duration-300 uppercase tracking-wide text-center flex items-center justify-center gap-2 min-h-14 relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 text-slate-600 shadow-sm hover:bg-gradient-to-br hover:from-slate-100 hover:to-slate-200 hover:border-slate-400 hover:-translate-y-0.5 hover:shadow-md before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-all before:duration-500 hover:before:left-full"
              onClick={limpiarFormulario}
            >
              Limpiar
            </button>
          </div>

          <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-sky-500 rounded-xl text-sm text-blue-700 font-semibold leading-relaxed">
            <p>* Campos requeridos | Las fechas se calculan automáticamente excluyendo domingos</p>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <div className="bg-white p-10 rounded-2xl shadow-lg transition-all duration-300 relative overflow-hidden border border-slate-100 hover:-translate-y-1 hover:shadow-2xl before:absolute before:top-0 before:left-0 before:w-2 before:h-full before:bg-gradient-to-b before:from-emerald-500 before:to-green-600">
          <h3 className="m-0 mb-5 text-xl text-slate-800 font-bold flex items-center gap-3">
            💡 Consejos
          </h3>
          <p className="m-0 text-base text-slate-600 leading-relaxed">
            Verifica que el prestatario esté registrado en el sistema antes de crear un nuevo préstamo.
          </p>
        </div>
        <div className="bg-white p-10 rounded-2xl shadow-lg transition-all duration-300 relative overflow-hidden border border-slate-100 hover:-translate-y-1 hover:shadow-2xl before:absolute before:top-0 before:left-0 before:w-2 before:h-full before:bg-gradient-to-b before:from-amber-500 before:to-orange-600">
          <h3 className="m-0 mb-5 text-xl text-slate-800 font-bold flex items-center gap-3">
            📋 Requisitos
          </h3>
          <p className="m-0 text-base text-slate-600 leading-relaxed">
            Todos los campos son obligatorios. La tasa de interés debe ser un porcentaje válido.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrarPrestamo;
