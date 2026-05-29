import { useEffect, useState } from 'react'
import {
  ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { propertyApi } from '../../src/lib/api'
import { useAuthStore } from '../../src/store/authStore'
import type { ListingType, PriceUnit, PropertyCard } from '../../src/types'

const BRAND       = '#185FA5'
const BRAND_DARK  = '#0e447a'
const BRAND_TINT  = '#eff4fb'
const ACCENT      = '#D85A30'

export default function HomeScreen() {
  const router = useRouter()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  const [propertyIdQuery, setPropertyIdQuery] = useState('')
  const [recent, setRecent] = useState<PropertyCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await propertyApi.search({ citySlug: 'coimbatore', page: 0, size: 6 })
        setRecent(data.content)
      } catch { /* swallow — home still renders */ }
      finally { setLoading(false) }
    })()
  }, [])

  const goBrowse = (type: ListingType) => router.push({ pathname: '/search', params: { listingType: type } })
  const goPost   = () => router.push(isLoggedIn ? '/post' : '/auth/login')
  const goLoan   = () => Alert.alert('Coming soon', 'Loan tools launch in a future update.')
  const goService = (name: string) => Alert.alert(name, 'Coming soon.')
  const goBudget  = (label: string) => Alert.alert(`Budget: ${label}`, 'Filtered browsing arrives in Phase B.')

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Thin fixed top bar — location pill + bell */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <View style={styles.topBarInner}>
          <Pressable style={styles.locationPill}>
            <Ionicons name="location" size={14} color="#fff" />
            <View>
              <Text style={styles.locationCity}>Coimbatore</Text>
              <Text style={styles.subState}>Tamil Nadu</Text>
            </View>
            <Ionicons name="chevron-down" size={14} color="#fff" />
          </Pressable>
          <Pressable style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={20} color="#fff" />
            <View style={styles.bellDot} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Scrollable hero — search + 2×2 quick tiles, blue background */}
        <View style={styles.hero}>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color="#94a3b8" />
            <TextInput
              value={propertyIdQuery}
              onChangeText={setPropertyIdQuery}
              placeholder='Search by "Property ID"'
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
            />
          </View>

          <View style={styles.quickGrid}>
            <QuickTile icon="home"          label="Buy"           sub="Find the perfect plot for you." onPress={() => goBrowse('SALE')} />
            <QuickTile icon="add-circle"    label="Post Property" sub="Let us find your buyer."        onPress={goPost} />
            <QuickTile icon="key"           label="Rent"          sub="Live where you love."           onPress={() => goBrowse('RENT')} />
            <QuickTile icon="cash"          label="Loan"          sub="Make dreams come true."         onPress={goLoan} />
          </View>
        </View>

        {/* Featured Collections */}
        <Section title="Featured Collections" subtitle="All in one best spaces.">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            <FeaturedCollectionCard label="Residential Plot/Land" tone="green" onPress={() => goBrowse('SALE')} />
            <FeaturedCollectionCard label="Commercial Plot/Land"  tone="blue"  onPress={() => goBrowse('SALE')} />
            <FeaturedCollectionCard label="Agricultural Land"     tone="amber" onPress={() => goBrowse('SALE')} />
          </ScrollView>
        </Section>

        {/* Services */}
        <Section title="Services" subtitle="All your needs covered here." background={BRAND_TINT}>
          <View style={styles.serviceRow}>
            <ServiceTile icon="calculator-outline" label="EMI Calculator" onPress={() => goService('EMI Calculator')} />
            <ServiceTile icon="cash-outline"        label="Home Loan"     onPress={() => goService('Home Loan')} />
            <ServiceTile icon="brush-outline"       label="Interior Design" onPress={() => goService('Interior Design')} />
          </View>
        </Section>

        {/* Customize Budget */}
        <Section title="Customize Budget" subtitle="Affordable options, just for you." background="#fff">
          <View style={styles.budgetRow}>
            <BudgetChip label="Under 10L" onPress={() => goBudget('Under 10L')} />
            <BudgetChip label="10L – 20L" onPress={() => goBudget('10L–20L')} />
            <BudgetChip label="20L – 50L" onPress={() => goBudget('20L–50L')} />
          </View>
        </Section>

        {/* Why Choose Us */}
        <Section title="Why Choose Us?" background={BRAND_TINT}>
          <Benefit
            icon="shield-checkmark"
            title="Verified Listings"
            body="We ensure every property is verified, offering you safe and reliable options."
          />
          <Benefit
            icon="earth"
            title="Wide Reach"
            body="Explore properties in prime locations across Coimbatore and beyond."
          />
          <Benefit
            icon="people"
            title="Personalised Support"
            body="Our team is always ready to guide you, ensuring a smooth and hassle-free journey."
          />
        </Section>

        {/* Post Property CTA */}
        <View style={styles.ctaCard}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.ctaTitle}>Post Your Property in Minutes!</Text>
            <Text style={styles.ctaBody}>Reach thousands of buyers and renters effortlessly.</Text>
            <Pressable onPress={goPost} style={styles.ctaBtn}>
              <Text style={styles.ctaBtnText}>Post Now</Text>
            </Pressable>
          </View>
          <Ionicons name="business" size={72} color="rgba(255,255,255,0.35)" />
        </View>

        {/* Recent listings — transitional until proper list page in Phase B */}
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={BRAND} /></View>
        ) : recent.length > 0 ? (
          <Section title="Recent in Coimbatore" background="#fff">
            {recent.map((p) => (
              <RecentRow key={p.id} item={p} onPress={() => router.push(`/properties/${p.id}`)} />
            ))}
          </Section>
        ) : null}

        {/* Social */}
        <View style={styles.social}>
          <Text style={styles.socialLabel}>Follow us on</Text>
          <View style={styles.socialRow}>
            <SocialIcon icon="logo-youtube"    color="#ff0000" onPress={() => Linking.openURL('https://youtube.com')} />
            <SocialIcon icon="logo-instagram"  color="#e1306c" onPress={() => Linking.openURL('https://instagram.com')} />
            <SocialIcon icon="logo-facebook"   color="#1877f2" onPress={() => Linking.openURL('https://facebook.com')} />
            <SocialIcon icon="logo-linkedin"   color="#0a66c2" onPress={() => Linking.openURL('https://linkedin.com')} />
          </View>
        </View>

        <Text style={styles.watermark}>Unlock your Wealth!</Text>
        <Text style={styles.footnote}>Made with <Text style={{ color: ACCENT }}>♥</Text> for real estate investments</Text>
      </ScrollView>
    </View>
  )
}

// ─── components ─────────────────────────────────────────────────

function QuickTile({ icon, label, sub, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickTile, pressed && { opacity: 0.85 }]}>
      <View style={styles.quickIconWrap}><Ionicons name={icon} size={22} color="#fff" /></View>
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickSub} numberOfLines={2}>{sub}</Text>
    </Pressable>
  )
}

function Section({ title, subtitle, background = '#fff', children }: { title: string; subtitle?: string; background?: string; children: React.ReactNode }) {
  return (
    <View style={[styles.section, { backgroundColor: background }]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  )
}

function FeaturedCollectionCard({ label, tone, onPress }: { label: string; tone: 'green' | 'blue' | 'amber'; onPress: () => void }) {
  const palette = {
    green: { bg: '#d4ead2', accent: '#3b7a3b' },
    blue:  { bg: '#cde0f4', accent: '#1e5a9a' },
    amber: { bg: '#f5e3c2', accent: '#a06a1c' },
  }[tone]
  return (
    <Pressable onPress={onPress} style={[styles.featured, { backgroundColor: palette.bg }]}>
      <View style={[styles.featuredBadge, { backgroundColor: palette.accent }]}>
        <Ionicons name="ribbon" size={12} color="#fff" />
      </View>
      <Ionicons name="image-outline" size={36} color={palette.accent} style={{ opacity: 0.6 }} />
      <Text style={[styles.featuredLabel, { color: palette.accent }]}>{label}</Text>
    </Pressable>
  )
}

function ServiceTile({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.serviceTile, pressed && { opacity: 0.85 }]}>
      <Ionicons name={icon} size={26} color={BRAND} />
      <Text style={styles.serviceLabel}>{label}</Text>
    </Pressable>
  )
}

function BudgetChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.budget, pressed && { opacity: 0.85 }]}>
      <Ionicons name="wallet" size={18} color={BRAND} />
      <Text style={styles.budgetLabel}>{label}</Text>
    </Pressable>
  )
}

function Benefit({ icon, title, body }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; body: string }) {
  return (
    <View style={styles.benefit}>
      <View style={styles.benefitIcon}><Ionicons name={icon} size={20} color={BRAND} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitBody}>{body}</Text>
      </View>
    </View>
  )
}

function RecentRow({ item, onPress }: { item: PropertyCard; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.recent, pressed && { opacity: 0.85 }]}>
      {item.primaryImageUrl ? (
        <Image source={{ uri: item.primaryImageUrl }} style={styles.recentImg} resizeMode="cover" />
      ) : (
        <View style={[styles.recentImg, styles.noImage]}><Ionicons name="image-outline" size={24} color="#94a3b8" /></View>
      )}
      <View style={styles.recentBody}>
        <Text style={styles.recentTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.recentLoc} numberOfLines={1}>{item.localityName}, {item.cityName}</Text>
        <View style={styles.recentMetaRow}>
          <Text style={styles.recentPrice}>{formatPrice(item.price, item.priceUnit)}</Text>
          <Text style={styles.recentMeta}>{item.areaSqft} sqft</Text>
        </View>
      </View>
    </Pressable>
  )
}

function SocialIcon({ icon, color, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.7 }]}>
      <Ionicons name={icon} size={22} color={color} />
    </Pressable>
  )
}

function formatPrice(price: number, unit: PriceUnit): string {
  if (unit === 'PER_MONTH') return `₹${price.toLocaleString('en-IN')}/mo`
  if (unit === 'PER_SQFT')  return `₹${price.toLocaleString('en-IN')}/sqft`
  if (price >= 10_000_000)  return `₹${(price / 10_000_000).toFixed(2)} Cr`
  if (price >= 100_000)     return `₹${(price / 100_000).toFixed(2)} L`
  return `₹${price.toLocaleString('en-IN')}`
}

const styles = StyleSheet.create({
  // Fixed top bar
  topBar:            { backgroundColor: BRAND },
  topBarInner:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10 },
  locationPill:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationCity:      { color: '#fff', fontSize: 16, fontWeight: '700', lineHeight: 18 },
  subState:          { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '500', marginTop: 1 },
  bellBtn:           { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  bellDot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT, position: 'absolute', top: 8, right: 9, borderWidth: 1, borderColor: BRAND },

  // Scrollable hero (search + tiles)
  hero:              { backgroundColor: BRAND, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  searchWrap:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
  searchInput:       { flex: 1, fontSize: 14, color: '#0f172a', padding: 0 },

  // Quick tiles
  quickGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  quickTile:         { flexBasis: '48%', flexGrow: 1, backgroundColor: BRAND_DARK, borderRadius: 14, padding: 14, minHeight: 90, justifyContent: 'space-between' },
  quickIconWrap:     { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  quickLabel:        { color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 8 },
  quickSub:          { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2, lineHeight: 14 },

  // Section
  section:           { paddingHorizontal: 16, paddingVertical: 18 },
  sectionTitle:      { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  sectionSub:        { fontSize: 12, color: '#64748b', marginTop: 3 },

  // Featured collection cards
  featured:          { width: 180, height: 140, borderRadius: 14, padding: 14, justifyContent: 'space-between' },
  featuredBadge:     { position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featuredLabel:     { fontSize: 14, fontWeight: '700' },

  // Services
  serviceRow:        { flexDirection: 'row', gap: 10 },
  serviceTile:       { flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 18, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  serviceLabel:      { fontSize: 11, fontWeight: '600', color: '#0f172a', marginTop: 8, textAlign: 'center' },

  // Budget
  budgetRow:         { flexDirection: 'row', gap: 10 },
  budget:            { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: BRAND_TINT, borderRadius: 12, paddingVertical: 14 },
  budgetLabel:       { fontSize: 12, fontWeight: '700', color: BRAND },

  // Benefits
  benefit:           { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 14 },
  benefitIcon:       { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#dbeafe' },
  benefitTitle:      { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  benefitBody:       { fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 17 },

  // CTA
  ctaCard:           { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND, marginHorizontal: 16, marginVertical: 10, borderRadius: 16, padding: 18, overflow: 'hidden' },
  ctaTitle:          { color: '#fff', fontSize: 17, fontWeight: '700' },
  ctaBody:           { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 6 },
  ctaBtn:            { backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, marginTop: 12 },
  ctaBtnText:        { color: BRAND, fontWeight: '700', fontSize: 13 },

  // Recent listings
  center:            { padding: 40, alignItems: 'center' },
  recent:            { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  recentImg:         { width: 100, height: 100, backgroundColor: '#e2e8f0' },
  noImage:           { alignItems: 'center', justifyContent: 'center' },
  recentBody:        { flex: 1, padding: 12, justifyContent: 'space-between' },
  recentTitle:       { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  recentLoc:         { fontSize: 12, color: '#64748b' },
  recentMetaRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  recentPrice:       { fontSize: 14, fontWeight: '700', color: BRAND },
  recentMeta:        { fontSize: 11, color: '#64748b' },

  // Social
  social:            { alignItems: 'center', paddingTop: 18 },
  socialLabel:       { fontSize: 13, color: '#64748b', fontWeight: '600' },
  socialRow:         { flexDirection: 'row', gap: 16, marginTop: 10 },
  socialBtn:         { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },

  // Footer
  watermark:         { fontSize: 28, fontWeight: '800', textAlign: 'center', color: '#cbd5e1', marginTop: 24, letterSpacing: 0.5 },
  footnote:          { fontSize: 11, textAlign: 'center', color: '#94a3b8', marginTop: 6, marginBottom: 20 },
})
