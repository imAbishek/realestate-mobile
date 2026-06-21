import { Tabs } from 'expo-router'
import { View, StyleSheet, Platform } from 'react-native'
import type { ColorValue } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fonts } from '../../src/theme'

type IconName = React.ComponentProps<typeof Ionicons>['name']

export default function TabsLayout() {
  // SDK 56 draws edge-to-edge, so the Android system nav bar overlaps a
  // fixed-height tab bar. Add the bottom inset so the bar sits above it.
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: '#d6d6d6ff',
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11, marginTop: 2, color: '#d6d6d6ff' },
        // Frosted, floating bar with rounded top corners — content scrolls
        // underneath and blurs through.
        tabBarStyle: {
          position: 'absolute',
          height: 66 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          // Soft upward lift so the bar reads as a floating card over the page.
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 1,
          shadowRadius: 14,
        },
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, styles.blurTint]}>
            <LinearGradient
              colors={['#0c3a68', '#185FA5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <BlurView
              intensity={Platform.OS === 'android' ? 5 : 5}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
          </View>
        ),
      }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Home',     tabBarIcon: (p) => <TabIcon name={p.focused ? 'home' : 'home-outline'} {...p} /> }} />
      <Tabs.Screen name="map"      options={{ title: 'Map',      tabBarIcon: (p) => <TabIcon name={p.focused ? 'map' : 'map-outline'} {...p} /> }} />
      <Tabs.Screen name="saved"    options={{ title: 'Saved',    tabBarIcon: (p) => <TabIcon name={p.focused ? 'heart' : 'heart-outline'} {...p} /> }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings', tabBarIcon: (p) => <TabIcon name={p.focused ? 'calendar' : 'calendar-outline'} {...p} /> }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile',  tabBarIcon: (p) => <TabIcon name={p.focused ? 'person' : 'person-outline'} {...p} /> }} />

      {/* keep search route accessible but hide from tab bar */}
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  )
}

function TabIcon({ name, color, size, focused }: { name: IconName; color: ColorValue; size: number; focused?: boolean }) {
  // Rounded highlight behind the active icon (matches the design mockup).
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={name} size={size} color={color as string} />
    </View>
  )
}

const styles = StyleSheet.create({
  // Frosted wash over the blur — clipped to the bar's rounded top corners.
  blurTint:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  // Light blue-grey squircle highlight behind the active icon (matches the mockup).
  iconWrap:       { width: 52, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: '#dbe7f5'},
})
