import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Platform, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';

// NOTA: Este código utiliza APIs de React Native y Expo y debe ejecutarse
// en un entorno de desarrollo móvil como Expo Go o un emulador para funcionar
// correctamente, ya que requiere acceso a funcionalidades nativas del dispositivo.

// Colores para la interfaz
const COLORS = {
  primary: '#4F46E5', // Indigo
  secondary: '#6EE7B7', // Emerald
  background: '#F9FAFB', // Light Gray
  text: '#1F2937', // Dark Gray
  danger: '#EF4444', // Red
};

// Componente principal de la aplicación
export default function App() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);

  // Función para formatear la fecha y hora
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    // Formato español: hora:minuto:segundo - día/mes/año
    return date.toLocaleTimeString('es-ES') + ' - ' + date.toLocaleDateString('es-ES');
  };

  // 1. Manejo de Permisos de Geolocalización
  useEffect(() => {
    (async () => {
      // Solicitar permiso para acceder a la ubicación
      // Esto es crucial para acceder a la API nativa de GPS
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado. No podemos obtener la ubicación.');
        setIsPermissionGranted(false);
        return;
      }
      setIsPermissionGranted(true);
      // Intentar obtener la ubicación inicial al cargar
      getCurrentLocation();
    })();
  }, []);

  // 2. Función para obtener la ubicación actual
  const getCurrentLocation = async () => {
    if (!isPermissionGranted) {
      // En lugar de usar Alert, usaremos una alerta más informativa si es posible
      // Nota: React Native usa Alert, no confirm().
      Alert.alert("Permiso Requerido", "Por favor, concede permiso de ubicación para usar esta función.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setLocation(null);
    
    try {
      // Obtenemos la ubicación actual de alta precisión
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(currentLocation);
    } catch (error) {
      console.error("Error al obtener la ubicación:", error);
      setErrorMsg("Error al obtener la ubicación. Asegúrese de que el GPS está activo y el permiso está concedido.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Renderizado del contenido principal
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
        </View>
      );
    }

    if (errorMsg) {
      return <Text style={styles.errorText}>{errorMsg}</Text>;
    }

    if (!location) {
      return (
        <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Presiona el botón para registrar tu ubicación actual.</Text>
        </View>
      );
    }

    // Si la ubicación está disponible, mostramos los datos
    const coords = location.coords;
    
    return (
      <View style={styles.dataContainer}>
        <Text style={styles.title}>Ubicación Actual (Diario GPS)</Text>
        
        <View style={styles.card}>
          <Text style={styles.label}>Latitud:</Text>
          <Text style={styles.value}>{coords.latitude.toFixed(6)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Longitud:</Text>
          <Text style={styles.value}>{coords.longitude.toFixed(6)}</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.label}>Altitud (m):</Text>
          <Text style={styles.value}>{coords.altitude ? coords.altitude.toFixed(2) : 'N/A'}</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.label}>Precisión (m):</Text>
          <Text style={styles.value}>{coords.accuracy ? coords.accuracy.toFixed(2) : 'N/A'}</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.label}>Última actualización:</Text>
          <Text style={styles.value}>{formatTimestamp(location.timestamp)}</Text>
        </View>

      </View>
    );
  };

  // 4. Estructura principal del componente
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.content}>
        {renderContent()}
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title={isLoading ? "Cargando..." : "Registrar Ubicación Actual"}
          onPress={getCurrentLocation}
          color={COLORS.primary}
          disabled={isLoading || !isPermissionGranted}
        />
        {!isPermissionGranted && (
             <Text style={styles.permissionPrompt}>
                Concede el permiso de ubicación para activar el botón.
             </Text>
        )}
      </View>
      
    </View>
  );
}

// 5. Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    // Ajuste para evitar que el contenido quede bajo la barra de estado en Android
    paddingTop: Platform.OS === 'android' ? 30 : 0, 
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  dataContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  value: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '400',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.danger,
    textAlign: 'center',
    padding: 20,
  },
  infoContainer: {
      padding: 20,
      backgroundColor: '#FEE2E2', // Red 100
      borderRadius: 8,
  },
  infoText: {
      color: '#B91C1C', // Red 700
      fontSize: 16,
      textAlign: 'center',
  },
  permissionPrompt: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.danger,
    textAlign: 'center',
  }
});
