import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const ArchivadosScreen = () => {
  const [archivados, setArchivados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    totalArchivados: 0,
    montoRecuperado: 0,
    esteMes: 0
  });

  useEffect(() => {
    cargarArchivados();
  }, []);

  const cargarArchivados = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api_postgres.php?action=prestamos_archivados');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setArchivados(data);
        calcularEstadisticas(data);
      } else {
        setArchivados([]);
      }
    } catch (error) {
      console.error('Error cargando archivados:', error);
      Alert.alert('Error', 'No se pudieron cargar los préstamos archivados');
      setArchivados([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calcularEstadisticas = (archivadosData) => {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    
    const esteMes = archivadosData.filter(prestamo => {
      if (!prestamo.fecha_ultimo_pago) return false;
      const fechaArchivado = new Date(prestamo.fecha_ultimo_pago);
      return fechaArchivado >= inicioMes;
    }).length;

    const montoRecuperado = archivadosData.reduce((sum, prestamo) => 
      sum + parseFloat(prestamo.monto_inicial || 0), 0
    );

    setEstadisticas({
      totalArchivados: archivadosData.length,
      montoRecuperado,
      esteMes
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarArchivados();
  };

  const reactivarPrestamo = async (prestamo) => {
    Alert.alert(
      'Reactivar Préstamo',
      `¿Estás seguro de reactivar el préstamo de ${prestamo.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch('http://localhost:8080/api_postgres.php', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  action: 'reactivar_prestamo',
                  id_prestamo: prestamo.id_prestamo
                })
              });

              const result = await response.json();
              
              if (result.success) {
                Alert.alert('Éxito', 'Préstamo reactivado exitosamente');
                cargarArchivados();
              } else {
                Alert.alert('Error', result.error || 'No se pudo reactivar el préstamo');
              }
            } catch (error) {
              console.error('Error reactivando préstamo:', error);
              Alert.alert('Error', 'Error de conexión al reactivar préstamo');
            }
          }
        }
      ]
    );
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(monto || 0);
  };

  const renderArchivado = ({ item }) => (
    <View style={styles.prestamoCard}>
      <View style={styles.prestamoHeader}>
        <View style={styles.prestamoInfo}>
          <Text style={styles.prestamoNombre}>{item.nombre}</Text>
          <Text style={styles.prestamoDni}>DNI: {item.dni}</Text>
        </View>
        <View style={styles.estadoBadge}>
          <Text style={styles.estadoTexto}>✅ ARCHIVADO</Text>
        </View>
      </View>

      <View style={styles.prestamoDetalles}>
        <View style={styles.detalleRow}>
          <Text style={styles.detalleLabel}>Monto Inicial:</Text>
          <Text style={styles.detalleValor}>{formatearMoneda(item.monto_inicial)}</Text>
        </View>
        <View style={styles.detalleRow}>
          <Text style={styles.detalleLabel}>Fecha Inicio:</Text>
          <Text style={styles.detalleValor}>{formatearFecha(item.fecha_inicio)}</Text>
        </View>
        <View style={styles.detalleRow}>
          <Text style={styles.detalleLabel}>Último Pago:</Text>
          <Text style={styles.detalleValor}>{formatearFecha(item.fecha_ultimo_pago)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.reactivarBtn}
        onPress={() => reactivarPrestamo(item)}
      >
        <Ionicons name="refresh" size={16} color="#fff" />
        <Text style={styles.reactivarTexto}>Reactivar</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📁 Préstamos Archivados</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Cargando archivados...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📁 Préstamos Archivados</Text>
      </LinearGradient>

      {/* Estadísticas */}
      <View style={styles.estadisticasContainer}>
        <View style={styles.estadisticaCard}>
          <Text style={styles.estadisticaNumero}>{estadisticas.totalArchivados}</Text>
          <Text style={styles.estadisticaLabel}>Total Archivados</Text>
        </View>
        <View style={styles.estadisticaCard}>
          <Text style={styles.estadisticaNumero}>{formatearMoneda(estadisticas.montoRecuperado)}</Text>
          <Text style={styles.estadisticaLabel}>Monto Recuperado</Text>
        </View>
        <View style={styles.estadisticaCard}>
          <Text style={styles.estadisticaNumero}>{estadisticas.esteMes}</Text>
          <Text style={styles.estadisticaLabel}>Este Mes</Text>
        </View>
      </View>

      {archivados.length > 0 ? (
        <FlatList
          data={archivados}
          renderItem={renderArchivado}
          keyExtractor={(item) => item.id_prestamo.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="archive-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No hay préstamos archivados</Text>
          <Text style={styles.emptySubtitle}>
            Los préstamos que archives aparecerán aquí automáticamente
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={cargarArchivados}>
            <Text style={styles.refreshButtonText}>Actualizar</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 40,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
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
  estadisticasContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  estadisticaCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  estadisticaNumero: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  estadisticaLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  prestamoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prestamoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  prestamoInfo: {
    flex: 1,
  },
  prestamoNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  prestamoDni: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  estadoBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoTexto: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  prestamoDetalles: {
    marginBottom: 15,
  },
  detalleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detalleLabel: {
    fontSize: 14,
    color: '#666',
  },
  detalleValor: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  reactivarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffc107',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    gap: 5,
  },
  reactivarTexto: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  refreshButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ArchivadosScreen;