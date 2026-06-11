import { useEffect, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { searchApi } from '../lib/api'
import { useLocationStore, DEFAULT_CITY, type SelectedCity } from '../store/locationStore'
import type { City } from '../types'

const BRAND = '#185FA5'
const ACCENT = '#D85A30'

/**
 * Bottom sheet for choosing your city. Supported cities load from the API
 * (`active` flag); "Use my current location" reverse-geocodes via GPS and,
 * when we don't operate there yet, shows an "expanding soon" state instead
 * of pretending to cover it — the InvusProp pattern.
 */
export function CityPickerSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { city: selected, setCity } = useLocationStore()
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [detecting, setDetecting] = useState(false)
  const [notHereYet, setNotHereYet] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setNotHereYet(null)
    let mounted = true
    ;(async () => {
      try {
        const { data } = await searchApi.cities()
        if (mounted) setCities(data.filter((c) => c.active))
      } catch {
        if (mounted) setCities([])
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [visible])

  const pick = (c: SelectedCity) => {
    setCity(c)
    onClose()
  }

  const detect = async () => {
    setDetecting(true)
    setNotHereYet(null)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setNotHereYet('your area (location permission denied)')
        return
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const [addr] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      })
      const place = addr?.city || addr?.district || addr?.subregion || addr?.region || 'your area'
      const match = cities.find((c) =>
        place.toLowerCase().includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(place.toLowerCase()),
      )
      if (match) {
        pick({ name: match.name, slug: match.slug, state: match.state })
      } else {
        setNotHereYet(place)
      }
    } catch {
      setNotHereYet('your area')
    } finally {
      setDetecting(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Choose your city</Text>

        {/* GPS detect */}
        <Pressable style={styles.detectRow} onPress={detect} disabled={detecting}>
          {detecting
            ? <ActivityIndicator size="small" color={BRAND} />
            : <Ionicons name="navigate" size={18} color={BRAND} />}
          <Text style={styles.detectText}>{detecting ? 'Detecting…' : 'Use my current location'}</Text>
        </Pressable>

        {/* Expanding-soon state for unsupported detections */}
        {notHereYet ? (
          <View style={styles.soonBox}>
            <Ionicons name="rocket-outline" size={20} color={ACCENT} />
            <View style={{ flex: 1 }}>
              <Text style={styles.soonTitle}>We&apos;re not in {notHereYet} yet</Text>
              <Text style={styles.soonBody}>
                PropFind is expanding city by city. Browse {DEFAULT_CITY.name} for now — we&apos;ll be in more cities soon.
              </Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>Available now</Text>
        {loading ? (
          <ActivityIndicator color={BRAND} style={{ marginVertical: 16 }} />
        ) : (
          (cities.length ? cities : [{ id: 'default', name: DEFAULT_CITY.name, slug: DEFAULT_CITY.slug, state: DEFAULT_CITY.state, active: true }]).map((c) => {
            const on = selected.slug === c.slug
            return (
              <Pressable key={c.id} style={[styles.cityRow, on && styles.cityRowOn]}
                onPress={() => pick({ name: c.name, slug: c.slug, state: c.state })}>
                <Ionicons name="location" size={16} color={on ? '#fff' : BRAND} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cityName, on && { color: '#fff' }]}>{c.name}</Text>
                  <Text style={[styles.cityState, on && { color: '#dbeafe' }]}>{c.state}</Text>
                </View>
                {on ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
              </Pressable>
            )
          })
        )}

        <Text style={styles.footerNote}>More cities coming soon</Text>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet:       { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  handle:      { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', marginBottom: 14 },
  title:       { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12 },

  detectRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#eff6ff', marginBottom: 12 },
  detectText:  { fontSize: 14, fontWeight: '600', color: BRAND },

  soonBox:     { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 12, padding: 12, marginBottom: 12 },
  soonTitle:   { fontSize: 14, fontWeight: '700', color: '#9a3412' },
  soonBody:    { fontSize: 12, color: '#9a3412', marginTop: 2, lineHeight: 17 },

  sectionLabel:{ fontSize: 12, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  cityRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },
  cityRowOn:   { backgroundColor: BRAND, borderColor: BRAND },
  cityName:    { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  cityState:   { fontSize: 12, color: '#64748b' },

  footerNote:  { textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 8 },
})
