import { useEffect, useState } from 'react'
import {
  ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { HouseArt, KeyArt, SaleHouseArt, WalletArt } from '../../src/components/TileArt'
import { CityPickerSheet } from '../../src/components/CityPickerSheet'
import { InfoSheet, type InfoSheetContent } from '../../src/components/InfoSheet'
import { propertyApi } from '../../src/lib/api'
import { useAuthStore } from '../../src/store/authStore'
import { useLocationStore } from '../../src/store/locationStore'
import type { ListingType, PriceUnit, PropertyCard } from '../../src/types'

const BRAND       = '#185FA5'
const BRAND_DARK  = '#0e447a'
const BRAND_TINT  = '#eff4fb'
const ACCENT      = '#D85A30'
// Hero gradient — lighter blue up top (blends into the top bar) deepening toward the cards
const HERO_TOP    = '#1c6cba'
const HERO_GRADIENT = [HERO_TOP, '#15589c', '#0e447a'] as const

export default function HomeScreen() {
  const router = useRouter()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const city = useLocationStore((s) => s.city)

  const [propertyIdQuery, setPropertyIdQuery] = useState('')
  const [cityPickerOpen, setCityPickerOpen] = useState(false)
  const [recent, setRecent] = useState<PropertyCard[]>([])
  const [totalListings, setTotalListings] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await propertyApi.search({ citySlug: city.slug, page: 0, size: 6 })
        setRecent(data.content)
        setTotalListings(data.totalElements)
      } catch { /* swallow — home still renders */ }
      finally { setLoading(false) }
    })()
  }, [city.slug])

  const goBrowse = (type: ListingType) => router.push({ pathname: '/search', params: { listingType: type } })
  const goSearch = () => {
    const q = propertyIdQuery.trim()
    router.push(q ? { pathname: '/search', params: { q } } : '/search')
  }
  const goPost   = () => router.push(isLoggedIn ? '/post' : '/auth/login')
  const goLoan   = () => router.push('/emi-calculator')

  // Branded "coming soon" sheet instead of a bare Alert box.
  const [info, setInfo] = useState<InfoSheetContent | null>(null)
  const goService = (name: 'Home Loan' | 'Interior Design') => setInfo(
    name === 'Home Loan'
      ? {
          icon: 'cash-outline', title: 'Home Loan',
          body: 'Loan assistance through partner banks is on its way. Until then, plan your repayments with the EMI calculator.',
          actionLabel: 'Try the EMI Calculator', onAction: () => router.push('/emi-calculator'),
        }
      : {
          icon: 'brush-outline', title: 'Interior Design',
          body: 'Interior design services are coming soon — get your new home styled right from the app.',
        },
  )
  const goBudget = (label: string) => setInfo({
    icon: 'wallet-outline', title: `Budget: ${label}`,
    body: 'Budget-filtered browsing is coming soon. For now, explore every listing and sort by what fits you.',
    actionLabel: 'Browse all listings', onAction: () => router.push('/search'),
  })

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Thin fixed top bar — location pill + bell */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <View style={styles.topBarInner}>
          <Pressable style={styles.locationPill} onPress={() => setCityPickerOpen(true)}>
            <Ionicons name="location" size={14} color="#fff" />
            <View>
              <Text style={styles.locationCity}>{city.name}</Text>
              <Text style={styles.subState}>{city.state}</Text>
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
        {/* Scrollable hero — search + 2×2 glass quick tiles over a blue gradient */}
        <LinearGradient colors={HERO_GRADIENT} style={styles.hero}>
          {/* Signature motif */}
          <Text style={styles.heroTagline}>Unlock your Wealth</Text>
          <View style={styles.heroAccentBar} />

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color="#94a3b8" />
            <TextInput
              value={propertyIdQuery}
              onChangeText={setPropertyIdQuery}
              onSubmitEditing={goSearch}
              returnKeyType="search"
              placeholder='Search by "Property ID"'
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
            />
          </View>

          <View style={styles.quickGrid}>
            <QuickTile art={<HouseArt />}     label="Buy"           sub="Find the perfect plot for you." onPress={() => goBrowse('SALE')} />
            <QuickTile art={<SaleHouseArt />} label="Post Property" sub="Let us find your buyer."        onPress={goPost} />
            <QuickTile art={<KeyArt />}       label="Rent"          sub="Live where you love."           onPress={() => goBrowse('RENT')} />
            <QuickTile art={<WalletArt />}    label="Loan"          sub="Make dreams come true."         onPress={goLoan} />
          </View>
        </LinearGradient>

        {/* Trust / stats band — overlaps hero bottom */}
        <View style={styles.trustBand}>
          <TrustStat icon="business"          value={totalListings != null ? `${totalListings}+` : '—'} label="Listings" />
          <View style={styles.trustDivider} />
          <TrustStat icon="shield-checkmark"  value="100%" label="Verified" />
          <View style={styles.trustDivider} />
          <TrustStat icon="location"          value={city.name} label="& expanding" />
        </View>

        {/* Featured Collections */}
        <Section title="Featured Collections" subtitle="All in one best spaces." bleed>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 12 }}>
            <FeaturedCollectionCard label="Residential Plot/Land" tone="green" imageUrl={recent[0]?.primaryImageUrl} onPress={() => goBrowse('SALE')} />
            <FeaturedCollectionCard label="Commercial Plot/Land"  tone="blue"  imageUrl={recent[1]?.primaryImageUrl} onPress={() => goBrowse('SALE')} />
            <FeaturedCollectionCard label="Agricultural Land"     tone="amber" imageUrl={recent[2]?.primaryImageUrl} onPress={() => goBrowse('SALE')} />
          </ScrollView>
        </Section>

        {/* Services */}
        <Section title="Services" subtitle="All your needs covered here." background={BRAND_TINT}>
          <View style={styles.serviceRow}>
            <ServiceTile icon="calculator-outline" label="EMI Calculator" onPress={() => router.push('/emi-calculator')} />
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
            body="Explore properties in prime locations — city by city, we're expanding."
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
              <Ionicons name="arrow-forward" size={15} color={ACCENT} />
            </Pressable>
          </View>
          <Ionicons name="business" size={72} color="rgba(255,255,255,0.35)" />
        </View>

        {/* Recent listings — transitional until proper list page in Phase B */}
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={BRAND} /></View>
        ) : recent.length > 0 ? (
          <Section title={`Recent in ${city.name}`} background="#fff">
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

        <Text style={styles.footnote}>Made with <Text style={{ color: ACCENT }}>♥</Text> for real estate investments</Text>
      </ScrollView>

      <CityPickerSheet visible={cityPickerOpen} onClose={() => setCityPickerOpen(false)} />
      <InfoSheet
        visible={info !== null}
        onClose={() => setInfo(null)}
        {...(info ?? { title: '', body: '' })}
      />
    </View>
  )
}

// ─── components ─────────────────────────────────────────────────

function QuickTile({ art, label, sub, onPress }: { art: React.ReactNode; label: string; sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickTile, pressed && { opacity: 0.9 }]}>
      {/* Faux-glass: translucent fill (in styles) + soft top→bottom sheen (no hard seam) */}
      <LinearGradient
        colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)']}
        style={styles.quickSheen}
        pointerEvents="none"
      />

      {/* Decorative illustration nestled bottom-right */}
      <View style={styles.quickArt} pointerEvents="none">{art}</View>

      <View style={styles.quickText}>
        <Text style={styles.quickLabel}>{label}</Text>
        <Text style={styles.quickSub} numberOfLines={3}>{sub}</Text>
      </View>
    </Pressable>
  )
}

function TrustStat({ icon, value, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; value: string; label: string }) {
  return (
    <View style={styles.trustStat}>
      <Ionicons name={icon} size={16} color={BRAND} />
      <Text style={styles.trustValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.trustLabel} numberOfLines={1}>{label}</Text>
    </View>
  )
}

function Section({ title, subtitle, background = '#fff', bleed = false, children }: { title: string; subtitle?: string; background?: string; bleed?: boolean; children: React.ReactNode }) {
  const headerPad = bleed ? { paddingHorizontal: 16 } : null
  return (
    <View style={[styles.section, bleed && { paddingHorizontal: 0 }, { backgroundColor: background }]}>
      <Text style={[styles.sectionTitle, headerPad]}>{title}</Text>
      <View style={[styles.sectionAccentBar, bleed && { marginLeft: 16 }]} />
      {subtitle ? <Text style={[styles.sectionSub, headerPad]}>{subtitle}</Text> : null}
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  )
}

function FeaturedCollectionCard({ label, tone, imageUrl, onPress }: { label: string; tone: 'green' | 'blue' | 'amber'; imageUrl?: string | null; onPress: () => void }) {
  const palette = {
    green: { bg: '#d4ead2', accent: '#3b7a3b' },
    blue:  { bg: '#cde0f4', accent: '#1e5a9a' },
    amber: { bg: '#f5e3c2', accent: '#a06a1c' },
  }[tone]
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.featured, { backgroundColor: palette.bg }, pressed && { opacity: 0.9 }]}>
      {imageUrl ? (
        <>
          <Image source={{ uri: imageUrl }} style={styles.featuredImg} resizeMode="cover" />
          <View style={styles.featuredScrim} />
        </>
      ) : (
        <Ionicons name="image-outline" size={36} color={palette.accent} style={{ opacity: 0.6 }} />
      )}
      <View style={[styles.featuredBadge, { backgroundColor: ACCENT }]}>
        <Ionicons name="ribbon" size={12} color="#fff" />
      </View>
      <Text style={[styles.featuredLabel, imageUrl ? styles.featuredLabelOnImage : { color: palette.accent }]}>{label}</Text>
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
  // Fixed top bar — matches the hero gradient's top colour for a seamless blend
  topBar:            { backgroundColor: HERO_TOP },
  topBarInner:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10 },
  locationPill:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationCity:      { color: '#fff', fontSize: 16, fontWeight: '700', lineHeight: 18 },
  subState:          { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '500', marginTop: 1 },
  bellBtn:           { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  bellDot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT, position: 'absolute', top: 8, right: 9, borderWidth: 1, borderColor: BRAND },

  // Scrollable hero (search + glass tiles)
  hero:              { backgroundColor: BRAND, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' },
  heroTagline:       { color: '#fff', fontSize: 25, fontWeight: '800', letterSpacing: 0.3 },
  heroAccentBar:     { width: 44, height: 3, borderRadius: 2, backgroundColor: ACCENT, marginTop: 8, marginBottom: 18 },
  searchWrap:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  searchInput:       { flex: 1, fontSize: 15, color: '#0f172a', padding: 0 },

  // Trust / stats band
  trustBand:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: -24, zIndex: 2, borderRadius: 18, paddingVertical: 18, borderWidth: 1, borderColor: '#eef2f7', shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  trustStat:         { flex: 1, alignItems: 'center', gap: 5 },
  trustValue:        { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  trustLabel:        { fontSize: 12, color: '#64748b', fontWeight: '500' },
  trustDivider:      { width: 1, height: 40, backgroundColor: '#eef2f7' },

  // Quick tiles (faux-glass over the blue hero — translucent fill + sheen + hairline border)
  quickGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  quickTile:         { flexBasis: '48%', flexGrow: 1, borderRadius: 18, padding: 16, minHeight: 112, justifyContent: 'flex-start', overflow: 'hidden', backgroundColor: 'rgba(9,44,86,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)' },
  quickSheen:        { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  quickArt:          { position: 'absolute', right: 6, bottom: 4 },
  quickText:         { paddingRight: 40 },
  quickLabel:        { color: '#fff', fontSize: 17, fontWeight: '700' },
  quickSub:          { color: 'rgba(255,255,255,0.82)', fontSize: 12, marginTop: 4, lineHeight: 16 },

  // Section
  section:           { paddingHorizontal: 16, paddingVertical: 24 },
  sectionAccentBar:  { width: 32, height: 3, borderRadius: 2, backgroundColor: ACCENT, marginTop: 8 },
  sectionTitle:      { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  sectionSub:        { fontSize: 13, color: '#64748b', marginTop: 6 },

  // Featured collection cards
  featured:          { width: 200, height: 154, borderRadius: 18, padding: 16, justifyContent: 'flex-end', overflow: 'hidden', shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  featuredImg:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  featuredScrim:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.34)' },
  featuredBadge:     { position: 'absolute', top: 12, right: 12, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  featuredLabel:     { fontSize: 16, fontWeight: '700' },
  featuredLabelOnImage: { color: '#fff', textShadowColor: 'rgba(0,0,0,0.55)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },

  // Services
  serviceRow:        { flexDirection: 'row', gap: 12 },
  serviceTile:       { flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 22, alignItems: 'center', borderWidth: 1, borderColor: '#eef2f7', shadowColor: '#0f172a', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  serviceLabel:      { fontSize: 13, fontWeight: '600', color: '#0f172a', marginTop: 10, textAlign: 'center' },

  // Budget
  budgetRow:         { flexDirection: 'row', gap: 12 },
  budget:            { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BRAND_TINT, borderRadius: 16, paddingVertical: 18 },
  budgetLabel:       { fontSize: 13, fontWeight: '700', color: BRAND },

  // Benefits
  benefit:           { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 20 },
  benefitIcon:       { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#dbeafe', shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  benefitTitle:      { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  benefitBody:       { fontSize: 13, color: '#64748b', marginTop: 3, lineHeight: 20 },

  // CTA
  ctaCard:           { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND, marginHorizontal: 16, marginVertical: 14, borderRadius: 20, padding: 22, overflow: 'hidden', shadowColor: BRAND_DARK, shadowOpacity: 0.30, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  ctaTitle:          { color: '#fff', fontSize: 19, fontWeight: '800' },
  ctaBody:           { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 7, lineHeight: 18 },
  ctaBtn:            { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, marginTop: 14 },
  ctaBtnText:        { color: BRAND, fontWeight: '700', fontSize: 14 },

  // Recent listings
  center:            { padding: 40, alignItems: 'center' },
  recent:            { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#eef2f7', overflow: 'hidden', shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  recentImg:         { width: 108, height: 108, backgroundColor: '#e2e8f0' },
  noImage:           { alignItems: 'center', justifyContent: 'center' },
  recentBody:        { flex: 1, padding: 14, justifyContent: 'space-between' },
  recentTitle:       { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  recentLoc:         { fontSize: 13, color: '#64748b' },
  recentMetaRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  recentPrice:       { fontSize: 16, fontWeight: '800', color: BRAND },
  recentMeta:        { fontSize: 12, color: '#64748b' },

  // Social
  social:            { alignItems: 'center', paddingTop: 24 },
  socialLabel:       { fontSize: 13, color: '#64748b', fontWeight: '600' },
  socialRow:         { flexDirection: 'row', gap: 16, marginTop: 12 },
  socialBtn:         { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#eef2f7', shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },

  // Footer
  footnote:          { fontSize: 12, textAlign: 'center', color: '#94a3b8', marginTop: 20, marginBottom: 24 },
})
