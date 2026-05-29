import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

const BRAND = '#185FA5'
const MUTED = '#94a3b8'

type IconName = React.ComponentProps<typeof Ionicons>['name']

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: BRAND,
        tabBarInactiveTintColor: MUTED,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#fff' },
      }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Home',     tabBarIcon: (p) => <TabIcon name={p.focused ? 'home' : 'home-outline'} {...p} /> }} />
      <Tabs.Screen name="map"      options={{ title: 'Map View', tabBarIcon: (p) => <TabIcon name={p.focused ? 'map' : 'map-outline'} {...p} /> }} />
      <Tabs.Screen name="saved"    options={{ title: 'Saved',    tabBarIcon: (p) => <TabIcon name={p.focused ? 'heart' : 'heart-outline'} {...p} /> }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings', tabBarIcon: (p) => <TabIcon name={p.focused ? 'calendar' : 'calendar-outline'} {...p} /> }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile',  tabBarIcon: (p) => <TabIcon name={p.focused ? 'person' : 'person-outline'} {...p} /> }} />

      {/* keep search route accessible but hide from tab bar */}
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  )
}

import type { ColorValue } from 'react-native'

function TabIcon({ name, color, size }: { name: IconName; color: ColorValue; size: number; focused?: boolean }) {
  return <Ionicons name={name} size={size} color={color as string} />
}
