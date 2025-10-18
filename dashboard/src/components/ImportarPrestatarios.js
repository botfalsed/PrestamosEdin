import React, { useState } from 'react';
import axios from 'axios';
import '../assets/css/importarPrestatarios.css';

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
      const response = await axios.post('http://192.168.18.22:8080/api_postgres.php?action=importar-prestatarios', formData, {
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
    <div className="importar-container">
      <div className="importar-header">
        <h1>Importar Prestatarios</h1>
        <p>Carga múltiples prestatarios desde archivo CSV o Excel</p>
      </div>

      <div className="importar-content">
        {/* Panel de instrucciones - ACTUALIZADO CON TUS COLUMNAS REALES */}
        <div className="instrucciones-panel">
          <h3>Formato Requerido</h3>
          <div className="tabla-ejemplo">
            <table>
              <thead>
                <tr>
                  <th>DNI</th>
                  <th>nombre</th>
                  <th>telefono</th>
                  <th>direccion</th>
                  <th>estado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>12345678</td>
                  <td>Juan Pérez García</td>
                  <td>987654321</td>
                  <td>Av. Principal 123</td>
                  <td>active</td>
                </tr>
                <tr>
                  <td>87654321</td>
                  <td>María López Silva</td>
                  <td>912345678</td>
                  <td>Calle Secundaria 456</td>
                  <td>active</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="reglas-lista">
            <h4>Reglas de Validación:</h4>
            <ul>
              <li><strong>DNI:</strong> 8-10 dígitos numéricos, único</li>
              <li><strong>nombre:</strong> Obligatorio (máx. 100 caracteres)</li>
              <li><strong>telefono:</strong> Opcional (máx. 20 caracteres)</li>
              <li><strong>direccion:</strong> Opcional (máx. 255 caracteres)</li>
              <li><strong>estado:</strong> "active", "moroso" o "pagado" (obligatorio)</li>
            </ul>
          </div>
        </div>

        {/* Área de subida */}
        <div className="subida-area">
          <div 
            className={`drag-drop-zone ${arrastrando ? 'dragging' : ''} ${archivo ? 'has-file' : ''}`}
            onDragEnter={manejarArrastrar}
            onDragLeave={manejarArrastrar}
            onDragOver={manejarArrastrar}
            onDrop={manejarSoltar}
          >
            {!archivo ? (
              <>
                <div className="upload-icon">📁</div>
                <p>Arrastra tu archivo aquí o</p>
                <input 
                  type="file" 
                  accept=".csv,.xlsx,.xls"
                  onChange={manejarArchivo}
                  className="file-input"
                  id="fileInput"
                />
                <label htmlFor="fileInput" className="btn-browse">
                  Seleccionar Archivo
                </label>
                <p className="format-info">Formatos: CSV, Excel (.xlsx, .xls)</p>
              </>
            ) : (
              <>
                <div className="file-selected">
                  <div className="file-icon">✅</div>
                  <div className="file-info">
                    <h4>{archivo.name}</h4>
                    <p>{(archivo.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button 
                    onClick={limpiarFormulario}
                    className="btn-remove"
                  >
                    ✕
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="acciones-botones">
            <button 
              onClick={importarDatos}
              disabled={cargando || !archivo}
              className={`btn btn-primary ${cargando ? 'loading' : ''}`}
            >
              {cargando ? 'Importando...' : 'Importar Datos'}
            </button>
          </div>
        </div>

        {/* Resultados */}
        {resultado && (
          <div className={`resultado-panel ${resultado.success ? 'success' : 'error'}`}>
            <div className="resultado-header">
              <h3>
                {resultado.success ? '✅ Importación Exitosa' : '❌ Error en Importación'}
              </h3>
            </div>
            
            <div className="resultado-content">
              <p>{resultado.message}</p>
              
              {resultado.registros_exitosos !== undefined && (
                <div className="estadisticas">
                  <div className="stat">
                    <span className="stat-number">{resultado.registros_exitosos}</span>
                    <span className="stat-label">Registros Exitosos</span>
                  </div>
                </div>
              )}
              
              {resultado.errores && resultado.errores.length > 0 && (
                <div className="errores-lista">
                  <h4>Errores Encontrados:</h4>
                  <div className="errores-scroll">
                    {resultado.errores.map((error, index) => (
                      <div key={index} className="error-item">
                        <span className="error-bullet">•</span>
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="resultado-footer">
              <button onClick={limpiarFormulario} className="btn btn-secondary">
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
