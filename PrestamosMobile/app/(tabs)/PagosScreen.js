import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  SafeAreaView,
  Alert,
  Animated,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mobileApi from '../../services/mobileApi';
import storageService from '../../services/storageService';
import reportService from '../../services/reportService';
import { useStats } from '../../contexts/StatsContext';
import useRealtimeUpdates from '../../hooks/useRealtimeUpdates';

const { width, height } = Dimensions.get('window');

export default function PagosScreen() {
  // Estados principales
  const [prestamos, setPrestamos] = useState([]);
  const [prestatarios, setPrestatarios] = useState([]);
  const [selectedPrestatario, setSelectedPrestatario] = useState(null);
  const [montoPago, setMontoPago] = useState('');
  const [searchDNI, setSearchDNI] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Hook de estadísticas
  const { updateStatsAfterPayment } = useStats();

  // Hook de actualizaciones en tiempo real
  const {
    connectionStatus,
    lastUpdate
  } = useRealtimeUpdates({
    autoConnect: true,
    reconnectOnForeground: true,
    onPagoRegistrado: (data) => {
      console.log('🎯 [PagosScreen] Pago registrado recibido:', data);
      // Recargar datos cuando se registra un pago
      loadData();
    },
    onPrestamoCreado: (data) => {
      console.log('🎯 [PagosScreen] Préstamo creado recibido:', data);
      // Recargar datos cuando se crea un préstamo
      loadData();
    },
    onPrestamoActualizado: (data) => {
      console.log('🎯 [PagosScreen] Préstamo actualizado recibido:', data);
      // Recargar datos cuando se actualiza un préstamo
      loadData();
    }
  });

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // WebSocket (legacy - mantenido para compatibilidad)
  const ws = useRef(null);

  useEffect(() => {
    initializeScreen();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const initializeScreen = async () => {
    await loadData();
    initializeWebSocket();
    startAnimations();
    
    // Inicializar el servicio de reportes automáticos
    await reportService.initialize();
  };

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Primero intentar cargar datos del almacenamiento local
      const hasStoredData = await storageService.hasStoredData();
      
      if (hasStoredData) {
        console.log('📱 [PAGOS] Cargando datos desde almacenamiento local...');
        const [storedPrestamos, storedPrestatarios] = await Promise.all([
          storageService.getPrestamos(),
          storageService.getPrestatarios()
        ]);
        
        if (storedPrestamos.length > 0) {
          setPrestamos(storedPrestamos);
          console.log('✅ [PAGOS] Préstamos cargados desde storage:', storedPrestamos.length);
        }
        
        if (storedPrestatarios.length > 0) {
          setPrestatarios(storedPrestatarios);
          console.log('✅ [PAGOS] Prestatarios cargados desde storage:', storedPrestatarios.length);
        }
      }
      
      // Luego intentar actualizar desde la API
      try {
        console.log('🌐 [PAGOS] Actualizando datos desde API...');
        
        const [prestamosData, prestatariosData] = await Promise.all([
          mobileApi.getPrestamos(),
          mobileApi.getPrestatarios()
        ]);

        console.log('📊 [PAGOS] Respuesta completa préstamos:', prestamosData);
        console.log('👥 [PAGOS] Respuesta completa prestatarios:', prestatariosData);

        // Actualizar préstamos
        if (Array.isArray(prestamosData)) {
          setPrestamos(prestamosData);
          await storageService.savePrestamos(prestamosData);
          console.log('✅ [PAGOS] Préstamos actualizados desde API:', prestamosData.length);
        } else {
          console.error('❌ [PAGOS] Error: préstamos no es un array:', prestamosData);
          if (!hasStoredData) {
            Alert.alert('Error', 'No se pudieron cargar los préstamos');
            setPrestamos([]);
          }
        }

        // Actualizar prestatarios
        if (Array.isArray(prestatariosData)) {
          setPrestatarios(prestatariosData);
          await storageService.savePrestatarios(prestatariosData);
          console.log('✅ [PAGOS] Prestatarios actualizados desde API:', prestatariosData.length);
        } else {
          console.error('❌ [PAGOS] Error: prestatarios no es un array:', prestatariosData);
          if (!hasStoredData) {
            Alert.alert('Error', 'No se pudieron cargar los prestatarios');
            setPrestatarios([]);
          }
        }
        
      } catch (apiError) {
        console.error('❌ [PAGOS] Error conectando con API:', apiError);
        
        if (!hasStoredData) {
          Alert.alert(
            'Sin conexión', 
            'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
          );
        } else {
          console.log('📱 [PAGOS] Usando datos almacenados localmente');
        }
      }

    } catch (error) {
      console.error('❌ [PAGOS] Error general cargando datos:', error);
      Alert.alert('Error', 'Error inesperado al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const initializeWebSocket = () => {
    try {
      console.log('🔌 [WEBSOCKET] Intentando conectar a WebSocket...');
      // Comentar WebSocket temporalmente para evitar errores
      /*
      ws.current = new WebSocket('ws://192.168.1.100:8080');
      
      ws.current.onopen = () => {
        console.log('✅ [WEBSOCKET] Conectado');
      };
      
      ws.current.onmessage = (event) => {
        console.log('📨 [WEBSOCKET] Mensaje recibido:', event.data);
        loadData(); // Recargar datos cuando hay cambios
      };
      
      ws.current.onerror = (error) => {
        console.error('❌ [WEBSOCKET] Error:', error);
      };
      
      ws.current.onclose = () => {
        console.log('🔌 [WEBSOCKET] Desconectado');
      };
      */
      console.log('⚠️ [WEBSOCKET] WebSocket deshabilitado temporalmente');
    } catch (error) {
      console.error('❌ [WEBSOCKET] Error inicializando:', error);
    }
  };

  // Funciones auxiliares
  const getPrestamoActivo = (prestatario) => {
    const prestamo = prestamos.find(p => 
      p.id_prestatario === prestatario.id_prestatario && 
      p.estado === 'activo'
    );
    console.log(`🔍 [FILTRO] Buscando préstamo activo para ${prestatario.nombre} (ID: ${prestatario.id_prestatario}):`, prestamo);
    return prestamo;
  };

  const prestatariosConPrestamos = prestatarios.filter(p => {
    const tienePrestamo = getPrestamoActivo(p);
    console.log(`✅ [FILTRO] ${p.nombre} tiene préstamo activo:`, !!tienePrestamo);
    return tienePrestamo;
  });

  console.log('📊 [FILTRO] Total prestatarios:', prestatarios.length);
  console.log('📊 [FILTRO] Total préstamos:', prestamos.length);
  console.log('📊 [FILTRO] Prestatarios con préstamos activos:', prestatariosConPrestamos.length);

  const prestatariosFiltrados = prestatariosConPrestamos.filter(prestatario =>
    searchDNI === '' || prestatario.dni.includes(searchDNI)
  );

  const prestatariosMostrados = showAll ? prestatariosFiltrados : prestatariosFiltrados.slice(0, 5);

  const handleRegistrarPago = async () => {
    console.log('🚀 [PAGOS] INICIANDO PAGO');
    
    if (!selectedPrestatario || !montoPago) {
      console.log('❌ [PAGOS] Falta prestatario o monto');
      Alert.alert('Error', 'Selecciona un prestatario e ingresa el monto');
      return;
    }

    const monto = parseFloat(montoPago);
    if (isNaN(monto) || monto <= 0) {
      console.log('❌ [PAGOS] Monto inválido');
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }

    setProcessingPayment(true);

    try {
      const prestamo = getPrestamoActivo(selectedPrestatario);
      
      if (!prestamo) {
        console.log('❌ [PAGOS] No se encontró préstamo activo');
        Alert.alert('Error', 'No se encontró un préstamo activo para este prestatario');
        setProcessingPayment(false);
        return;
      }
      
      // Manejar usuario temporal para testing
      let user = { id: 1, nombre: 'Usuario Test' }; // Usuario por defecto
      
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          user = JSON.parse(userData);
        }
      } catch (error) {
        console.log('⚠️ [PAGOS] Usando usuario temporal');
      }

      const pagoData = {
        id_prestamo: prestamo.id_prestamo,
        monto: monto,
        cobrador_id: user.id,
        fecha: new Date().toISOString().split('T')[0]
      };
      
      console.log('🌐 [PAGOS] Enviando pago:', pagoData);

      const result = await mobileApi.registrarPago(pagoData);
      
      console.log('📥 [PAGOS] Respuesta servidor:', result);

      if (result.success) {
        console.log('✅ [PAGOS] Pago exitoso');
        
        // Actualizar estadísticas inmediatamente
        updateStatsAfterPayment(monto);
        
        // Actualizar saldo localmente
        const prestamoIndex = prestamos.findIndex(p => p.id_prestamo === prestamo.id_prestamo);
        if (prestamoIndex !== -1) {
          const nuevoPrestamo = { ...prestamos[prestamoIndex] };
          nuevoPrestamo.saldo_pendiente = parseFloat(nuevoPrestamo.saldo_pendiente) - monto;
          
          const nuevosPrestamos = [...prestamos];
          nuevosPrestamos[prestamoIndex] = nuevoPrestamo;
          setPrestamos(nuevosPrestamos);
          
          // Guardar préstamos actualizados en almacenamiento local
          await storageService.savePrestamos(nuevosPrestamos);
        }
        
        // Guardar el pago en el almacenamiento local
        const nuevoPago = {
          id_prestamo: prestamo.id_prestamo,
          monto: monto,
          fecha_pago: new Date().toISOString(),
          cobrador_id: user.id,
          prestatario_nombre: selectedPrestatario.nombre
        };
        
        const pagosActuales = await storageService.getPagos();
        pagosActuales.push(nuevoPago);
        await storageService.savePagos(pagosActuales);
        
        // Verificar si está completamente pagado
        const saldoActual = parseFloat(prestamo.saldo_pendiente);
        if (saldoActual - monto <= 0) {
          console.log('🎉 [PAGOS] PRÉSTAMO COMPLETADO');
          Alert.alert(
            'Préstamo Completado',
            `El préstamo de ${selectedPrestatario.nombre} ha sido completamente pagado. ¿Deseas archivarlo?`,
            [
              { text: 'No', style: 'cancel' },
              { 
                text: 'Archivar', 
                onPress: () => archivarPrestamo(prestamo)
              }
            ]
          );
        } else {
          Alert.alert(
            'Pago Registrado', 
            `💰 Monto: S/ ${monto.toFixed(2)}\n📅 Fecha: ${new Date().toLocaleDateString()}\n👤 Cliente: ${selectedPrestatario.nombre}`,
            [{ text: 'OK' }]
          );
        }
        
        setMontoPago('');
        setSelectedPrestatario(null);
        setModalVisible(false);
        await loadData();
        console.log('✅ [PAGOS] PROCESO COMPLETADO');
      } else {
        const errorMessage = result.error || result.message || 'Error desconocido';
        console.error('❌ [PAGOS] Error servidor:', errorMessage);
        Alert.alert('Error', `Error al registrar el pago: ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ [PAGOS] EXCEPCIÓN:', error.message);
      Alert.alert('Error', 'No se pudo registrar el pago. Revisa la conexión.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const archivarPrestamo = async (prestamo) => {
    try {
      console.log('📁 [ARCHIVO] Archivando préstamo:', prestamo.id_prestamo);
      
      const result = await mobileApi.makeRequest('api_postgres.php', {
        method: 'POST',
        body: JSON.stringify({
          action: 'archivar_prestamo',
          id_prestamo: prestamo.id_prestamo
        })
      });

      if (result.success) {
        console.log('✅ [ARCHIVO] Préstamo archivado exitosamente');
        Alert.alert('Éxito', 'Préstamo archivado correctamente');
        loadData(); // Recargar datos para actualizar la lista
      } else {
        console.error('❌ [ARCHIVO] Error:', result.error);
        Alert.alert('Error', result.error || 'No se pudo archivar el préstamo');
      }
    } catch (error) {
      console.error('❌ [ARCHIVO] Error de conexión:', error);
      Alert.alert('Error', 'Error de conexión al archivar préstamo');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Pantalla de carga
  if (loading && prestamos.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient
          colors={['#1e40af', '#3b82f6', '#60a5fa']}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Animated.View 
            style={{ 
              opacity: fadeAnim,
              alignItems: 'center'
            }}
          >
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{
              color: 'white',
              fontSize: 18,
              marginTop: 16,
              fontWeight: '500'
            }}>
              Cargando datos...
            </Text>
          </Animated.View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <LinearGradient
        colors={['#1e40af', '#3b82f6']}
        style={{ paddingBottom: 24 }}
      >
        <Animated.View 
          style={{ 
            opacity: fadeAnim, 
            transform: [{ translateY: slideAnim }],
            paddingHorizontal: 24,
            paddingTop: 16
          }}
        >
          <Text style={{
            color: 'white',
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 4
          }}>
            💳 Registrar Pago
          </Text>
          <Text style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: 16
          }}>
            Selecciona un prestatario y registra su pago
          </Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Buscador */}
        <Animated.View 
          style={{ 
            opacity: fadeAnim,
            marginHorizontal: 16,
            marginTop: 16,
            marginBottom: 24
          }}
        >
          <View style={{
            backgroundColor: 'white',
            borderRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
            borderWidth: 1,
            borderColor: '#f3f4f6'
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12
            }}>
              <Ionicons name="search" size={20} color="#6b7280" />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 12,
                  color: '#111827',
                  fontSize: 16
                }}
                placeholder="Buscar por DNI..."
                placeholderTextColor="#9ca3af"
                value={searchDNI}
                onChangeText={setSearchDNI}
                keyboardType="numeric"
              />
              {searchDNI.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setSearchDNI('')}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="close-circle" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Lista de Prestatarios */}
        <Animated.View 
          style={{ 
            opacity: fadeAnim,
            marginHorizontal: 16
          }}
        >
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <Text style={{
              color: '#111827',
              fontSize: 18,
              fontWeight: '600'
            }}>
              Prestatarios Activos ({prestatariosConPrestamos.length})
            </Text>
            {prestatariosFiltrados.length > 5 && (
              <TouchableOpacity 
                onPress={() => setShowAll(!showAll)}
                style={{
                  backgroundColor: '#3b82f6',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 20
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: 14,
                  fontWeight: '500'
                }}>
                  {showAll ? 'Ver menos' : `Ver todos (${prestatariosFiltrados.length})`}
                </Text>
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
                  style={{
                    opacity: fadeAnim,
                    transform: [{ translateX: slideAnim }],
                    marginBottom: 12
                  }}
                >
                  <TouchableOpacity 
                    onPress={() => setSelectedPrestatario(isSelected ? null : prestatario)}
                    style={{
                      borderRadius: 16,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 2,
                      borderWidth: 1,
                      backgroundColor: isSelected ? '#eff6ff' : 'white',
                      borderColor: isSelected ? '#bfdbfe' : '#f3f4f6'
                    }}
                  >
                    <View style={{ padding: 16 }}>
                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 12
                      }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: isSelected ? '#1d4ed8' : '#111827'
                          }}>
                            {prestatario.nombre}
                          </Text>
                          <Text style={{
                            fontSize: 14,
                            color: isSelected ? '#2563eb' : '#6b7280'
                          }}>
                            DNI: {prestatario.dni}
                          </Text>
                        </View>
                        <View style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          borderWidth: 2,
                          backgroundColor: isSelected ? '#3b82f6' : 'transparent',
                          borderColor: isSelected ? '#3b82f6' : '#d1d5db',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={14} color="white" />
                          )}
                        </View>
                      </View>
                      
                      {prestamo && (
                        <View style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: 12,
                          padding: 12
                        }}>
                          <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8
                          }}>
                            <Text style={{
                              color: '#374151',
                              fontWeight: '500'
                            }}>
                              Monto Prestado:
                            </Text>
                            <Text style={{
                              color: '#059669',
                              fontWeight: 'bold'
                            }}>
                              S/ {prestamo.monto_inicial}
                            </Text>
                          </View>
                          <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8
                          }}>
                            <Text style={{
                              color: '#374151',
                              fontWeight: '500'
                            }}>
                              Saldo Pendiente:
                            </Text>
                            <Text style={{
                              color: '#d97706',
                              fontWeight: 'bold'
                            }}>
                              S/ {prestamo.saldo_pendiente}
                            </Text>
                          </View>
                          <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <Text style={{
                              color: '#374151',
                              fontWeight: '500'
                            }}>
                              Fecha Préstamo:
                            </Text>
                            <Text style={{
                              color: '#6b7280'
                            }}>
                              {new Date(prestamo.fecha_inicio).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          ) : (
            <View style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 32,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
              borderWidth: 1,
              borderColor: '#f3f4f6'
            }}>
              <Ionicons name="search-outline" size={48} color="#9ca3af" />
              <Text style={{
                color: '#6b7280',
                fontSize: 18,
                fontWeight: '500',
                marginTop: 16,
                marginBottom: 8
              }}>
                No se encontraron prestatarios
              </Text>
              <Text style={{
                color: '#9ca3af',
                textAlign: 'center'
              }}>
                {searchDNI ? 'Intenta con otro DNI' : 'No hay prestatarios activos'}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Botón de Registrar Pago */}
        {selectedPrestatario && (
          <Animated.View 
            style={{ 
              opacity: fadeAnim,
              marginHorizontal: 16,
              marginTop: 24,
              marginBottom: 32
            }}
          >
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={{
                borderRadius: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 8
              }}
            >
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  borderRadius: 16
                }}
              >
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Ionicons name="card-outline" size={24} color="white" />
                  <Text style={{
                    color: 'white',
                    fontSize: 18,
                    fontWeight: '600',
                    marginLeft: 8
                  }}>
                    Registrar Pago
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* Modal de Pago */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}>
          <View style={{
            backgroundColor: 'white',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            maxHeight: 384
          }}>
            <View style={{
              width: 48,
              height: 4,
              backgroundColor: '#d1d5db',
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 24
            }} />
            
            <Text style={{
              color: '#111827',
              fontSize: 20,
              fontWeight: 'bold',
              marginBottom: 8,
              textAlign: 'center'
            }}>
              Registrar Pago
            </Text>
            
            {selectedPrestatario && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  color: '#6b7280',
                  textAlign: 'center',
                  marginBottom: 8
                }}>
                  Para: {selectedPrestatario.nombre}
                </Text>
                
                {/* Mostrar información del préstamo activo */}
                {(() => {
                  const prestamo = getPrestamoActivo(selectedPrestatario);
                  return prestamo ? (
                    <View style={{
                      backgroundColor: '#f3f4f6',
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 8
                    }}>
                      <Text style={{ color: '#374151', fontSize: 12, marginBottom: 4 }}>
                        💰 Saldo Pendiente: <Text style={{ fontWeight: 'bold', color: '#dc2626' }}>
                          S/. {parseFloat(prestamo.saldo_pendiente).toFixed(2)}
                        </Text>
                      </Text>
                      <Text style={{ color: '#374151', fontSize: 12, marginBottom: 4 }}>
                        📅 Fecha Inicio: {new Date(prestamo.fecha_inicio).toLocaleDateString()}
                      </Text>
                      <Text style={{ color: '#374151', fontSize: 12 }}>
                        ⏰ Vencimiento: {new Date(prestamo.fecha_ultimo_pago).toLocaleDateString()}
                      </Text>
                    </View>
                  ) : null;
                })()}
              </View>
            )}

            <View style={{ marginBottom: 24 }}>
              <Text style={{
                color: '#374151',
                fontWeight: '500',
                marginBottom: 8
              }}>
                Monto del Pago
              </Text>
              <View style={{
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e5e7eb'
              }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 16
                }}>
                  <Text style={{
                    color: '#6b7280',
                    fontSize: 18,
                    fontWeight: '500',
                    marginRight: 8
                  }}>S/</Text>
                  <TextInput
                    style={{
                      flex: 1,
                      color: '#111827',
                      fontSize: 18,
                      fontWeight: '500'
                    }}
                    placeholder="0.00"
                    placeholderTextColor="#9ca3af"
                    value={montoPago}
                    onChangeText={setMontoPago}
                    keyboardType="numeric"
                    autoFocus={true}
                  />
                </View>
              </View>
            </View>

            <View style={{
              flexDirection: 'row',
              gap: 12
            }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#f3f4f6',
                  paddingVertical: 12,
                  borderRadius: 12
                }}
              >
                <Text style={{
                  color: '#374151',
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleRegistrarPago}
                disabled={processingPayment}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  opacity: processingPayment ? 0.7 : 1
                }}
              >
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  style={{
                    paddingVertical: 12,
                    borderRadius: 12
                  }}
                >
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {processingPayment ? (
                      <>
                        <ActivityIndicator size="small" color="white" />
                        <Text style={{
                          color: 'white',
                          fontWeight: '500',
                          marginLeft: 8
                        }}>
                          Procesando...
                        </Text>
                      </>
                    ) : (
                      <Text style={{
                        color: 'white',
                        fontWeight: '500'
                      }}>
                        Confirmar Pago
                      </Text>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}