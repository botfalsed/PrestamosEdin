import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/css/Configuracion.css';

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
      const response = await axios.post('http://192.168.18.22:8080/api_postgres.php?action=actualizar-admin', {
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
      const response = await axios.post('http://192.168.18.22:8080/api_postgres.php?action=crear-admin', {
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
    <div className="configuracion-container">
      <h2>⚙️ Configuración del Sistema</h2>

      {mensaje && (
        <div className={`mensaje ${tipoMensaje}`}>
          {mensaje}
        </div>
      )}

      {/* SECCIÓN: ACTUALIZAR ADMIN ACTUAL */}
      <div className="config-section">
        <h3>👤 Actualizar Mis Credenciales</h3>
        <form onSubmit={actualizarAdminActual} className="admin-form">
          <div className="form-group">
            <label>Usuario Actual:</label>
            <input
              type="text"
              value={adminActual.usuario}
              onChange={(e) => setAdminActual({ ...adminActual, usuario: e.target.value })}
              placeholder="Nombre de usuario"
              required
            />
          </div>
          <div className="form-group">
            <label>Nueva Contraseña:</label>
            <input
              type="password"
              value={adminActual.password}
              onChange={(e) => setAdminActual({ ...adminActual, password: e.target.value })}
              placeholder="Nueva contraseña"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Actualizando...' : 'Actualizar Credenciales'}
          </button>
        </form>
      </div>

      {/* SECCIÓN: CREAR NUEVO ADMIN */}
      <div className="config-section">
        <h3>➕ Crear Nuevo Administrador</h3>
        <form onSubmit={crearNuevoAdmin} className="admin-form">
          <div className="form-group">
            <label>Usuario:</label>
            <input
              type="text"
              value={nuevoAdmin.usuario}
              onChange={(e) => setNuevoAdmin({ ...nuevoAdmin, usuario: e.target.value })}
              placeholder="Nombre de usuario"
              required
            />
          </div>
          <div className="form-group">
            <label>Contraseña:</label>
            <input
              type="password"
              value={nuevoAdmin.contraseña}
              onChange={(e) => setNuevoAdmin({ ...nuevoAdmin, contraseña: e.target.value })}
              placeholder="Contraseña"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-success">
            {loading ? 'Creando...' : 'Crear Administrador'}
          </button>
        </form>
      </div>

      {/* SECCIÓN: INFORMACIÓN DEL SISTEMA */}
      <div className="config-section">
        <h3>ℹ️ Información del Sistema</h3>
        <div className="info-sistema">
          <p><strong>Base de Datos:</strong> PostgreSQL</p>
          <p><strong>Tabla de Admins:</strong> admin (id_admin, usuario, contraseña)</p>
          <p><strong>Contraseñas:</strong> Almacenadas en texto plano</p>
          <p><strong>Usuarios registrados:</strong> 1 administrador principal</p>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;
