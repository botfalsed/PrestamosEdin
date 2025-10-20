import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import mobileApi from '../../services/mobileApi';

const ReportesPagosScreen = ({ navigation }) => {
  const [pagos, setPagos] = useState([]);
  const [pagosFiltrados, setPagosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [totalGeneral, setTotalGeneral] = useState(0);
  const [totalPagos, setTotalPagos] = useState(0);

  useEffect(() => {
    cargarPagos();
  }, []);

  useEffect(() => {
    filtrarPagos();
  }, [pagos, fechaDesde, fechaHasta]);

  const cargarPagos = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando historial de pagos...');
      
      const result = await mobileApi.makeRequest('api_postgres.php?action=pagos-historial');
      
      if (result.success && Array.isArray(result.data)) {
        console.log('✅ Pagos cargados:', result.data.length);
        setPagos(result.data);
      } else {
        console.error('❌ Error cargando pagos:', result);
        Alert.alert('Error', 'No se pudieron cargar los pagos');
      }
    } catch (error) {
      console.error('💥 Error:', error);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const filtrarPagos = () => {
    let pagosFiltrados = [...pagos];

    if (fechaDesde) {
      pagosFiltrados = pagosFiltrados.filter(pago => {
        const fechaPago = new Date(pago.fecha).toISOString().split('T')[0];
        return fechaPago >= fechaDesde;
      });
    }

    if (fechaHasta) {
      pagosFiltrados = pagosFiltrados.filter(pago => {
        const fechaPago = new Date(pago.fecha).toISOString().split('T')[0];
        return fechaPago <= fechaHasta;
      });
    }

    // Ordenar por fecha descendente (más recientes primero)
    pagosFiltrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    setPagosFiltrados(pagosFiltrados);
    
    // Calcular totales
    const total = pagosFiltrados.reduce((sum, pago) => sum + parseFloat(pago.monto || 0), 0);
    setTotalGeneral(total);
    setTotalPagos(pagosFiltrados.length);
  };

  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearMonto = (monto) => {
    return `S/ ${parseFloat(monto || 0).toFixed(2)}`;
  };

  const limpiarFiltros = () => {
    setFechaDesde('');
    setFechaHasta('');
  };

  const obtenerFechaHoy = () => {
    return new Date().toISOString().split('T')[0];
  };

  const filtrarHoy = () => {
    const hoy = obtenerFechaHoy();
    setFechaDesde(hoy);
    setFechaHasta(hoy);
  };

  const filtrarEstaSemana = () => {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    
    setFechaDesde(inicioSemana.toISOString().split('T')[0]);
    setFechaHasta(obtenerFechaHoy());
  };

  const filtrarEsteMes = () => {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    setFechaDesde(inicioMes.toISOString().split('T')[0]);
    setFechaHasta(obtenerFechaHoy());
  };

  const generarPDF = async () => {
    try {
      console.log('📄 Generando PDF...');
      
      if (pagosFiltrados.length === 0) {
        Alert.alert('Sin datos', 'No hay pagos para exportar');
        return;
      }

      // Crear el contenido HTML del PDF
      const fechaActual = new Date().toLocaleDateString('es-ES');
      const periodoTexto = fechaDesde && fechaHasta 
        ? `Del ${formatearFecha(fechaDesde)} al ${formatearFecha(fechaHasta)}`
        : 'Todos los registros';

      const htmlContent = `
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte de Pagos</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
              font-size: 14px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #007AFF;
              padding-bottom: 20px;
            }
            .title { 
              font-size: 24px; 
              font-weight: bold; 
              color: #007AFF;
              margin-bottom: 10px;
            }
            .subtitle { 
              font-size: 16px; 
              color: #666;
              margin-bottom: 5px;
            }
            .summary { 
              background-color: #f8f9fa; 
              padding: 15px; 
              border-radius: 8px; 
              margin-bottom: 20px;
              text-align: center;
            }
            .summary-item {
              display: inline-block;
              margin: 0 20px;
            }
            .summary-label { 
              font-size: 14px; 
              color: #666; 
              margin-bottom: 5px;
            }
            .summary-value { 
              font-size: 18px; 
              font-weight: bold; 
              color: #007AFF;
            }
            .table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
            }
            .table th, .table td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left;
              font-size: 12px;
            }
            .table th { 
              background-color: #007AFF; 
              color: white; 
              font-weight: bold;
            }
            .table tr:nth-child(even) { 
              background-color: #f9f9f9;
            }
            .amount { 
              font-weight: bold; 
              color: #28a745;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Reporte de Pagos</div>
            <div class="subtitle">Sistema de Préstamos</div>
            <div class="subtitle">Período: ${periodoTexto}</div>
            <div class="subtitle">Generado el: ${fechaActual}</div>
          </div>

          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">Total de Pagos</div>
              <div class="summary-value">${totalPagos}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Monto Total</div>
              <div class="summary-value">${formatearMonto(totalGeneral)}</div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Prestatario</th>
                <th>DNI</th>
                <th>ID Préstamo</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              ${pagosFiltrados.map(pago => `
                <tr>
                  <td>${formatearFecha(pago.fecha)}</td>
                  <td>${pago.prestatario_nombre}</td>
                  <td>${pago.prestatario_dni}</td>
                  <td>${pago.id_prestamo}</td>
                  <td class="amount">${formatearMonto(pago.monto)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Este reporte fue generado automáticamente por el Sistema de Préstamos</p>
            <p>Total de registros: ${pagosFiltrados.length}</p>
          </div>
        </body>
        </html>
      `;

      console.log('🔄 Intentando generar PDF con Print.printToFileAsync...');
      
      try {
        // Intentar con Print.printToFileAsync primero
        const printResult = await Print.printToFileAsync({
          html: htmlContent,
          base64: false,
          width: 612,
          height: 792,
          margins: {
            left: 20,
            top: 20,
            right: 20,
            bottom: 20,
          }
        });

        console.log('📄 Resultado de Print:', printResult);

        if (printResult && printResult.uri) {
          console.log('✅ PDF generado exitosamente con Print:', printResult.uri);
          
          // Verificar si el sharing está disponible
          const isAvailable = await Sharing.isAvailableAsync();
          console.log('📤 Sharing disponible:', isAvailable);

          if (isAvailable) {
            await Sharing.shareAsync(printResult.uri, {
              mimeType: 'application/pdf',
              dialogTitle: 'Compartir Reporte de Pagos',
              UTI: 'com.adobe.pdf'
            });
            console.log('✅ PDF compartido exitosamente');
          } else {
            Alert.alert('Éxito', `PDF generado correctamente.\nUbicación: ${printResult.uri}`);
          }
          return;
        }
      } catch (printError) {
        console.log('⚠️ Print.printToFileAsync falló, intentando método alternativo:', printError.message);
      }

      // Método alternativo: crear un archivo HTML temporal
      console.log('🔄 Creando archivo HTML temporal...');
      
      const fileName = `reporte_pagos_${new Date().getTime()}.html`;
      const htmlUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(htmlUri, htmlContent);

      console.log('✅ Archivo HTML creado:', htmlUri);

      // Compartir el archivo HTML
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(htmlUri, {
          mimeType: 'text/html',
          dialogTitle: 'Compartir Reporte de Pagos (HTML)',
          UTI: 'public.html'
        });
        console.log('✅ Archivo HTML compartido exitosamente');
        Alert.alert('Éxito', 'Reporte generado como archivo HTML y compartido');
      } else {
        Alert.alert('Éxito', `Reporte HTML generado.\nUbicación: ${htmlUri}`);
      }

    } catch (error) {
      console.error('💥 Error completo generando reporte:', error);
      console.error('💥 Stack trace:', error.stack);
      Alert.alert('Error', `No se pudo generar el reporte: ${error.message}`);
    }
  };

  const renderPago = ({ item }) => (
    <View style={styles.pagoItem}>
      <View style={styles.pagoHeader}>
        <Text style={styles.pagoFecha}>{formatearFecha(item.fecha)}</Text>
        <Text style={styles.pagoMonto}>{formatearMonto(item.monto)}</Text>
      </View>
      <View style={styles.pagoDetails}>
        <Text style={styles.pagoPrestatario}>
          <Ionicons name="person" size={14} color="#666" /> {item.prestatario_nombre}
        </Text>
        <Text style={styles.pagoDni}>DNI: {item.prestatario_dni}</Text>
        <Text style={styles.pagoId}>Préstamo ID: {item.id_prestamo}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando reportes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Reportes de Pagos</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={cargarPagos}
        >
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Filtros */}
        <View style={styles.filtrosContainer}>
          <Text style={styles.filtrosTitle}>Filtros por Fecha</Text>
          
          <View style={styles.filtrosRow}>
            <View style={styles.fechaInput}>
              <Text style={styles.fechaLabel}>Desde:</Text>
              <TextInput
                style={styles.fechaField}
                value={fechaDesde}
                onChangeText={setFechaDesde}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.fechaInput}>
              <Text style={styles.fechaLabel}>Hasta:</Text>
              <TextInput
                style={styles.fechaField}
                value={fechaHasta}
                onChangeText={setFechaHasta}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.filtrosButtons}>
            <TouchableOpacity style={styles.filtroButton} onPress={filtrarHoy}>
              <Text style={styles.filtroButtonText}>Hoy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filtroButton} onPress={filtrarEstaSemana}>
              <Text style={styles.filtroButtonText}>Esta Semana</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filtroButton} onPress={filtrarEsteMes}>
              <Text style={styles.filtroButtonText}>Este Mes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.limpiarButton} onPress={limpiarFiltros}>
              <Text style={styles.limpiarButtonText}>Limpiar</Text>
            </TouchableOpacity>
          </View>

          {/* Botón de Exportar PDF */}
          <View style={styles.exportContainer}>
            <TouchableOpacity 
              style={[styles.exportButton, pagosFiltrados.length === 0 && styles.exportButtonDisabled]} 
              onPress={generarPDF}
              disabled={pagosFiltrados.length === 0}
            >
              <Ionicons name="document-text" size={20} color="#fff" />
              <Text style={styles.exportButtonText}>Exportar PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Resumen */}
        <View style={styles.resumenContainer}>
          <View style={styles.resumenItem}>
            <Text style={styles.resumenLabel}>Total de Pagos</Text>
            <Text style={styles.resumenValue}>{totalPagos}</Text>
          </View>
          <View style={styles.resumenItem}>
            <Text style={styles.resumenLabel}>Monto Total</Text>
            <Text style={styles.resumenValueMonto}>{formatearMonto(totalGeneral)}</Text>
          </View>
        </View>

        {/* Lista de Pagos */}
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>
            Historial de Pagos {pagosFiltrados.length > 0 && `(${pagosFiltrados.length})`}
          </Text>
          
          {pagosFiltrados.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No hay pagos para mostrar</Text>
              <Text style={styles.emptySubtext}>
                {fechaDesde || fechaHasta ? 'Intenta cambiar los filtros de fecha' : 'No se encontraron pagos registrados'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={pagosFiltrados}
              renderItem={renderPago}
              keyExtractor={(item) => item.id_pago.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  filtrosContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filtrosTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  filtrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  fechaInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  fechaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  fechaField: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  filtrosButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  filtroButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    minWidth: '22%',
    alignItems: 'center',
  },
  filtroButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  limpiarButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    minWidth: '22%',
    alignItems: 'center',
  },
  limpiarButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  exportContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  exportButton: {
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exportButtonDisabled: {
    backgroundColor: '#ccc',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resumenContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resumenItem: {
    flex: 1,
    alignItems: 'center',
  },
  resumenLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  resumenValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  resumenValueMonto: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
  },
  listContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  pagoItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 15,
  },
  pagoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pagoFecha: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  pagoMonto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  pagoDetails: {
    marginLeft: 10,
  },
  pagoPrestatario: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  pagoDni: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  pagoId: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default ReportesPagosScreen;