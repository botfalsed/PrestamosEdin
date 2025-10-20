import { Image } from 'expo-image';
import { Platform, Alert, SafeAreaView } from 'react-native';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

export default function ConfiguracionScreen() {

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => {
            // Simplemente navegar al HomeScreen
            router.replace('/WelcomeScreen');
          }
        }
      ]
    );
  };

  const handleFeaturePress = (title: string) => {
    switch (title) {
      case 'Registro de Pagos':
        router.push('/(tabs)/PagosScreen');
        break;
      case 'Refinamiento':
        Alert.alert('Próximamente', 'Esta funcionalidad estará disponible pronto');
        break;
      case 'Sincronización Automática':
        Alert.alert('Sincronización', 'Los datos se sincronizan automáticamente con el servidor');
        break;
      default:
        break;
    }
  };

  const features = [
    {
      icon: 'card-outline',
      title: 'Registro de Pagos',
      description: 'Registra pagos de manera rápida y eficiente',
      color: 'bg-primary-500'
    },
    {
      icon: 'build-outline',
      title: 'Refinamiento',
      description: 'Herramientas avanzadas de optimización',
      color: 'bg-warning-500'
    },
    {
      icon: 'sync-outline',
      title: 'Sincronización Automática',
      description: 'Datos sincronizados con el sistema principal',
      color: 'bg-danger-500'
    }
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <LinearGradient
        colors={['#1e40af', '#3b82f6']}
        style={{ paddingBottom: 24 }}
      >
        <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
          <Text style={{
            color: 'white',
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 4
          }}>
            📊 Panel de Control
          </Text>
          <Text style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: 16
          }}>
            Explora las funcionalidades de la aplicación
          </Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Funcionalidades Principales */}
        <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
          <Text style={{
            color: '#111827',
            fontSize: 18,
            fontWeight: '600',
            marginBottom: 16
          }}>
            Funcionalidades Principales
          </Text>
          <View style={{ gap: 12 }}>
            {features.map((feature, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => handleFeaturePress(feature.title)}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                  borderWidth: 1,
                  borderColor: '#f3f4f6'
                }}
              >
                <View style={{
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: feature.color === 'bg-primary-500' ? '#3b82f6' :
                                   feature.color === 'bg-success-500' ? '#10b981' :
                                   feature.color === 'bg-warning-500' ? '#f59e0b' : '#ef4444',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16
                  }}>
                    <Ionicons name={feature.icon as any} size={24} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      color: '#111827',
                      fontSize: 16,
                      fontWeight: '600',
                      marginBottom: 4
                    }}>
                      {feature.title}
                    </Text>
                    <Text style={{
                      color: '#6b7280',
                      fontSize: 14
                    }}>
                      {feature.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Información de la App */}
        <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
          <Text style={{
            color: '#111827',
            fontSize: 18,
            fontWeight: '600',
            marginBottom: 16
          }}>
            Información de la Aplicación
          </Text>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
            borderWidth: 1,
            borderColor: '#f3f4f6'
          }}>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <View style={{
                width: 80,
                height: 80,
                backgroundColor: '#dbeafe',
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}>
                <Ionicons name="phone-portrait-outline" size={40} color="#3b82f6" />
              </View>
              <Text style={{
                color: '#111827',
                fontSize: 20,
                fontWeight: 'bold',
                marginBottom: 8
              }}>
                PrestamosMobile
              </Text>
              <Text style={{
                color: '#6b7280',
                textAlign: 'center'
              }}>
                Aplicación móvil para cobradores en campo
              </Text>
            </View>

            <View style={{ gap: 16 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#f3f4f6'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
                  <Text style={{
                    color: '#374151',
                    marginLeft: 12,
                    fontWeight: '500'
                  }}>Versión</Text>
                </View>
                <Text style={{ color: '#6b7280' }}>1.0.0</Text>
              </View>

              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#f3f4f6'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="construct-outline" size={20} color="#6b7280" />
                  <Text style={{
                    color: '#374151',
                    marginLeft: 12,
                    fontWeight: '500'
                  }}>Tecnología</Text>
                </View>
                <Text style={{ color: '#6b7280' }}>React Native + Expo</Text>
              </View>

              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="color-palette-outline" size={20} color="#6b7280" />
                  <Text style={{
                    color: '#374151',
                    marginLeft: 12,
                    fontWeight: '500'
                  }}>Diseño</Text>
                </View>
                <Text style={{ color: '#6b7280' }}>Estilos Inline</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Consejos para Cobradores */}
        <View style={{ marginHorizontal: 16, marginBottom: 32 }}>
          <Text style={{
            color: '#111827',
            fontSize: 18,
            fontWeight: '600',
            marginBottom: 16
          }}>
            💡 Consejos para Cobradores
          </Text>
          <View style={{
            backgroundColor: '#eff6ff',
            borderRadius: 16,
            padding: 24,
            borderWidth: 1,
            borderColor: '#bfdbfe'
          }}>
            <View style={{ gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{
                  width: 24,
                  height: 24,
                  backgroundColor: '#3b82f6',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  marginTop: 2
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: '#1e40af',
                    fontWeight: '500',
                    marginBottom: 4
                  }}>
                    Mantén la app actualizada
                  </Text>
                  <Text style={{
                    color: '#1d4ed8',
                    fontSize: 14
                  }}>
                    Sincroniza regularmente para tener los datos más recientes
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{
                  width: 24,
                  height: 24,
                  backgroundColor: '#3b82f6',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  marginTop: 2
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: '#1e40af',
                    fontWeight: '500',
                    marginBottom: 4
                  }}>
                    Verifica los datos antes de registrar
                  </Text>
                  <Text style={{
                    color: '#1d4ed8',
                    fontSize: 14
                  }}>
                    Confirma el monto y el prestatario antes de procesar el pago
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{
                  width: 24,
                  height: 24,
                  backgroundColor: '#3b82f6',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  marginTop: 2
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}>3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: '#1e40af',
                    fontWeight: '500',
                    marginBottom: 4
                  }}>
                    Usa la búsqueda por DNI
                  </Text>
                  <Text style={{
                    color: '#1d4ed8',
                    fontSize: 14
                  }}>
                    Encuentra rápidamente a los prestatarios usando su DNI
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Botón de Archivados */}
        <TouchableOpacity
          style={{
            backgroundColor: '#f59e0b',
            paddingVertical: 15,
            paddingHorizontal: 25,
            borderRadius: 12,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
          onPress={() => router.push('/ArchivadosScreen')}
        >
          <Text style={{
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
            textAlign: 'center',
          }}>
            📁 Ver Préstamos Archivados
          </Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <View style={{
          backgroundColor: 'white',
          marginHorizontal: 24,
          marginTop: 24,
          borderRadius: 16,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4
        }}>
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ef4444',
              paddingVertical: 16,
              paddingHorizontal: 24,
              borderRadius: 12
            }}
          >
            <Ionicons name="log-out-outline" size={24} color="white" />
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '600',
              marginLeft: 12
            }}>
              Cerrar Sesión
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
