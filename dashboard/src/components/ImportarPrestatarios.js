import React, { useState } from 'react';
import axios from 'axios';

const ImportarPrestatarios = () => {
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);

  const manejarArchivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivo(file);
      setResultado(null);
    }
  };

  const manejarArrastrar = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setArrastrando(true);
    } else if (e.type === 'dragleave') {
      setArrastrando(false);
    }
  };

  const manejarSoltar = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setArrastrando(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      const extension = file.name.split('.').pop().toLowerCase();
      
      if (['csv', 'xlsx', 'xls'].includes(extension)) {
        setArchivo(file);
        setResultado(null);
      } else {
        alert('Solo se permiten archivos CSV o Excel');
      }
    }
  };

  const importarDatos = async () => {
    if (!archivo) {
      alert('Selecciona un archivo');
      return;
    }

    const formData = new FormData();
    formData.append('archivo', archivo);

    setCargando(true);
    try {
      const response = await axios.post('http://localhost:8080/api_postgres.php?action=importar-prestatarios', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResultado(response.data);
      
    } catch (error) {
      console.error('Error:', error);
      setResultado({ 
        success: false, 
        message: 'Error de conexión con el servidor',
        errores: ['No se pudo conectar con el servidor']
      });
    } finally {
      setCargando(false);
    }
  };

  const limpiarFormulario = () => {
    setArchivo(null);
    setResultado(null);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="p-5 max-w-4xl mx-auto md:p-4">
      <div className="text-center mb-8">
        <h1 className="text-slate-800 mb-2.5 text-2xl md:text-xl">Importar Prestatarios</h1>
        <p className="text-slate-500 text-base">Carga múltiples prestatarios desde archivo CSV o Excel</p>
      </div>

      <div className="grid gap-8 md:grid-cols-1 md:gap-5">
        {/* Panel de instrucciones - ACTUALIZADO CON TUS COLUMNAS REALES */}
        <div className="bg-gray-50 p-5 rounded-xl border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold mb-4">Formato Requerido</h3>
          <div className="overflow-x-auto md:overflow-x-hidden">
            <table className="w-full border-collapse my-4 rounded-xl shadow-[0_6px_16px_rgba(0,0,0,0.08)] md:table-fixed">
              <thead>
                <tr>
                  <th className="bg-blue-500 text-white p-2.5 text-left md:p-2.5 md:text-sm">DNI</th>
                  <th className="bg-blue-500 text-white p-2.5 text-left md:p-2.5 md:text-sm">nombre</th>
                  <th className="bg-blue-500 text-white p-2.5 text-left md:p-2.5 md:text-sm">telefono</th>
                  <th className="bg-blue-500 text-white p-2.5 text-left md:p-2.5 md:text-sm">direccion</th>
                  <th className="bg-blue-500 text-white p-2.5 text-left md:p-2.5 md:text-sm">estado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border border-gray-300 bg-white md:p-2.5 md:text-sm md:break-words">12345678</td>
                  <td className="p-2 border border-gray-300 bg-white md:p-2.5 md:text-sm md:break-words">Juan Pérez García</td>
                  <td className="p-2 border border-gray-300 bg-white md:p-2.5 md:text-sm md:break-words">987654321</td>
                  <td className="p-2 border border-gray-300 bg-white md:p-2.5 md:text-sm md:break-words">Av. Principal 123</td>
                  <td className="p-2 border border-gray-300 bg-white md:p-2.5 md:text-sm md:break-words">active</td>
                </tr>
                <tr>
                  <td className="p-2 border border-gray-300 bg-white md:p-2.5 md:text-sm md:break-words">87654321</td>
                  <td className="p-2 border border-gray-300 bg-white md:p-2.5 md:text-sm md:break-words">María López Silva</td>
                  <td className="p-2 border border-gray-300 bg-white md:p-2.5 md:text-sm md:break-words">912345678</td>
                  <td className="p-2 border border-gray-300 bg-white md:p-2.5 md:text-sm md:break-words">Calle Secundaria 456</td>
                  <td className="p-2 border border-gray-300 bg-white md:p-2.5 md:text-sm md:break-words">active</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Reglas de Validación:</h4>
            <ul className="list-none p-0">
              <li className="py-1.5 border-b border-gray-200"><strong>DNI:</strong> 8-10 dígitos numéricos, único</li>
              <li className="py-1.5 border-b border-gray-200"><strong>nombre:</strong> Obligatorio (máx. 100 caracteres)</li>
              <li className="py-1.5 border-b border-gray-200"><strong>telefono:</strong> Opcional (máx. 20 caracteres)</li>
              <li className="py-1.5 border-b border-gray-200"><strong>direccion:</strong> Opcional (máx. 255 caracteres)</li>
              <li className="py-1.5 border-b border-gray-200"><strong>estado:</strong> "active", "moroso" o "pagado" (obligatorio)</li>
            </ul>
          </div>
        </div>

        {/* Área de subida */}
        <div>
          <div 
            className={`
              border-2 border-dashed rounded-xl py-10 px-5 text-center transition-all duration-300 bg-gray-50
              ${arrastrando ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
              ${archivo ? 'border-green-500 bg-green-50' : ''}
              md:py-6 md:px-4
            `}
            onDragEnter={manejarArrastrar}
            onDragLeave={manejarArrastrar}
            onDragOver={manejarArrastrar}
            onDrop={manejarSoltar}
          >
            {!archivo ? (
              <>
                <div className="text-5xl mb-4">📁</div>
                <p className="mb-2">Arrastra tu archivo aquí o</p>
                <input 
                  type="file" 
                  accept=".csv,.xlsx,.xls"
                  onChange={manejarArchivo}
                  className="hidden"
                  id="fileInput"
                />
                <label 
                  htmlFor="fileInput" 
                  className="bg-blue-500 text-white border-none py-2.5 px-5 rounded-md cursor-pointer my-2.5 inline-block hover:bg-blue-600 transition-colors"
                >
                  Seleccionar Archivo
                </label>
                <p className="text-sm text-gray-600 mt-2">Formatos: CSV, Excel (.xlsx, .xls)</p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-2xl">✅</div>
                  <div className="text-left">
                    <h4 className="m-0 text-slate-800 font-semibold">{archivo.name}</h4>
                    <p className="m-0 text-slate-500 text-sm">{(archivo.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button 
                    onClick={limpiarFormulario}
                    className="bg-red-500 text-white border-none w-8 h-8 rounded-full cursor-pointer hover:bg-red-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-4 justify-center mt-5 md:flex-col md:gap-3">
            <button 
              onClick={importarDatos}
              disabled={cargando || !archivo}
              className={`
                py-3 px-6 border-none rounded-md cursor-pointer text-sm font-semibold transition-all duration-300
                ${cargando || !archivo 
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                  : 'bg-green-500 text-white hover:bg-green-600'
                }
              `}
            >
              {cargando ? 'Importando...' : 'Importar Datos'}
            </button>
          </div>
        </div>

        {/* Resultados */}
        {resultado && (
          <div className={`
            rounded-xl p-5 mt-5
            ${resultado.success 
              ? 'bg-green-100 border border-green-200 text-green-800' 
              : 'bg-red-100 border border-red-200 text-red-800'
            }
          `}>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                {resultado.success ? '✅ Importación Exitosa' : '❌ Error en Importación'}
              </h3>
            </div>
            
            <div>
              <p className="mb-4">{resultado.message}</p>
              
              {resultado.registros_exitosos !== undefined && (
                <div className="flex gap-8 my-4 justify-center">
                  <div className="text-center">
                    <span className="block text-2xl font-bold">{resultado.registros_exitosos}</span>
                    <span className="text-xs opacity-80">Registros Exitosos</span>
                  </div>
                </div>
              )}
              
              {resultado.errores && resultado.errores.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Errores Encontrados:</h4>
                  <div className="max-h-48 overflow-y-auto bg-white/50 p-2.5 rounded-md">
                    {resultado.errores.map((error, index) => (
                      <div key={index} className="py-1.5 border-b border-black/10 text-sm">
                        <span className="text-red-500 mr-2">•</span>
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-black/10 text-center">
              <button 
                onClick={limpiarFormulario} 
                className="bg-blue-500 text-white py-3 px-6 border-none rounded-md cursor-pointer text-sm font-semibold hover:bg-blue-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportarPrestatarios;
