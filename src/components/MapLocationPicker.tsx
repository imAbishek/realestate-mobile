import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, Alert, Modal, Platform, Pressable,
  StyleSheet, Text, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps'
import * as Location from 'expo-location'

const BRAND = '#185FA5'
const ACCENT = '#D85A30'

// Coimbatore city center — default starting point for the picker
const COIMBATORE: Region = {
  latitude: 11.0168,
  longitude: 76.9558,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
}

type LatLng = { latitude: number; longitude: number }

export function MapLocationPicker({
  visible,
  initialLocation,
  onCancel,
  onConfirm,
}: {
  visible: boolean
  initialLocation?: LatLng | null
  onCancel: () => void
  onConfirm: (loc: LatLng) => void
}) {
  const mapRef = useRef<MapView>(null)
  const [pin, setPin] = useState<LatLng>(initialLocation ?? { latitude: COIMBATORE.latitude, longitude: COIMBATORE.longitude })
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    if (!visible) return
    if (initialLocation) {
      setPin(initialLocation)
      mapRef.current?.animateToRegion({ ...initialLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 300)
    } else {
      setPin({ latitude: COIMBATORE.latitude, longitude: COIMBATORE.longitude })
    }
  }, [visible, initialLocation])

  const useCurrentLocation = async () => {
    try {
      setLocating(true)
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow location access to use your current location.')
        return
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
      setPin(next)
      mapRef.current?.animateToRegion({ ...next, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 500)
    } catch (e) {
      Alert.alert('Could not get location', 'Please pick the spot on the map manually.')
    } finally {
      setLocating(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={onCancel} hitSlop={8}>
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Pick property location</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.mapWrap}>
          <MapView
            ref={mapRef}
            // Force Google Maps on iOS too (Apple Maps is the default otherwise).
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFill}
            initialRegion={initialLocation
              ? { ...initialLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }
              : COIMBATORE}
            onPress={(e) => setPin(e.nativeEvent.coordinate)}
          >
            <Marker
              coordinate={pin}
              draggable
              onDragEnd={(e) => setPin(e.nativeEvent.coordinate)}
              pinColor={ACCENT}
            />
          </MapView>

          <Pressable onPress={useCurrentLocation} style={styles.gpsBtn}>
            {locating ? (
              <ActivityIndicator color={BRAND} />
            ) : (
              <Ionicons name="locate" size={22} color={BRAND} />
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.hint}>Tap or drag the pin to mark the exact spot.</Text>
          <Text style={styles.coords}>
            {pin.latitude.toFixed(6)}, {pin.longitude.toFixed(6)}
          </Text>
          <Pressable onPress={() => onConfirm(pin)} style={styles.confirmBtn}>
            <Text style={styles.confirmText}>Confirm location</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#f8fafc' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: BRAND, paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },

  mapWrap:     { flex: 1 },
  gpsBtn:      {
    position: 'absolute', right: 14, bottom: 14, width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  footer:      { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', gap: 8 },
  hint:        { fontSize: 12, color: '#64748b' },
  coords:      { fontSize: 13, color: '#0f172a', fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }) },
  confirmBtn:  { marginTop: 6, backgroundColor: ACCENT, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
