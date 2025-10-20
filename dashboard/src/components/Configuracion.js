import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Configuracion = () => {
  const [adminActual, setAdminActual] = useState({ usuario: '', password: '' });
  const [nuevoAdmin, setNuevoAdmin] = useState({ usuario: '', password: '' });
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState(''); // success | error
  const [loading, setLoading] = useState(false);

  // Cargar datos del admin actual
  useEffect(() => {
    cargarAdminActual();
  }, []);

  const cargarAdminActual = async () => {
    try {
      // En un sistema real, obtendrías esto del contexto o localStorage
      const usuario = localStorage.getItem('usuarioActual') || 'admin';
      setAdminActual({ usuario, contraseña: '' });
    } catch (error) {
      console.error('Error cargando admin actual:', error);
    }
  };

  const actualizarAdminActual = async (e) => {
    e.preventDefault();
    if (!adminActual.usuario.trim() || !adminActual.password.trim()) {
      mostrarMensaje('Usuario y contraseña son requeridos', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8080/api_postgres.php?action=actualizar-admin', {
        usuario: adminActual.usuario,
        password: adminActual.password
      });

      if (response.data.success) {
        mostrarMensaje('Administrador actualizado exitosamente', 'success');
        setAdminActual({ ...adminActual, password: '' });
        // Actualizar en localStorage si es necesario
        localStorage.setItem('usuarioActual', adminActual.usuario);
      } else {
        mostrarMensaje(response.data.error || 'Error al actualizar', 'error');
      }
    } catch (error) {
      console.error('Error actualizando admin:', error);
      mostrarMensaje('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const crearNuevoAdmin = async (e) => {
    e.preventDefault();
    if (!nuevoAdmin.usuario.trim() || !nuevoAdmin.contraseña.trim()) {
      mostrarMensaje('Usuario y contraseña son requeridos', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8080/api_postgres.php?action=crear-admin', {
        usuario: nuevoAdmin.usuario,
        contraseña: nuevoAdmin.contraseña
      });

      if (response.data.success) {
        mostrarMensaje('Nuevo administrador creado exitosamente', 'success');
        setNuevoAdmin({ usuario: '', contraseña: '' });
      } else {
        mostrarMensaje(response.data.error || 'Error al crear admin', 'error');
      }
    } catch (error) {
      console.error('Error creando admin:', error);
      mostrarMensaje('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    setTimeout(() => setMensaje(''), 5000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">⚙️ Configuración del Sistema</h2>

      {mensaje && (
        <div className={`p-4 rounded-lg mb-6 font-medium ${
          tipoMensaje === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {mensaje}
        </div>
      )}

      {/* SECCIÓN: ACTUALIZAR ADMIN ACTUAL */}
      <div className="bg-white p-6 rounded-2xl mb-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-gray-200">
        <h3 className="text-blue-600 mb-5 text-xl font-semibold border-b-2 border-gray-200 pb-3">👤 Actualizar Mis Credenciales</h3>
        <form onSubmit={actualizarAdminActual} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700 text-sm">Usuario Actual:</label>
            <input
              type="text"
              value={adminActual.usuario}
              onChange={(e) => setAdminActual({ ...adminActual, usuario: e.target.value })}
              placeholder="Nombre de usuario"
              required
              className="py-3 px-4 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-base transition-all duration-300 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(0,123,255,0.1)]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700 text-sm">Nueva Contraseña:</label>
            <input
              type="password"
              value={adminActual.password}
              onChange={(e) => setAdminActual({ ...adminActual, password: e.target.value })}
              placeholder="Nueva contraseña"
              required
              className="py-3 px-4 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-base transition-all duration-300 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(0,123,255,0.1)]"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className={`py-3 px-6 border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 self-start ${
              loading 
                ? 'bg-gray-500 cursor-not-allowed transform-none' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5'
            }`}
          >
            {loading ? 'Actualizando...' : 'Actualizar Credenciales'}
          </button>
        </form>
      </div>

      {/* SECCIÓN: CREAR NUEVO ADMIN */}
      <div className="bg-white p-6 rounded-2xl mb-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-gray-200">
        <h3 className="text-blue-600 mb-5 text-xl font-semibold border-b-2 border-gray-200 pb-3">➕ Crear Nuevo Administrador</h3>
        <form onSubmit={crearNuevoAdmin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700 text-sm">Usuario:</label>
            <input
              type="text"
              value={nuevoAdmin.usuario}
              onChange={(e) => setNuevoAdmin({ ...nuevoAdmin, usuario: e.target.value })}
              placeholder="Nombre de usuario"
              required
              className="py-3 px-4 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-base transition-all duration-300 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(0,123,255,0.1)]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700 text-sm">Contraseña:</label>
            <input
              type="password"
              value={nuevoAdmin.contraseña}
              onChange={(e) => setNuevoAdmin({ ...nuevoAdmin, contraseña: e.target.value })}
              placeholder="Contraseña"
              required
              className="py-3 px-4 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-base transition-all duration-300 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(0,123,255,0.1)]"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className={`py-3 px-6 border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 self-start ${
              loading 
                ? 'bg-gray-500 cursor-not-allowed transform-none' 
                : 'bg-green-600 text-white hover:bg-green-700 hover:-translate-y-0.5'
            }`}
          >
            {loading ? 'Creando...' : 'Crear Administrador'}
          </button>
        </form>
      </div>

      {/* SECCIÓN: INFORMACIÓN DEL SISTEMA */}
      <div className="bg-white p-6 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-gray-200">
        <h3 className="text-blue-600 mb-5 text-xl font-semibold border-b-2 border-gray-200 pb-3">ℹ️ Información del Sistema</h3>
        <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-blue-500">
          <p className="my-2 text-sm text-gray-600"><strong>Base de Datos:</strong> PostgreSQL</p>
          <p className="my-2 text-sm text-gray-600"><strong>Tabla de Admins:</strong> admin (id_admin, usuario, contraseña)</p>
          <p className="my-2 text-sm text-gray-600"><strong>Contraseñas:</strong> Almacenadas en texto plano</p>
          <p className="my-2 text-sm text-gray-600"><strong>Usuarios registrados:</strong> 1 administrador principal</p>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;
