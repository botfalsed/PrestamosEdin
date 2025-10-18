// components/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock } from 'react-icons/fa'; 
import '../assets/css/login.css';

const Login = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({ 
    usuario: '', 
    password: '' 
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setCredentials({ 
      ...credentials, 
      [e.target.name]: e.target.value 
    });
    if (message) setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.usuario.trim() || !credentials.password.trim()) {
      setMessage('Por favor, completa todos los campos');
      return;
    }

    // DEBUG: Input Data Check
    console.log('Intento de Login con Usuario:', credentials.usuario);
    console.log('Intento de Login con Password:', credentials.password);
    console.log('Datos completos enviados:', credentials);

    setLoading(true);
    setMessage('');

    try {
      // DEBUG: Service Call Check
      console.log('Llamando servicio de autenticación...');
      console.log('URL del servicio:', 'http://192.168.18.22:8080/api_postgres.php?action=login');
      
      const response = await axios.post(
        'http://192.168.18.22:8080/api_postgres.php?action=login', 
        credentials
      );
      
      // DEBUG: Response Check
      console.log('Respuesta completa del servidor:', response);
      console.log('Datos de respuesta:', response.data);
      
      if (response.data.success) {
        // Guardar en localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({
          usuario: credentials.usuario,
          timestamp: new Date().toISOString()
        }));
        if (response.data.token) {
          localStorage.setItem('auth_token', response.data.token);
        }

        // Notificar al contenedor que el login fue exitoso
        if (onLoginSuccess) onLoginSuccess();

        // Navegar a inicio
        navigate('/inicio', { replace: true });
      } else {
        setMessage('Usuario o contraseña incorrectos'); 
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setMessage('Error de conexión. Verifica el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Lado izquierdo con imagen (COLUMNA MORADA) */}
      <div className="login-left">
        <div className="login-content">
          <h1>Sistema de Préstamos</h1>
          <p>Gestión profesional de préstamos financieros</p>
          
          <div className="features-list">
             <div className="feature-item">Visualiza tus métricas clave.</div>
             <div className="feature-item">Recibe alertas de vencimiento.</div>
             <div className="feature-item">Gestión simplificada.</div>
          </div>
        </div>
      </div>

      {/* Lado derecho con formulario (COLUMNA BLANCA) */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">LP</div> 
            <h2>Iniciar Sesión</h2>
            <p>Ingresa a tu cuenta</p>
          </div>

          {message && (
            <div className={`login-message ${message.includes('Error') || message.includes('incorrectos') ? 'error' : ''}`}>
              {message}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>
                <FaUser /> Usuario
              </label>
              <input
                type="text"
                name="usuario"
                value={credentials.usuario}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Ingresa tu usuario"
              />
            </div>

            <div className="form-group">
              <label>
                <FaLock /> Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Ingresa tu contraseña"
              />
            </div>

            <div className="login-options">
                <label htmlFor="remember-me">
                    <input type="checkbox" id="remember-me" name="remember-me"/>
                    Recordarme
                </label>
                <button 
                  type="button" 
                  className="link-button" 
                  onClick={() => setMessage('Contacta al administrador para recuperar tu acceso')}
                >
                  ¿Olvidaste tu contraseña?
                </button>
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="login-footer">
            <p>© 2024 Sistema de Préstamos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
