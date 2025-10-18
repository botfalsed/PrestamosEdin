import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/css/ExportarPrestatarios.css';

const ExportarPrestatarios = () => {
  const [prestatarios, setPrestatarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    cargarPrestatarios();
  }, []);

  const cargarPrestatarios = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://192.168.18.22:8080/api_postgres.php?action=prestatarios');
      if (Array.isArray(response.data)) {
        setPrestatarios(response.data);
      } else {
        setPrestatarios([]);
      }
    } catch (error) {
      console.error('Error cargando prestatarios:', error);
      setMessage('Error al cargar prestatarios');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const prestatariosFiltrados = prestatarios.filter(prestatario => {
    if (filtroEstado === 'todos') return true;
    return prestatario.estado === filtroEstado;
  });

  // Exportar a Excel con formato HTML (se abre perfecto en Excel)
  const exportarAExcel = () => {
    if (prestatariosFiltrados.length === 0) {
      setMessage('No hay datos para exportar');
      setMessageType('error');
      return;
    }

    try {
      const fecha = new Date().toLocaleDateString('es-PE');
      
      // Crear contenido HTML con formato de tabla Excel
      let htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="UTF-8">
    <!--[if gte mso 9]>
    <xml>
        <x:ExcelWorkbook>
            <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                    <x:Name>Prestatarios</x:Name>
                    <x:WorksheetOptions>
                        <x:DisplayGridlines/>
                    </x:WorksheetOptions>
                </x:ExcelWorksheet>
            </x:ExcelWorksheets>
        </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <style>
        table {
            border-collapse: collapse;
            width: 100%;
            font-family: Arial, sans-serif;
            font-size: 12px;
        }
        .header-title {
            font-size: 16px;
            fontWeight: bold;
            color: #2c3e50;
            padding: 10px;
            background-color: #f8f9fa;
        }
        .header-info {
            font-size: 11px;
            color: #7f8c8d;
            padding: 5px 10px;
            background-color: #f8f9fa;
        }
        th {
            background-color: #3498db;
            color: white;
            font-weight: bold;
            padding: 8px;
            border: 1px solid #2980b9;
            text-align: center;
        }
        td {
            padding: 6px 8px;
            border: 1px solid #ddd;
        }
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .estado-activo {
            background-color: #d4edda;
            color: #155724;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 3px;
        }
        .estado-inactivo {
            background-color: #f8d7da;
            color: #721c24;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <table>
        <!-- Encabezado del reporte -->
        <tr>
            <td colspan="5" class="header-title">REPORTE DE PRESTATARIOS</td>
        </tr>
        <tr>
            <td colspan="5" class="header-info">
                <strong>Generado:</strong> ${fecha} | 
                <strong>Total de prestatarios:</strong> ${prestatariosFiltrados.length} |
                <strong>Filtro:</strong> ${filtroEstado === 'todos' ? 'Todos' : filtroEstado}
            </td>
        </tr>
        <tr>
            <td colspan="5" style="height: 10px;"></td>
        </tr>
        
        <!-- Encabezados de la tabla -->
        <tr>
            <th style="width: 80px;">DNI</th>
            <th style="width: 200px;">NOMBRE COMPLETO</th>
            <th style="width: 100px;">TELÉFONO</th>
            <th style="width: 250px;">DIRECCIÓN</th>
            <th style="width: 80px;">ESTADO</th>
        </tr>
`;

      // Agregar filas de datos
      prestatariosFiltrados.forEach(prestatario => {
        const estadoClass = prestatario.estado === 'activo' ? 'estado-activo' : 'estado-inactivo';
        const estadoText = prestatario.estado === 'activo' ? 'ACTIVO' : 'INACTIVO';
        
        htmlContent += `
        <tr>
            <td style="text-align: center; font-family: 'Courier New';">${prestatario.DNI}</td>
            <td>${prestatario.nombre}</td>
            <td style="text-align: center; font-family: 'Courier New';">${prestatario.telefono}</td>
            <td>${prestatario.direccion}</td>
            <td style="text-align: center;"><span class="${estadoClass}">${estadoText}</span></td>
        </tr>`;
      });

      htmlContent += `
    </table>
</body>
</html>`;

      // Crear y descargar archivo con extensión .xls
      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Prestatarios_${fecha.replace(/\//g, '-')}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setMessage('✅ Archivo Excel generado exitosamente con formato profesional');
      setMessageType('success');
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      setMessage('❌ Error al generar el archivo Excel');
      setMessageType('error');
    }
  };

  // Exportar plantilla CSV para importar
// Exportar plantilla Excel con formato
const exportarPlantillaExcel = () => {
  try {
    const fecha = new Date().toLocaleDateString('es-PE');
    
    const plantilla = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="UTF-8">
    <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial; font-size: 12px; }
        th { background-color: #27ae60; color: white; font-weight: bold; padding: 8px; border: 1px solid #219a52; text-align: center; }
        td { padding: 6px 8px; border: 1px solid #ddd; }
        .instrucciones { background-color: #fff3cd; color: #856404; padding: 10px; margin: 10px 0; border-left: 4px solid #ffeaa7; }
        .ejemplo { background-color: #e8f5e8; color: #155724; padding: 8px; margin: 5px 0; }
    </style>
</head>
<body>
    <table>
        <tr><td colspan="5" style="background-color: #f8f9fa; font-size: 16px; font-weight: bold; padding: 15px; text-align: center;">PLANTILLA PARA IMPORTAR PRESTATARIOS</td></tr>
        
        <tr><td colspan="5" class="instrucciones">
            <strong>INSTRUCCIONES:</strong><br/>
            1. Complete los datos en las columnas correspondientes<br/>
            2. <strong>DNI</strong> debe tener 8 dígitos y ser único<br/>
            3. Todos los campos son <strong>obligatorios</strong> excepto Estado<br/>
            4. <strong>Estado</strong> puede ser "activo" o "inactivo" (por defecto: activo)<br/>
            5. No modifique los nombres de las columnas<br/>
            6. Guarde el archivo y use la opción de importar
        </td></tr>
        
        <tr>
            <th>DNI</th>
            <th>NOMBRE COMPLETO</th>
            <th>TELÉFONO</th>
            <th>DIRECCIÓN</th>
            <th>ESTADO</th>
        </tr>
        
        <tr><td colspan="5" class="ejemplo"><strong>EJEMPLOS (elimine estas filas después de completar):</strong></td></tr>
        
        <tr>
            <td style="text-align: center;">87654321</td>
            <td>Juan Pérez García</td>
            <td style="text-align: center;">987654321</td>
            <td>Av. Principal 123</td>
            <td style="text-align: center;">activo</td>
        </tr>
        <tr>
            <td style="text-align: center;">12345678</td>
            <td>María López Silva</td>
            <td style="text-align: center;">912345678</td>
            <td>Calle Secundaria 456</td>
            <td style="text-align: center;">activo</td>
        </tr>
        <tr>
            <td style="text-align: center;">45678901</td>
            <td>Carlos Rodríguez Mendoza</td>
            <td style="text-align: center;">934567890</td>
            <td>Jr. Libertad 789</td>
            <td style="text-align: center;">activo</td>
        </tr>
        
        <tr><td colspan="5" style="height: 20px;"></td></tr>
        
        <!-- Filas vacías para que el usuario complete -->
        <tr>
            <td style="background-color: #f8f9fa;"></td>
            <td style="background-color: #f8f9fa;"></td>
            <td style="background-color: #f8f9fa;"></td>
            <td style="background-color: #f8f9fa;"></td>
            <td style="background-color: #f8f9fa;"></td>
        </tr>
        <tr>
            <td style="background-color: #f8f9fa;"></td>
            <td style="background-color: #f8f9fa;"></td>
            <td style="background-color: #f8f9fa;"></td>
            <td style="background-color: #f8f9fa;"></td>
            <td style="background-color: #f8f9fa;"></td>
        </tr>
        <tr>
            <td style="background-color: #f8f9fa;"></td>
            <td style="background-color: #f8f9fa;"></td>
            <td style="background-color: #f8f9fa;"></td>
            <td style="background-color: #f8f9fa;"></td>
            <td style="background-color: #f8f9fa;"></td>
        </tr>
    </table>
</body>
</html>`;

    const blob = new Blob([plantilla], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'Plantilla_Prestatarios.xls');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMessage('📝 Plantilla Excel descargada. Complete los datos en las celdas y use la opción de importar.');
    setMessageType('success');
  } catch (error) {
    console.error('Error generando plantilla:', error);
    setMessage('❌ Error al generar la plantilla');
    setMessageType('error');
  }
};

  // Exportar a Tabla Web (se abre en navegador)
  const exportarATablaWeb = () => {
    if (prestatariosFiltrados.length === 0) {
      setMessage('No hay datos para exportar');
      setMessageType('error');
      return;
    }

    try {
      const fecha = new Date().toLocaleDateString('es-PE');
      
      // Crear tabla HTML
      let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reporte de Prestatarios</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; text-align: center; margin-bottom: 10px; }
        .header-info { text-align: center; color: #7f8c8d; margin-bottom: 30px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        th { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px; text-align: left; font-weight: 600; }
        td { padding: 12px 15px; border-bottom: 1px solid #e9ecef; }
        tr:hover { background-color: #f8f9fa; }
        .estado-activo { background: #d4edda; color: #155724; padding: 6px 12px; border-radius: 20px; font-weight: 600; }
        .estado-inactivo { background: #f8d7da; color: #721c24; padding: 6px 12px; border-radius: 20px; font-weight: 600; }
        .footer { text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>REPORTE DE PRESTATARIOS</h1>
        <div class="header-info">
            <p><strong>Generado:</strong> ${fecha} | <strong>Total:</strong> ${prestatariosFiltrados.length} prestatarios</p>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>DNI</th>
                    <th>NOMBRE COMPLETO</th>
                    <th>TELÉFONO</th>
                    <th>DIRECCIÓN</th>
                    <th>ESTADO</th>
                </tr>
            </thead>
            <tbody>
`;

      // Agregar filas de datos
      prestatariosFiltrados.forEach(prestatario => {
        const estadoClass = prestatario.estado === 'activo' ? 'estado-activo' : 'estado-inactivo';
        const estadoText = prestatario.estado === 'activo' ? 'ACTIVO' : 'INACTIVO';
        
        htmlContent += `
                <tr>
                    <td style="font-family: 'Courier New'; font-weight: bold;">${prestatario.DNI}</td>
                    <td><strong>${prestatario.nombre}</strong></td>
                    <td style="font-family: 'Courier New';">${prestatario.telefono}</td>
                    <td>${prestatario.direccion}</td>
                    <td><span class="${estadoClass}">${estadoText}</span></td>
                </tr>`;
      });

      htmlContent += `
            </tbody>
        </table>
        
        <div class="footer">
            <p>Sistema de Préstamos &copy; ${new Date().getFullYear()} - Generado automáticamente</p>
        </div>
    </div>
</body>
</html>`;

      // Crear y descargar archivo HTML
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Prestatarios_${fecha.replace(/\//g, '-')}.html`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setMessage('✅ Tabla Web generada exitosamente');
      setMessageType('success');
    } catch (error) {
      console.error('Error exportando a HTML:', error);
      setMessage('❌ Error al generar la tabla web');
      setMessageType('error');
    }
  };

  const obtenerEstadisticas = () => {
    const total = prestatarios.length;
    const activos = prestatarios.filter(p => p.estado === 'activo').length;
    const inactivos = prestatarios.filter(p => p.estado === 'inactivo').length;
    
    return { total, activos, inactivos };
  };

  const stats = obtenerEstadisticas();

  return (
    <div className="exportar-container">
      <div className="exportar-header">
        <h1>📤 Exportar Prestatarios</h1>
        <p>Exporte la lista de prestatarios a diferentes formatos</p>
      </div>

      {message && (
        <div className={`alert alert-${messageType}`}>
          {message}
        </div>
      )}

      {/* Estadísticas */}
      <div className="estadisticas-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Prestatarios</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <h3>{stats.activos}</h3>
            <p>Activos</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔴</div>
          <div className="stat-info">
            <h3>{stats.inactivos}</h3>
            <p>Inactivos</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>{prestatariosFiltrados.length}</h3>
            <p>Para Exportar</p>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="controles-section">
        <div className="filtros">
          <label>Filtrar por estado:</label>
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="filtro-select"
          >
            <option value="todos">Todos los prestatarios</option>
            <option value="activo">Solo activos</option>
            <option value="inactivo">Solo inactivos</option>
          </select>
        </div>
        
        <button 
          onClick={cargarPrestatarios} 
          className="btn-actualizar"
          disabled={loading}
        >
          🔄 {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      {/* Opciones de Exportación */}
      <div className="exportar-opciones">
        <div className="opcion-card">
          <div className="opcion-icon">📝</div>
          <div className="opcion-content">
            <h3>Descargar Plantilla CSV</h3>
            <p>Plantilla para importar prestatarios</p>
           <button 
              onClick={exportarPlantillaExcel}
              className="btn btn-secondary"
            >
              📥 Plantilla Excel
          </button>
          </div>
        </div>

        <div className="opcion-card">
          <div className="opcion-icon">📊</div>
          <div className="opcion-content">
            <h3>Exportar a Excel</h3>
            <p>Formato profesional con diseño de tabla</p>
            <button 
              onClick={exportarAExcel}
              disabled={prestatariosFiltrados.length === 0}
              className="btn btn-primary"
            >
              📊 Exportar Excel
            </button>
          </div>
        </div>

        <div className="opcion-card">
          <div className="opcion-icon">🌐</div>
          <div className="opcion-content">
            <h3>Exportar a Tabla Web</h3>
            <p>Tabla HTML responsive para navegador</p>
            <button 
              onClick={exportarATablaWeb}
              disabled={prestatariosFiltrados.length === 0}
              className="btn btn-info"
            >
              🌐 Exportar Web
            </button>
          </div>
        </div>
      </div>

      {/* Vista Previa */}
      <div className="vista-previa">
        <h3>Vista Previa ({prestatariosFiltrados.length} prestatarios)</h3>
        <div className="table-container">
          {loading ? (
            <div className="loading">Cargando prestatarios...</div>
          ) : prestatariosFiltrados.length > 0 ? (
            <table className="prestatarios-table">
              <thead>
                <tr>
                  <th>DNI</th>
                  <th>Nombre Completo</th>
                  <th>Teléfono</th>
                  <th>Dirección</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {prestatariosFiltrados.slice(0, 10).map(prestatario => (
                  <tr key={prestatario.id_prestatario}>
                    <td className="dni-cell">{prestatario.DNI}</td>
                    <td className="nombre-cell">{prestatario.nombre}</td>
                    <td className="telefono-cell">{prestatario.telefono}</td>
                    <td className="direccion-cell">{prestatario.direccion}</td>
                    <td>
                      <span className={`estado-badge ${prestatario.estado}`}>
                        {prestatario.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-data">
              <p>No hay prestatarios para mostrar</p>
            </div>
          )}
          {prestatariosFiltrados.length > 10 && (
            <div className="preview-message">
              Mostrando 10 de {prestatariosFiltrados.length} prestatarios
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportarPrestatarios;
