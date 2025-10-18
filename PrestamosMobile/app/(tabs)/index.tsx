// app/index.tsx
import React from 'react';
import { useRouter } from 'expo-router';
import HomeScreen from '../HomeScreen';

export default function IndexPage() {
    const router = useRouter();

    const handleNavigateToPagos = () => {
        router.push('/(tabs)/PagosScreen');
    };

    // Renderizamos directamente el HomeScreen con la navegación
    return <HomeScreen navigation={{ navigate: handleNavigateToPagos }} />;
}