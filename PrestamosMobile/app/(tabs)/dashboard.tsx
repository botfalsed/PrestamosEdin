import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function DashboardTab() {
  const router = useRouter();

  const handleOpenDashboard = () => {
    router.push('../DashboardWebView' as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <IconSymbol name="globe" size={80} color="#667eea" />
        <Text style={styles.title}>Dashboard Web</Text>
        <Text style={styles.description}>
          Accede al dashboard completo de PrestamosEdin con todas las funcionalidades web
        </Text>
        
        <TouchableOpacity style={styles.button} onPress={handleOpenDashboard}>
          <IconSymbol name="arrow.right.circle.fill" size={24} color="white" />
          <Text style={styles.buttonText}>Abrir Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
});