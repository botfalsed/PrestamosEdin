import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View } from 'react-native';
import 'react-native-reanimated';
import { StatsProvider } from '../contexts/StatsContext';
import useRealtimeUpdates from '../hooks/useRealtimeUpdates';
import RealtimeNotifications from '../components/RealtimeNotifications';

// Configuración removida - usando index.js como punto de entrada

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Configurar actualizaciones en tiempo real
  const {
    connectionStatus,
    notifications,
    removeNotification,
    clearAllNotifications,
    lastUpdate
  } = useRealtimeUpdates({
    autoConnect: true,
    reconnectOnForeground: true,
    onPagoRegistrado: (data: any) => {
      console.log('🎯 [RootLayout] Pago registrado recibido:', data);
      // Aquí se puede agregar lógica adicional como refrescar datos globales
    },
    onPrestamoCreado: (data: any) => {
      console.log('🎯 [RootLayout] Préstamo creado recibido:', data);
      // Aquí se puede agregar lógica adicional como refrescar datos globales
    },
    onPrestamoActualizado: (data: any) => {
      console.log('🎯 [RootLayout] Préstamo actualizado recibido:', data);
      // Aquí se puede agregar lógica adicional como refrescar datos globales
    },
    onConnectionChange: (status: any) => {
      console.log('🎯 [RootLayout] Estado de conexión cambió:', status);
    }
  });

  return (
    <StatsProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="ArchivadosScreen" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          
          {/* Componente de notificaciones en tiempo real */}
          <RealtimeNotifications
            notifications={notifications}
            connectionStatus={connectionStatus}
            onRemoveNotification={removeNotification}
            onClearAll={clearAllNotifications}
            showConnectionStatus={true}
            style={{}}
          />
          
          <StatusBar style="auto" />
        </View>
      </ThemeProvider>
    </StatsProvider>
  );
}
