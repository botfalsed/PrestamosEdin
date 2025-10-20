import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  StyleSheet
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import mobileApi from '../../services/mobileApi';

const HistorialPagosScreen = () => {
  const [pagos, setPagos] = useState([]);
  const [prestatarios, setPrestatarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchDNI, setSearchDNI] = useState('');
  const [selectedPrestatario, setSelectedPrestatario] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando datos del historial...');
      
      // Cargar prestatarios
      const prestatariosData = await mobileApi.getPrestatarios();
      if (Array.isArray(prestatariosData)) {
        setPrestatarios(prestatariosData);
        console.log('✅ Prestatarios cargados:', prestatariosData.length);
      }

      // Cargar todos los pagos - usando el mismo formato que ReportesPagosScreen
      const result = await mobileApi.makeRequest('api_postgres.php?action=pagos-historial');
      
      if (result.success && Array.isArray(result.data)) {
        console.log('✅ Pagos cargados:', result.data.length);
        setPagos(result.data);
      } else if (Array.isArray(result)) {
        // Fallback para respuesta directa como array
        console.log('✅ Pagos cargados (formato directo):', result.length);
        setPagos(result);
      } else {
        console.error('❌ Error cargando pagos:', result);
        setPagos([]);
      }
    } catch (error) {
      console.error('💥 Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
      setPagos([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatearMoneda = (monto) => {
    return `S/. ${parseFloat(monto).toFixed(2)}`;
  };

  const getPrestatarioNombre = (pago) => {
    return pago.prestatario_nombre || 'Desconocido';
  };

  const getPrestatarioDNI = (pago) => {
    return pago.prestatario_dni || '';
  };

  // Filtrar pagos por DNI si hay búsqueda
  const pagosFiltrados = pagos.filter(pago => {
    if (!searchDNI) return true;
    const dni = getPrestatarioDNI(pago);
    return dni.toString().includes(searchDNI);
  });

  // Agrupar pagos por prestatario
  const pagosAgrupados = pagosFiltrados.reduce((acc, pago) => {
    const key = pago.id_prestatario;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(pago);
    return acc;
  }, {});

  // Ordenar pagos por fecha (más recientes primero)
  Object.keys(pagosAgrupados).forEach(key => {
    pagosAgrupados[key].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Cargando historial de pagos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#3b82f6', '#1d4ed8']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Ionicons name="calendar" size={28} color="white" />
          <Text style={styles.headerTitle}>Historial de Pagos</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Consulta las fechas de todos los pagos registrados
        </Text>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Buscador */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por DNI..."
              placeholderTextColor="#9ca3af"
              value={searchDNI}
              onChangeText={setSearchDNI}
              keyboardType="numeric"
            />
            {searchDNI ? (
              <TouchableOpacity onPress={() => setSearchDNI('')}>
                <Ionicons name="close-circle" size={20} color="#6b7280" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Lista de pagos */}
        <View style={styles.contentContainer}>
          {Object.keys(pagosAgrupados).length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No se encontraron pagos</Text>
              <Text style={styles.emptySubtitle}>
                {searchDNI ? 'Intenta con otro DNI' : 'Aún no hay pagos registrados'}
              </Text>
            </View>
          ) : (
            Object.keys(pagosAgrupados).map(idPrestatario => {
              const primerPago = pagosAgrupados[idPrestatario][0]; // Usar el primer pago para obtener los datos del prestatario
              return (
              <View key={idPrestatario} style={styles.prestatarioCard}>
                <View style={styles.prestatarioHeader}>
                  <View style={styles.prestatarioInfo}>
                    <Text style={styles.prestatarioNombre}>
                      {getPrestatarioNombre(primerPago)}
                    </Text>
                    <Text style={styles.prestatarioDNI}>
                      DNI: {getPrestatarioDNI(primerPago)}
                    </Text>
                  </View>
                  <View style={styles.totalPagos}>
                    <Text style={styles.totalPagosText}>
                      {pagosAgrupados[idPrestatario].length} pago{pagosAgrupados[idPrestatario].length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.pagosTimeline}>
                  {pagosAgrupados[idPrestatario].map((pago, index) => (
                    <View key={pago.id_pago} style={styles.pagoItem}>
                      <View style={styles.pagoIndicator}>
                        <View style={styles.pagoCircle} />
                        {index < pagosAgrupados[idPrestatario].length - 1 && (
                          <View style={styles.pagoLine} />
                        )}
                      </View>
                      <View style={styles.pagoContent}>
                        <View style={styles.pagoHeader}>
                          <Text style={styles.pagoFecha}>
                            📅 {formatearFecha(pago.fecha)}
                          </Text>
                          <Text style={styles.pagoMonto}>
                            {formatearMoneda(pago.monto)}
                          </Text>
                        </View>
                        <Text style={styles.pagoSaldo}>
                          Saldo restante: {formatearMoneda(pago.saldo_restante)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  searchBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: '#111827',
    fontSize: 16,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  prestatarioCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  prestatarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  prestatarioInfo: {
    flex: 1,
  },
  prestatarioNombre: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  prestatarioDNI: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  totalPagos: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  totalPagosText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  pagosTimeline: {
    padding: 16,
  },
  pagoItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  pagoIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  pagoCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
  },
  pagoLine: {
    width: 2,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginTop: 4,
  },
  pagoContent: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  pagoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pagoFecha: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  pagoMonto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  pagoSaldo: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default HistorialPagosScreen;