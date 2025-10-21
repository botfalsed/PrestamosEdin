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
      const response = await axios.post('/api_postgres.php?action=login', {
        usuario: credentials.usuario,
        password: credentials.password
      });

      if (response.data.success) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({
          usuario: credentials.usuario,
          id: response.data.user?.id || 1
        }));
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
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-cover bg-center bg-no-repeat fixed top-0 left-0">
      {/* Lado izquierdo con imagen (COLUMNA MORADA) - Oculta en móvil */}
      <div className="hidden lg:flex lg:flex-1 h-screen bg-gradient-to-br from-blue-500/90 via-purple-600/90 to-purple-700/90 bg-cover bg-center bg-no-repeat items-center justify-center p-6 xl:p-12 text-white relative overflow-hidden border-r-0">
        <div className="text-left max-w-lg z-10">
          <h1 className="text-4xl xl:text-6xl font-bold mb-5 leading-tight">Sistema de Préstamos</h1>
          <p className="text-lg xl:text-2xl opacity-95 leading-relaxed mb-10 font-light">Gestión profesional de préstamos financieros</p>
          
          <div className="text-left mt-8">
             <div className="flex items-center mb-5 text-lg xl:text-2xl opacity-95 before:content-['✓'] before:bg-white/25 before:w-6 before:h-6 xl:before:w-7 xl:before:h-7 before:rounded-full before:flex before:items-center before:justify-center before:mr-4 before:font-bold before:flex-shrink-0">
               Visualiza tus métricas clave.
             </div>
             <div className="flex items-center mb-5 text-lg xl:text-2xl opacity-95 before:content-['✓'] before:bg-white/25 before:w-6 before:h-6 xl:before:w-7 xl:before:h-7 before:rounded-full before:flex before:items-center before:justify-center before:mr-4 before:font-bold before:flex-shrink-0">
               Recibe alertas de vencimiento.
             </div>
             <div className="flex items-center mb-5 text-lg xl:text-2xl opacity-95 before:content-['✓'] before:bg-white/25 before:w-6 before:h-6 xl:before:w-7 xl:before:h-7 before:rounded-full before:flex before:items-center before:justify-center before:mr-4 before:font-bold before:flex-shrink-0">
               Gestión simplificada.
             </div>
          </div>
        </div>
      </div>

      {/* Lado derecho con formulario (COLUMNA BLANCA) - Pantalla completa en móvil */}
      <div className="flex-1 lg:flex-1 h-screen flex items-center justify-center p-4 sm:p-6 lg:p-12 text-white relative overflow-hidden border-r-0 bg-gradient-to-br from-blue-500/90 via-purple-600/90 to-purple-700/90 lg:before:absolute lg:before:top-0 lg:before:left-0 lg:before:w-full lg:before:h-full lg:before:bg-gradient-to-br lg:before:from-blue-500/90 lg:before:via-purple-600/90 lg:before:to-purple-700/90 lg:before:bg-cover lg:before:bg-center lg:before:bg-no-repeat lg:before:scale-x-[-1] lg:before:-z-10">
        <div className="bg-white/98 p-6 sm:p-8 lg:p-14 rounded-2xl lg:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md flex flex-col justify-center animate-fade-in backdrop-blur-sm border-0 outline-0">
          <div className="text-center mb-8 sm:mb-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500/95 via-purple-600/95 to-purple-700/95 bg-cover bg-center rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-2xl sm:text-4xl text-white font-bold shadow-lg shadow-purple-600/35">
              LP
            </div>
            <h2 className="text-gray-800 mb-2 text-2xl sm:text-3xl font-bold">Iniciar Sesión</h2>
            <p className="text-gray-600 m-0 text-sm sm:text-base">Ingresa a tu cuenta</p>
          </div>

          {message && (
            <div className={`p-3 sm:p-4 rounded-xl mb-4 sm:mb-5 mx-4 sm:mx-8 text-center font-medium animate-fade-in text-xs sm:text-sm ${
              message.includes('Error') || message.includes('incorrectos') 
                ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200' 
                : 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}

          <form className="flex flex-col gap-5 sm:gap-7" onSubmit={handleSubmit}>
            <div className="flex flex-col items-start">
              <label className="mb-2 sm:mb-3 text-red-600 font-semibold text-xs sm:text-sm flex items-center gap-2 uppercase tracking-wide w-full px-4 sm:px-8">
                <FaUser /> Usuario
              </label>
              <input
                type="text"
                name="usuario"
                value={credentials.usuario}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Ingresa tu usuario"
                className="py-3 sm:py-5 px-4 sm:px-5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-gray-900 placeholder-gray-500 transition-all duration-300 bg-gray-50 w-full sm:w-4/5 mx-4 sm:mx-8 focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10"
              />
            </div>

            <div className="flex flex-col items-start">
              <label className="mb-2 sm:mb-3 text-red-600 font-semibold text-xs sm:text-sm flex items-center gap-2 uppercase tracking-wide w-full px-4 sm:px-8">
                <FaLock /> Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Ingresa tu contraseña"
                className="py-3 sm:py-5 px-4 sm:px-5 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-gray-900 placeholder-gray-500 transition-all duration-300 bg-gray-50 w-full sm:w-4/5 mx-4 sm:mx-8 focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-0 text-xs sm:text-sm text-gray-700 px-4 sm:px-8 gap-2 sm:gap-0">
                <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="remember-me" name="remember-me" className="rounded"/>
                    Recordarme
                </label>
                <button 
                  type="button" 
                  className="text-blue-600 hover:text-blue-800 transition-colors underline text-left sm:text-right" 
                  onClick={() => setMessage('Contacta al administrador para recuperar tu acceso')}
                >
                  ¿Olvidaste tu contraseña?
                </button>
            </div>

            <button 
              type="submit" 
              className="py-3 sm:py-5 px-6 sm:px-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 rounded-xl text-sm sm:text-base font-semibold cursor-pointer transition-all duration-300 mt-4 sm:mt-6 relative overflow-hidden tracking-wide uppercase w-full sm:w-1/2 self-center hover:transform hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="text-center mt-6 sm:mt-8 pt-0 border-t-0">
            <p className="text-gray-400 text-xs m-0">© 2024 Sistema de Préstamos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
