// components/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock } from 'react-icons/fa'; 

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
    
    if (!credentials.usuario || !credentials.password) {
      setMessage('Por favor, completa todos los campos');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post('http://localhost:8080/api_postgres.php?action=login', {
        usuario: credentials.usuario,
        password: credentials.password
      });

      if (response.data.success) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('usuario', credentials.usuario);
        
        setMessage('¡Inicio de sesión exitoso!');
        
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(credentials.usuario);
          }
          navigate('/inicio');
        }, 1000);
      } else {
        setMessage(response.data.message || 'Credenciales incorrectas');
      }
    } catch (error) {
      console.error('Error en login:', error);
      if (error.response) {
        setMessage(error.response.data?.message || 'Error del servidor');
      } else if (error.request) {
        setMessage('Error de conexión. Verifica que el servidor esté funcionando.');
      } else {
        setMessage('Error inesperado. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-cover bg-center bg-no-repeat fixed top-0 left-0">
      {/* Lado izquierdo con imagen (COLUMNA MORADA) */}
      <div className="flex-1 h-screen bg-gradient-to-br from-blue-500/90 via-purple-600/90 to-purple-700/90 bg-cover bg-center bg-no-repeat flex items-center justify-center p-12 text-white relative overflow-hidden border-r-0">
        <div className="text-left max-w-lg z-10">
          <h1 className="text-6xl font-bold mb-5 leading-tight">Sistema de Préstamos</h1>
          <p className="text-2xl opacity-95 leading-relaxed mb-10 font-light">Gestión profesional de préstamos financieros</p>
          
          <div className="text-left mt-8">
             <div className="flex items-center mb-5 text-2xl opacity-95 before:content-['✓'] before:bg-white/25 before:w-7 before:h-7 before:rounded-full before:flex before:items-center before:justify-center before:mr-4 before:font-bold before:flex-shrink-0">
               Visualiza tus métricas clave.
             </div>
             <div className="flex items-center mb-5 text-2xl opacity-95 before:content-['✓'] before:bg-white/25 before:w-7 before:h-7 before:rounded-full before:flex before:items-center before:justify-center before:mr-4 before:font-bold before:flex-shrink-0">
               Recibe alertas de vencimiento.
             </div>
             <div className="flex items-center mb-5 text-2xl opacity-95 before:content-['✓'] before:bg-white/25 before:w-7 before:h-7 before:rounded-full before:flex before:items-center before:justify-center before:mr-4 before:font-bold before:flex-shrink-0">
               Gestión simplificada.
             </div>
          </div>
        </div>
      </div>

      {/* Lado derecho con formulario (COLUMNA BLANCA) */}
      <div className="flex-1 h-screen flex items-center justify-center p-12 text-white relative overflow-hidden border-r-0 before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-gradient-to-br before:from-blue-500/90 before:via-purple-600/90 before:to-purple-700/90 before:bg-cover before:bg-center before:bg-no-repeat before:scale-x-[-1] before:-z-10">
        <div className="bg-white/98 p-14 rounded-3xl shadow-2xl w-full max-w-md flex flex-col justify-center animate-fade-in backdrop-blur-sm border-0 outline-0">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/95 via-purple-600/95 to-purple-700/95 bg-cover bg-center rounded-full flex items-center justify-center mx-auto mb-6 text-4xl text-white font-bold shadow-lg shadow-purple-600/35">
              LP
            </div>
            <h2 className="text-gray-800 mb-2 text-3xl font-bold">Iniciar Sesión</h2>
            <p className="text-gray-600 m-0 text-base">Ingresa a tu cuenta</p>
          </div>

          {message && (
            <div className={`p-4 rounded-xl mb-5 mx-8 text-center font-medium animate-fade-in text-sm ${
              message.includes('Error') || message.includes('incorrectos') 
                ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200' 
                : 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}

          <form className="flex flex-col gap-7" onSubmit={handleSubmit}>
            <div className="flex flex-col items-start">
              <label className="mb-3 text-red-600 font-semibold text-sm flex items-center gap-2 uppercase tracking-wide w-full px-8">
                <FaUser /> Usuario
              </label>
              <input
                type="text"
                name="usuario"
                value={credentials.usuario}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Ingresa tu usuario"
                className="py-5 px-5 border-2 border-gray-200 rounded-xl text-base text-gray-900 placeholder-gray-500 transition-all duration-300 bg-gray-50 w-4/5 mx-8 focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10"
              />
            </div>

            <div className="flex flex-col items-start">
              <label className="mb-3 text-red-600 font-semibold text-sm flex items-center gap-2 uppercase tracking-wide w-full px-8">
                <FaLock /> Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Ingresa tu contraseña"
                className="py-5 px-5 border-2 border-gray-200 rounded-xl text-base text-gray-900 placeholder-gray-500 transition-all duration-300 bg-gray-50 w-4/5 mx-8 focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10"
              />
            </div>

            <div className="flex justify-between items-center mt-0 text-sm text-gray-700 px-8">
                <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="remember-me" name="remember-me" className="rounded"/>
                    Recordarme
                </label>
                <button 
                  type="button" 
                  className="text-blue-600 hover:text-blue-800 transition-colors underline" 
                  onClick={() => setMessage('Contacta al administrador para recuperar tu acceso')}
                >
                  ¿Olvidaste tu contraseña?
                </button>
            </div>

            <button 
              type="submit" 
              className="py-5 px-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 mt-6 relative overflow-hidden tracking-wide uppercase w-1/2 self-center hover:transform hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="text-center mt-8 pt-0 border-t-0">
            <p className="text-gray-400 text-xs m-0">© 2024 Sistema de Préstamos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
