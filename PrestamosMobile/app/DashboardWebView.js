import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const DashboardWebView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const webViewRef = useRef(null);

  // URL del dashboard local - se conecta al servidor que ya está corriendo
  const DASHBOARD_URL = 'http://localhost:3000';

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
    setLoading(false);
    setError(true);
  };

  const handleReload = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleGoBack = () => {
    if (webViewRef.current) {
      webViewRef.current.goBack();
    }
  };

  const handleGoForward = () => {
    if (webViewRef.current) {
      webViewRef.current.goForward();
    }
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={64} color="#ff6b6b" />
          <Text style={styles.errorTitle}>Error de Conexión</Text>
          <Text style={styles.errorMessage}>
            No se pudo cargar el dashboard. Asegúrate de que el servidor esté ejecutándose en localhost:3000
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Barra de navegación personalizada */}
      <View style={styles.navigationBar}>
        <TouchableOpacity style={styles.navButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={handleGoForward}>
          <Ionicons name="arrow-forward" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={handleReload}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.urlContainer}>
          <Text style={styles.urlText}>Dashboard PrestamosEdin</Text>
        </View>
      </View>

      {/* Indicador de carga */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando Dashboard...</Text>
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: DASHBOARD_URL }}
        style={styles.webview}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        // Permitir navegación dentro del dominio
        onShouldStartLoadWithRequest={(request) => {
          // Permitir navegación dentro del localhost
          return request.url.startsWith('http://localhost:3000') || 
                 request.url.startsWith('http://127.0.0.1:3000');
        }}
        // Inyectar JavaScript para mejorar la experiencia móvil
        injectedJavaScript={`
          // Ajustar viewport para móvil
          const meta = document.createElement('meta');
          meta.name = 'viewport';
          meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
          document.getElementsByTagName('head')[0].appendChild(meta);
          
          // Ocultar scrollbars si es necesario
          document.body.style.overflow = 'auto';
          
          true; // Nota: siempre retornar true al final
        `}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  navigationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  navButton: {
    padding: 8,
    marginRight: 8,
  },
  urlContainer: {
    flex: 1,
    marginLeft: 8,
  },
  urlText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardWebView;