import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import authService from '../services/authService';

export default function Index() {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Verificar si hay una sesión activa
      const isAuthenticated = await authService.isAuthenticated;
      
      if (isAuthenticated) {
        // Si está autenticado, ir directamente a la app
        router.replace('/(tabs)/PagosScreen');
      } else {
        // Si no está autenticado, mostrar pantalla de bienvenida
        setIsChecking(false);
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      setIsChecking(false);
    }
  };

  const handleIngresar = () => {
    router.push('/LoginScreen');
  };

  const handleAccesoDirecto = () => {
    router.replace('/(tabs)/PagosScreen');
  };

  if (isChecking) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#4F46E5', '#7C3AED', '#EC4899']}
          style={styles.gradient}
        >
          <View style={[styles.content, { justifyContent: 'center' }]}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>Verificando sesión...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#4F46E5', '#7C3AED', '#EC4899']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Logo/Icono */}
          <View style={styles.logoContainer}>
            <Ionicons name="wallet" size={80} color="white" />
          </View>

          {/* Título Principal */}
          <Text style={styles.title}>Prestamos Edin</Text>
          
          {/* Subtítulo */}
          <Text style={styles.subtitle}>
            Sistema de Gestión de Préstamos
          </Text>

          {/* Botón INGRESAR */}
          <TouchableOpacity 
            style={styles.button}
            onPress={handleIngresar}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>INICIAR SESIÓN</Text>
            <Ionicons name="arrow-forward" size={24} color="#4F46E5" style={styles.buttonIcon} />
          </TouchableOpacity>

          {/* Botón Acceso Directo */}
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleAccesoDirecto}
            activeOpacity={0.8}
          >
            <Text style={styles.skipButtonText}>Acceso Directo (Sin Login)</Text>
          </TouchableOpacity>

          {/* Información adicional */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Sistema de Gestión de Préstamos
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 50,
    fontWeight: '300',
  },
  button: {
    backgroundColor: 'white',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 30,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginRight: 10,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  skipButton: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  skipButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  infoContainer: {
    marginTop: 20,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});