import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  Modal,
  SafeAreaView,
  Animated,
  Dimensions
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = 'http://192.168.18.22:8080/api_postgres.php';
const WEBSOCKET_URL = 'ws://192.168.18.22:8081';
const { width } = Dimensions.get('window');

export default function PagosScreen() {
  const [prestamos, setPrestamos] = useState([]);
  const [prestatarios, setPrestatarios] = useState([]);
  const [selectedPrestatario, setSelectedPrestatario] = useState(null);
  const [montoPago, setMontoPago] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchDNI, setSearchDNI] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pagosDetalles, setPagosDetalles] = useState([]);
  const [loadingPagos, setLoadingPagos] = useState(false);
  
  // WebSocket reference
  const wsRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    cargarDatos();
    initWebSocket();
    
    // Iniciar animaciones
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Cleanup WebSocket on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const initWebSocket = () => {
    try {
      // Cerrar conexión anterior si existe
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close();
      }

      wsRef.current = new WebSocket(WEBSOCKET_URL);
      
      wsRef.current.onopen = () => {
        console.log('✅ WebSocket conectado');
        setWsConnected(true);
        
        // Registrar como cobrador
        const registerMessage = {
          type: 'register_collector',
          clientType: 'collector',
          timestamp: new Date().toISOString()
        };
        wsRef.current.send(JSON.stringify(registerMessage));
      };
      
      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket desconectado:', event.code, event.reason);
        setWsConnected(false);
        
        // Solo reconectar si no fue un cierre intencional
        if (event.code !== 1000) {
          setTimeout(() => {
            if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
              console.log('🔄 Intentando reconectar WebSocket...');
              initWebSocket();
            }
          }, 3000);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('❌ Error WebSocket:', error);
        setWsConnected(false);
      };
      
    } catch (error) {
      console.error('❌ Error inicializando WebSocket:', error);
      setWsConnected(false);
    }
  };

  const sendPaymentNotification = (paymentData) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const notification = {
        type: 'payment_notification',
        data: {
          prestatario: paymentData.prestatario,
          monto: paymentData.monto,
          fecha: paymentData.fecha,
          id_prestamo: paymentData.id_prestamo,
          saldo_anterior: paymentData.saldo_anterior,
          saldo_nuevo: paymentData.saldo_nuevo
        },
        timestamp: new Date().toISOString()
      };
      
      wsRef.current.send(JSON.stringify(notification));
      console.log('Notificación de pago enviada:', notification);
    } else {
      console.warn('WebSocket no está conectado, no se pudo enviar la notificación');
    }
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      console.log('Cargando datos...');
      
      const [prestamosRes, prestatariosRes] = await Promise.all([
        axios.get(`${API_URL}?action=prestamos`),
        axios.get(`${API_URL}?action=prestatarios`)
      ]);

      console.log('Datos cargados:', {
        prestamos: prestamosRes.data.length,
        prestatarios: prestatariosRes.data.length
      });

      if (Array.isArray(prestamosRes.data)) {
        setPrestamos(prestamosRes.data);
      }

      if (Array.isArray(prestatariosRes.data)) {
        setPrestatarios(prestatariosRes.data);
      }
    } catch (error) {
      console.error('Error:', error.message);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const cargarPagosPrestatario = async (idPrestatario) => {
    try {
      setLoadingPagos(true);
      const response = await axios.get(`${API_URL}?action=pagos_prestatario&id_prestatario=${idPrestatario}`);
      
      if (response.data.success) {
        setPagosDetalles(response.data.pagos || []);
      } else {
        setPagosDetalles([]);
      }
    } catch (error) {
      console.error('Error cargando pagos:', error);
      setPagosDetalles([]);
    } finally {
      setLoadingPagos(false);
    }
  };

  const verDetallesPago = async (prestatario) => {
    setSelectedPrestatario(prestatario);
    await cargarPagosPrestatario(prestatario.id_prestatario);
    setModalVisible(true);
  };

  const handlePago = async () => {
    if (!selectedPrestatario || !montoPago) {
      Alert.alert('Error', 'Selecciona un prestatario y ingresa el monto');
      return;
    }

    const monto = parseFloat(montoPago);
    if (isNaN(monto) || monto <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }

    // Encontrar el préstamo activo del prestatario
    const prestamoActivo = prestamos.find(p => 
      p.id_prestatario === selectedPrestatario.id_prestatario && 
      parseFloat(p.saldo_pendiente) > 0
    );

    if (!prestamoActivo) {
      Alert.alert('Error', 'Este prestatario no tiene préstamos activos');
      return;
    }

    if (monto > parseFloat(prestamoActivo.saldo_pendiente)) {
      Alert.alert('Error', `El monto excede el saldo pendiente: S/. ${prestamoActivo.saldo_pendiente}`);
      return;
    }

    try {
      setLoading(true);
      
      const saldoAnterior = parseFloat(prestamoActivo.saldo_pendiente);
      const saldoNuevo = saldoAnterior - monto;
      
      const response = await axios.post(`${API_URL}?action=pago`, {
        id_prestamo: parseInt(prestamoActivo.id_prestamo),
        monto_pago: monto,
      });

      console.log('Respuesta pago:', response.data);

      if (response.data.success) {
        // Enviar notificación WebSocket
        sendPaymentNotification({
          prestatario: {
            nombre: selectedPrestatario.nombre,
            dni: selectedPrestatario.dni,
            id: selectedPrestatario.id_prestatario
          },
          monto: monto,
          fecha: new Date().toISOString(),
          id_prestamo: prestamoActivo.id_prestamo,
          saldo_anterior: saldoAnterior,
          saldo_nuevo: saldoNuevo
        });

        Alert.alert(
          '✅ Pago Exitoso',
          `Prestatario: ${selectedPrestatario.nombre}\nMonto: S/. ${monto.toFixed(2)}\nFecha: ${new Date().toLocaleDateString('es-PE')}\n${wsConnected ? '📡 Notificación enviada al dashboard' : '⚠️ Sin conexión al dashboard'}`
        );

        setMontoPago('');
        setSelectedPrestatario(null);
        setTimeout(() => cargarDatos(), 1000);
      } else {
        Alert.alert('Error', response.data.error || 'Error al procesar el pago');
      }
    } catch (error) {
      console.error('Error:', error.message);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar prestatarios con préstamos activos
  const prestatariosConPrestamos = prestatarios.filter(prestatario => 
    prestamos.some(p => 
      p.id_prestatario === prestatario.id_prestatario && 
      parseFloat(p.saldo_pendiente) > 0
    )
  );

  // Filtrar por DNI
  const prestatariosFiltrados = searchDNI 
    ? prestatariosConPrestamos.filter(p => p.dni.includes(searchDNI))
    : prestatariosConPrestamos;

  // Limitar la lista si no se muestra todo
  const prestatariosMostrados = showAll ? prestatariosFiltrados : prestatariosFiltrados.slice(0, 5);

  const getPrestamoActivo = (prestatario) => {
    return prestamos.find(p => 
      p.id_prestatario === prestatario.id_prestatario && 
      parseFloat(p.saldo_pendiente) > 0
    );
  };

  const formatearMoneda = (monto) => {
    return `S/. ${parseFloat(monto || 0).toFixed(2)}`;
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-PE');
  };

  if (loading && prestamos.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingContainer}
        >
          <Animated.View style={[styles.loadingContent, { opacity: fadeAnim }]}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Cargando datos...</Text>
          </Animated.View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradientHeader}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.title}>💳 Registrar Pago</Text>
          <Text style={styles.subtitle}>Selecciona un prestatario y registra su pago</Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Buscador */}
        <Animated.View style={[styles.searchContainer, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['#fff', '#f8f9fa']}
            style={styles.searchGradient}
          >
            <Ionicons name="search" size={20} color="#667eea" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por DNI..."
              placeholderTextColor="#adb5bd"
              value={searchDNI}
              onChangeText={setSearchDNI}
              keyboardType="numeric"
            />
          </LinearGradient>
        </Animated.View>

        {/* Lista de Prestatarios */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Prestatarios Activos ({prestatariosConPrestamos.length})
            </Text>
            {prestatariosFiltrados.length > 5 && (
              <TouchableOpacity onPress={() => setShowAll(!showAll)}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.verTodosGradient}
                >
                  <Text style={styles.verTodos}>
                    {showAll ? 'Ver menos' : `Ver todos (${prestatariosFiltrados.length})`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {prestatariosMostrados.length > 0 ? (
            prestatariosMostrados.map((prestatario, index) => {
              const prestamo = getPrestamoActivo(prestatario);
              const isSelected = selectedPrestatario?.id_prestatario === prestatario.id_prestatario;
              
              return (
                <Animated.View 
                  key={prestatario.id_prestatario}
                  style={[
                    styles.prestatarioCard,
                    { 
                      opacity: fadeAnim,
                      transform: [{ translateX: slideAnim }]
                    }
                  ]}
                >
                  <LinearGradient
                    colors={isSelected ? ['#667eea', '#764ba2'] : ['#fff', '#f8f9fa']}
                    style={[styles.cardGradient, isSelected && styles.selectedCardGradient]}
                  >
                    <TouchableOpacity 
                      style={styles.prestatarioInfo}
                      onPress={() => setSelectedPrestatario(isSelected ? null : prestatario)}
                    >
                      <View style={styles.prestatarioHeader}>
                        <Text style={[styles.prestatarioNombre, isSelected && styles.selectedText]}>
                          {prestatario.nombre}
                        </Text>
                        <Text style={[styles.prestatarioDNI, isSelected && styles.selectedSubText]}>
                          DNI: {prestatario.dni}
                        </Text>
                      </View>
                      
                      {prestamo && (
                        <View style={styles.prestamoInfo}>
                          <Text style={[styles.saldoText, isSelected && styles.selectedSubText]}>
                            Saldo: <Text style={[styles.saldoMonto, isSelected && styles.selectedAmount]}>
                              {formatearMoneda(prestamo.saldo_pendiente)}
                            </Text>
                          </Text>
                          <Text style={[styles.totalText, isSelected && styles.selectedSubText]}>
                            Total: {formatearMoneda(prestamo.monto_total)}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.detallesButton, isSelected && styles.selectedDetallesButton]}
                      onPress={() => verDetallesPago(prestatario)}
                    >
                      <Ionicons 
                        name="eye" 
                        size={16} 
                        color={isSelected ? "#fff" : "#667eea"} 
                      />
                      <Text style={[styles.detallesText, isSelected && styles.selectedDetallesText]}>
                        Ver
                      </Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </Animated.View>
              );
            })
          ) : (
            <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
              <LinearGradient
                colors={['#fff', '#f8f9fa']}
                style={styles.emptyGradient}
              >
                <Ionicons name="people-outline" size={50} color="#adb5bd" />
                <Text style={styles.emptyText}>
                  {searchDNI ? 'No se encontraron prestatarios con ese DNI' : 'No hay prestatarios con préstamos activos'}
                </Text>
              </LinearGradient>
            </Animated.View>
          )}
        </Animated.View>

        {/* Formulario de Pago */}
        {selectedPrestatario && (
          <Animated.View style={[styles.pagoSection, { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }]}>
            <LinearGradient
              colors={['#fff', '#f8fbff']}
              style={styles.pagoGradient}
            >
              <View style={styles.selectedHeader}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.selectedHeaderGradient}
                >
                  <Text style={styles.selectedTitle}>Prestatario Seleccionado</Text>
                  <Text style={styles.selectedName}>{selectedPrestatario.nombre}</Text>
                  <Text style={styles.selectedDNI}>DNI: {selectedPrestatario.dni}</Text>
                </LinearGradient>
              </View>

              <View style={styles.montoContainer}>
                <Text style={styles.montoLabel}>💰 Monto a Pagar (S/.)</Text>
                <LinearGradient
                  colors={['#f8f9fa', '#fff']}
                  style={styles.montoInputGradient}
                >
                  <TextInput
                    style={styles.montoInput}
                    keyboardType="decimal-pad"
                    value={montoPago}
                    onChangeText={setMontoPago}
                    placeholder="0.00"
                    placeholderTextColor="#adb5bd"
                  />
                </LinearGradient>
              </View>

              <TouchableOpacity 
                style={[
                  styles.pagarButton,
                  (!montoPago || loading) && styles.pagarButtonDisabled
                ]}
                onPress={handlePago}
                disabled={!montoPago || loading}
              >
                <LinearGradient
                  colors={(!montoPago || loading) ? ['#adb5bd', '#6c757d'] : ['#28a745', '#20c997']}
                  style={styles.pagarButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="card" size={20} color="#fff" />
                      <Text style={styles.pagarButtonText}>Procesar Pago</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Botón Recargar */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity 
            style={styles.recargarButton}
            onPress={cargarDatos}
            disabled={loading}
          >
            <LinearGradient
              colors={['#f8f9fa', '#e9ecef']}
              style={styles.recargarGradient}
            >
              <Ionicons name="refresh" size={20} color="#667eea" />
              <Text style={styles.recargarText}>Actualizar Datos</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Modal de Detalles de Pagos */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📅 Historial de Pagos</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedPrestatario && (
              <View style={styles.modalPrestatario}>
                <Text style={styles.modalNombre}>{selectedPrestatario.nombre}</Text>
                <Text style={styles.modalDNI}>DNI: {selectedPrestatario.dni}</Text>
              </View>
            )}

            <ScrollView style={styles.pagosList}>
              {loadingPagos ? (
                <ActivityIndicator size="small" color="#4A90E2" />
              ) : pagosDetalles.length > 0 ? (
                pagosDetalles.map((pago, index) => (
                  <View key={index} style={styles.pagoItem}>
                    <View style={styles.pagoHeader}>
                      <Ionicons name="checkmark-circle" size={20} color="#28a745" />
                      <Text style={styles.pagoFecha}>{formatearFecha(pago.fecha)}</Text>
                    </View>
                    <Text style={styles.pagoMonto}>{formatearMoneda(pago.monto)}</Text>
                    <Text style={styles.pagoDia}>Día {index + 1}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.noPagos}>
                  <Ionicons name="calendar-outline" size={40} color="#ccc" />
                  <Text style={styles.noPagosText}>No hay pagos registrados</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  gradientHeader: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '400',
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: 25,
    marginTop: -15,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  verTodosGradient: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  verTodos: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  prestatarioCard: {
    marginBottom: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
  },
  selectedCardGradient: {
    shadowColor: '#667eea',
    shadowOpacity: 0.3,
  },
  prestatarioInfo: {
    flex: 1,
  },
  prestatarioHeader: {
    marginBottom: 10,
  },
  prestatarioNombre: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  selectedText: {
    color: '#fff',
  },
  prestatarioDNI: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  selectedSubText: {
    color: 'rgba(255,255,255,0.9)',
  },
  prestamoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saldoText: {
    fontSize: 14,
    color: '#6c757d',
  },
  saldoMonto: {
    fontWeight: '700',
    color: '#dc3545',
    fontSize: 15,
  },
  selectedAmount: {
    color: '#fff',
  },
  totalText: {
    fontSize: 12,
    color: '#adb5bd',
    fontWeight: '500',
  },
  detallesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginLeft: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
  },
  selectedDetallesButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  detallesText: {
    color: '#667eea',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '600',
  },
  selectedDetallesText: {
    color: '#fff',
  },
  emptyState: {
    marginHorizontal: 5,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  emptyGradient: {
    alignItems: 'center',
    padding: 50,
    borderRadius: 20,
  },
  emptyText: {
    marginTop: 15,
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  pagoSection: {
    marginBottom: 25,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  pagoGradient: {
    padding: 25,
    borderRadius: 25,
  },
  selectedHeader: {
    marginBottom: 25,
  },
  selectedHeaderGradient: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  selectedTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  selectedDNI: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  montoContainer: {
    marginBottom: 25,
  },
  montoLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  montoInputGradient: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  montoInput: {
    padding: 20,
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  pagarButton: {
    borderRadius: 20,
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  pagarButtonGradient: {
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagarButtonDisabled: {
    shadowOpacity: 0.1,
  },
  pagarButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  recargarButton: {
    marginBottom: 25,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recargarGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    borderRadius: 15,
  },
  recargarText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalPrestatario: {
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  modalNombre: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  modalDNI: {
    fontSize: 15,
    color: '#6c757d',
    fontWeight: '500',
  },
  pagosList: {
    maxHeight: 350,
  },
  pagoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  pagoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pagoFecha: {
    marginLeft: 12,
    fontSize: 15,
    color: '#2c3e50',
    fontWeight: '600',
  },
  pagoMonto: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#28a745',
  },
  pagoDia: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 12,
    fontWeight: '500',
  },
  noPagos: {
    alignItems: 'center',
    padding: 50,
  },
  noPagosText: {
    marginTop: 15,
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
  },
  modalCloseButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});