import { Link } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ModalScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#1e40af', '#3b82f6']}
        className="pb-6"
      >
        <View className="px-6 pt-4 flex-row items-center justify-between">
          <Text className="text-white text-xl font-bold">
            Modal de Información
          </Text>
          <Link href="/" dismissTo asChild>
            <TouchableOpacity className="w-8 h-8 bg-white/20 rounded-full items-center justify-center">
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </Link>
        </View>
      </LinearGradient>

      {/* Content */}
      <View className="flex-1 px-6 pt-8">
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-primary-100 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="information-circle" size={32} color="#3b82f6" />
            </View>
            <Text className="text-gray-900 text-2xl font-bold mb-2">
              Información Modal
            </Text>
            <Text className="text-gray-600 text-center">
              Esta es una pantalla modal de ejemplo para la aplicación PrestamosMobile
            </Text>
          </View>

          <View className="space-y-4">
            <View className="flex-row items-center p-4 bg-gray-50 rounded-xl">
              <View className="w-10 h-10 bg-success-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold mb-1">
                  Funcionalidad Completa
                </Text>
                <Text className="text-gray-600 text-sm">
                  Modal integrado con navegación de Expo Router
                </Text>
              </View>
            </View>

            <View className="flex-row items-center p-4 bg-gray-50 rounded-xl">
              <View className="w-10 h-10 bg-warning-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="color-palette" size={20} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold mb-1">
                  Diseño Moderno
                </Text>
                <Text className="text-gray-600 text-sm">
                  Estilizado con NativeWind y Tailwind CSS
                </Text>
              </View>
            </View>

            <View className="flex-row items-center p-4 bg-gray-50 rounded-xl">
              <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="phone-portrait" size={20} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold mb-1">
                  Optimizado para Móvil
                </Text>
                <Text className="text-gray-600 text-sm">
                  Diseño responsivo para cobradores en campo
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="space-y-3">
          <Link href="/" dismissTo asChild>
            <TouchableOpacity className="bg-primary-500 rounded-xl p-4 flex-row items-center justify-center">
              <Ionicons name="home" size={20} color="white" className="mr-2" />
              <Text className="text-white font-semibold text-base ml-2">
                Ir a Inicio
              </Text>
            </TouchableOpacity>
          </Link>

          <TouchableOpacity className="bg-gray-200 rounded-xl p-4 flex-row items-center justify-center">
            <Ionicons name="information-circle-outline" size={20} color="#6b7280" className="mr-2" />
            <Text className="text-gray-700 font-semibold text-base ml-2">
              Más Información
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View className="px-6 pb-6">
        <View className="bg-primary-50 rounded-xl p-4 border border-primary-200">
          <View className="flex-row items-center">
            <Ionicons name="bulb" size={20} color="#3b82f6" />
            <Text className="text-primary-800 font-medium ml-3 flex-1">
              💡 Tip: Usa modales para mostrar información adicional sin perder el contexto
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
