import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
      const response = await axios.get('http://localhost:8080/api_postgres.php?action=prestatarios');
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
            <td style="text-align: center;">${prestatario.DNI}</td>
            <td>${prestatario.nombre}</td>
            <td style="text-align: center;">${prestatario.telefono || ''}</td>
            <td>${prestatario.direccion || ''}</td>
            <td style="text-align: center;"><span class="${estadoClass}">${estadoText}</span></td>
        </tr>`;
      });

      htmlContent += `
    </table>
</body>
</html>`;

      // Crear y descargar archivo
      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prestatarios_${filtroEstado}_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage('Archivo Excel descargado exitosamente');
      setMessageType('success');
      
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      setMessage('Error al exportar a Excel');
      setMessageType('error');
    }
  };

  // Exportar plantilla Excel para importación
  const exportarPlantillaExcel = () => {
    try {
      const fecha = new Date().toLocaleDateString('es-PE');
      
      let htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="UTF-8">
    <!--[if gte mso 9]>
    <xml>
        <x:ExcelWorkbook>
            <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                    <x:Name>Plantilla Prestatarios</x:Name>
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
            font-weight: bold;
            color: #2c3e50;
            padding: 10px;
            background-color: #e8f4fd;
        }
        .header-info {
            font-size: 11px;
            color: #7f8c8d;
            padding: 5px 10px;
            background-color: #e8f4fd;
        }
        .instructions {
            font-size: 10px;
            color: #e74c3c;
            padding: 5px 10px;
            background-color: #fdf2e8;
            font-style: italic;
        }
        th {
            background-color: #3498db;
            color: white;
            font-weight: bold;
            padding: 8px;
            border: 1px solid #2980b9;
            text-align: center;
        }
        .example-row td {
            padding: 6px 8px;
            border: 1px solid #ddd;
            background-color: #f8f9fa;
            font-style: italic;
            color: #666;
        }
        .empty-row td {
            padding: 6px 8px;
            border: 1px solid #ddd;
            height: 25px;
        }
    </style>
</head>
<body>
    <table>
        <!-- Encabezado -->
        <tr>
            <td colspan="5" class="header-title">PLANTILLA PARA IMPORTAR PRESTATARIOS</td>
        </tr>
        <tr>
            <td colspan="5" class="header-info">
                <strong>Generado:</strong> ${fecha} | 
                <strong>Instrucciones:</strong> Complete los datos en las filas vacías siguiendo el formato de ejemplo
            </td>
        </tr>
        <tr>
            <td colspan="5" class="instructions">
                IMPORTANTE: DNI debe ser único (8-10 dígitos), nombre es obligatorio, estado debe ser "active", "moroso" o "pagado"
            </td>
        </tr>
        <tr>
            <td colspan="5" style="height: 10px;"></td>
        </tr>
        
        <!-- Encabezados -->
        <tr>
            <th style="width: 80px;">DNI</th>
            <th style="width: 200px;">nombre</th>
            <th style="width: 100px;">telefono</th>
            <th style="width: 250px;">direccion</th>
            <th style="width: 80px;">estado</th>
        </tr>
        
        <!-- Fila de ejemplo -->
        <tr class="example-row">
            <td>12345678</td>
            <td>Juan Pérez García</td>
            <td>987654321</td>
            <td>Av. Principal 123</td>
            <td>active</td>
        </tr>
        
        <!-- Filas vacías para completar -->`;

      // Agregar 20 filas vacías
      for (let i = 0; i < 20; i++) {
        htmlContent += `
        <tr class="empty-row">
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
        </tr>`;
      }

      htmlContent += `
    </table>
</body>
</html>`;

      // Crear y descargar archivo
      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `plantilla_prestatarios_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage('Plantilla Excel descargada exitosamente');
      setMessageType('success');
      
    } catch (error) {
      console.error('Error exportando plantilla:', error);
      setMessage('Error al exportar plantilla');
      setMessageType('error');
    }
  };

  // Exportar a tabla web HTML
  const exportarATablaWeb = () => {
    if (prestatariosFiltrados.length === 0) {
      setMessage('No hay datos para exportar');
      setMessageType('error');
      return;
    }

    try {
      const fecha = new Date().toLocaleDateString('es-PE');
      
      let htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Prestatarios - ${fecha}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .stats {
            display: flex;
            justify-content: space-around;
            padding: 20px;
            background: #f8f9fa;
            border-bottom: 1px solid #dee2e6;
        }
        
        .stat {
            text-align: center;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .stat-label {
            color: #7f8c8d;
            font-size: 0.9rem;
        }
        
        .table-container {
            overflow-x: auto;
            padding: 20px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        
        th {
            background: #3498db;
            color: white;
            padding: 15px 10px;
            text-align: left;
            font-weight: 600;
            position: sticky;
            top: 0;
        }
        
        td {
            padding: 12px 10px;
            border-bottom: 1px solid #dee2e6;
        }
        
        tr:hover {
            background-color: #f8f9fa;
        }
        
        .estado-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .estado-badge.activo {
            background: #d4edda;
            color: #155724;
        }
        
        .estado-badge.inactivo {
            background: #f8d7da;
            color: #721c24;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            color: #7f8c8d;
            font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
            .header h1 { font-size: 1.8rem; }
            .stats { flex-direction: column; gap: 15px; }
            table { font-size: 12px; }
            th, td { padding: 8px 5px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Reporte de Prestatarios</h1>
            <p>Generado el ${fecha}</p>
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-number">${prestatariosFiltrados.length}</div>
                <div class="stat-label">Total Registros</div>
            </div>
            <div class="stat">
                <div class="stat-number">${prestatariosFiltrados.filter(p => p.estado === 'activo').length}</div>
                <div class="stat-label">Activos</div>
            </div>
            <div class="stat">
                <div class="stat-number">${prestatariosFiltrados.filter(p => p.estado !== 'activo').length}</div>
                <div class="stat-label">Inactivos</div>
            </div>
            <div class="stat">
                <div class="stat-number">${filtroEstado === 'todos' ? 'Todos' : filtroEstado}</div>
                <div class="stat-label">Filtro Aplicado</div>
            </div>
        </div>
        
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>DNI</th>
                        <th>Nombre Completo</th>
                        <th>Teléfono</th>
                        <th>Dirección</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>`;

      prestatariosFiltrados.forEach(prestatario => {
        htmlContent += `
                    <tr>
                        <td><strong>${prestatario.DNI}</strong></td>
                        <td>${prestatario.nombre}</td>
                        <td>${prestatario.telefono || '-'}</td>
                        <td>${prestatario.direccion || '-'}</td>
                        <td>
                            <span class="estado-badge ${prestatario.estado}">
                                ${prestatario.estado}
                            </span>
                        </td>
                    </tr>`;
      });

      htmlContent += `
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>Reporte generado automáticamente el ${new Date().toLocaleString('es-PE')}</p>
            <p>Sistema de Gestión de Préstamos</p>
        </div>
    </div>
</body>
</html>`;

      // Crear y descargar archivo
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_prestatarios_${filtroEstado}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage('Tabla web descargada exitosamente');
      setMessageType('success');
      
    } catch (error) {
      console.error('Error exportando tabla web:', error);
      setMessage('Error al exportar tabla web');
      setMessageType('error');
    }
  };

  const obtenerEstadisticas = () => {
    const total = prestatarios.length;
    const activos = prestatarios.filter(p => p.estado === 'activo').length;
    const inactivos = total - activos;
    
    return { total, activos, inactivos };
  };

  const stats = obtenerEstadisticas();

  return (
    <div className="p-5 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-4xl text-slate-800 mb-2.5">📤 Exportar Prestatarios</h1>
        <p className="text-lg text-slate-500 m-0">Exporte la lista de prestatarios a diferentes formatos</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          messageType === 'success' 
            ? 'bg-green-100 border border-green-200 text-green-800' 
            : 'bg-red-100 border border-red-200 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-[0_4px_15px_rgba(0,0,0,0.1)] border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)]">
          <div className="text-3xl w-15 h-15 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">👥</div>
          <div>
            <h3 className="m-0 text-3xl font-bold text-slate-800">{stats.total}</h3>
            <p className="mt-1 mb-0 text-slate-500 font-medium">Total Prestatarios</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-[0_4px_15px_rgba(0,0,0,0.1)] border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)]">
          <div className="text-3xl w-15 h-15 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">🟢</div>
          <div>
            <h3 className="m-0 text-3xl font-bold text-slate-800">{stats.activos}</h3>
            <p className="mt-1 mb-0 text-slate-500 font-medium">Activos</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-[0_4px_15px_rgba(0,0,0,0.1)] border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)]">
          <div className="text-3xl w-15 h-15 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">🔴</div>
          <div>
            <h3 className="m-0 text-3xl font-bold text-slate-800">{stats.inactivos}</h3>
            <p className="mt-1 mb-0 text-slate-500 font-medium">Inactivos</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-[0_4px_15px_rgba(0,0,0,0.1)] border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)]">
          <div className="text-3xl w-15 h-15 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">📊</div>
          <div>
            <h3 className="m-0 text-3xl font-bold text-slate-800">{prestatariosFiltrados.length}</h3>
            <p className="mt-1 mb-0 text-slate-500 font-medium">Para Exportar</p>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4 bg-white p-5 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-4">
          <label className="font-semibold text-slate-800">Filtrar por estado:</label>
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="py-2.5 px-4 border border-gray-300 rounded-lg bg-white text-slate-800 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos los prestatarios</option>
            <option value="activo">Solo activos</option>
            <option value="inactivo">Solo inactivos</option>
          </select>
        </div>
        
        <button 
          onClick={cargarPrestatarios} 
          disabled={loading}
          className={`py-2.5 px-5 rounded-lg font-semibold transition-all duration-200 ${
            loading 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-500 text-white hover:bg-blue-600 active:transform active:scale-95'
          }`}
        >
          🔄 {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      {/* Opciones de Exportación */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.1)] border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)]">
          <div className="text-4xl mb-4">📝</div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Descargar Plantilla CSV</h3>
            <p className="text-slate-600 mb-4">Plantilla para importar prestatarios</p>
           <button 
              onClick={exportarPlantillaExcel}
              className="bg-gray-500 text-white py-2.5 px-5 rounded-lg font-semibold transition-all duration-200 hover:bg-gray-600 active:transform active:scale-95"
            >
              📥 Plantilla Excel
          </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.1)] border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)]">
          <div className="text-4xl mb-4">📊</div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Exportar a Excel</h3>
            <p className="text-slate-600 mb-4">Formato profesional con diseño de tabla</p>
            <button 
              onClick={exportarAExcel}
              disabled={prestatariosFiltrados.length === 0}
              className={`py-2.5 px-5 rounded-lg font-semibold transition-all duration-200 ${
                prestatariosFiltrados.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600 active:transform active:scale-95'
              }`}
            >
              📊 Exportar Excel
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.1)] border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)]">
          <div className="text-4xl mb-4">🌐</div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Exportar a Tabla Web</h3>
            <p className="text-slate-600 mb-4">Tabla HTML responsive para navegador</p>
            <button 
              onClick={exportarATablaWeb}
              disabled={prestatariosFiltrados.length === 0}
              className={`py-2.5 px-5 rounded-lg font-semibold transition-all duration-200 ${
                prestatariosFiltrados.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 active:transform active:scale-95'
              }`}
            >
              🌐 Exportar Web
            </button>
          </div>
        </div>
      </div>

      {/* Vista Previa */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.1)]">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Vista Previa ({prestatariosFiltrados.length} prestatarios)</h3>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-8 text-slate-500">Cargando prestatarios...</div>
          ) : prestatariosFiltrados.length > 0 ? (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="bg-blue-500 text-white p-4 text-left font-semibold border border-blue-600">DNI</th>
                  <th className="bg-blue-500 text-white p-4 text-left font-semibold border border-blue-600">Nombre Completo</th>
                  <th className="bg-blue-500 text-white p-4 text-left font-semibold border border-blue-600">Teléfono</th>
                  <th className="bg-blue-500 text-white p-4 text-left font-semibold border border-blue-600">Dirección</th>
                  <th className="bg-blue-500 text-white p-4 text-left font-semibold border border-blue-600">Estado</th>
                </tr>
              </thead>
              <tbody>
                {prestatariosFiltrados.slice(0, 10).map(prestatario => (
                  <tr key={prestatario.id_prestatario} className="hover:bg-gray-50">
                    <td className="p-3 border-b border-gray-200 font-mono">{prestatario.DNI}</td>
                    <td className="p-3 border-b border-gray-200">{prestatario.nombre}</td>
                    <td className="p-3 border-b border-gray-200">{prestatario.telefono}</td>
                    <td className="p-3 border-b border-gray-200">{prestatario.direccion}</td>
                    <td className="p-3 border-b border-gray-200">
                      <span className={`py-1 px-3 rounded-full text-xs font-semibold uppercase ${
                        prestatario.estado === 'activo' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {prestatario.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">No hay prestatarios para mostrar</p>
            </div>
          )}
          {prestatariosFiltrados.length > 10 && (
            <div className="text-center mt-4 text-sm text-slate-500">
              Mostrando 10 de {prestatariosFiltrados.length} prestatarios
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportarPrestatarios;
