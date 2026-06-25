import { useEffect, useState } from 'react'
import {
  ActivityIndicator, Image, Linking, Platform, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { HeroCarousel } from '../../src/components/HeroCarousel'
import { CityPickerSheet } from '../../src/components/CityPickerSheet'
import { InfoSheet, type InfoSheetContent } from '../../src/components/InfoSheet'
import { propertyApi } from '../../src/lib/api'
import { useAuthStore } from '../../src/store/authStore'
import { useLocationStore } from '../../src/store/locationStore'
import { colors, fonts, radius, shadow, typography } from '../../src/theme'
import type { ListingType, PriceUnit, PropertyCard } from '../../src/types'

export default function HomeScreen() {
  const router = useRouter()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const city = useLocationStore((s) => s.city)

  const [propertyIdQuery, setPropertyIdQuery] = useState('')
  const [cityPickerOpen, setCityPickerOpen] = useState(false)
  const [recent, setRecent] = useState<PropertyCard[]>([])
  const [heroImages, setHeroImages] = useState<string[]>([])
  const [totalListings, setTotalListings] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await propertyApi.search({ citySlug: city.slug, page: 0, size: 6 })
        setRecent(data.content)
        setTotalListings(data.totalElements)
        // Seed the hero from recent photos immediately so it never starts empty.
        setHeroImages((prev) => prev.length ? prev : photosOf(data.content))
      } catch { /* swallow — home still renders */ }
      finally { setLoading(false) }
    })()
  }, [city.slug])

  // Featured photos for the hero carousel (falls back to recent, then gradient).
  useEffect(() => {
    (async () => {
      try {
        const { data } = await propertyApi.getFeatured()
        const photos = photosOf(data)
        if (photos.length) setHeroImages(photos)
      } catch { /* hero falls back to recent/gradient */ }
    })()
  }, [])

  const goBrowse = (type: ListingType) => router.push({ pathname: '/search', params: { listingType: type } })
  const goSearch = () => {
    const q = propertyIdQuery.trim()
    router.push(q ? { pathname: '/search', params: { q } } : '/search')
  }
  const goPost = () => router.push(isLoggedIn ? '/post' : '/auth/login')
  const goLoan = () => router.push('/emi-calculator')

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
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        {/* Photo-led hero; the photo runs up behind the floating header above and
            the dark card below overflows past the photo's bottom */}
        <HeroCarousel images={heroImages} />
        {/* Frosted-glass card — the hero photo shows through a dark glossy blur */}
        <BlurView
          intensity={Platform.OS === 'android' ? 45 : 30}
          tint="dark"
          style={styles.heroCard}
        >
          <Text style={styles.heroHeadline}>Unlock your Wealth</Text>
          <Text style={styles.heroTagline}>Verified listings · Direct from owners · Zero brokerage</Text>
          <View style={styles.heroAccent} />
          <View style={styles.heroSearch}>
            <Ionicons name="search" size={18} color={colors.mutedLight} />
            <TextInput
              value={propertyIdQuery}
              onChangeText={setPropertyIdQuery}
              onSubmitEditing={goSearch}
              returnKeyType="search"
              placeholder="Search locality, project or Property ID"
              placeholderTextColor={colors.mutedLight}
              style={styles.heroSearchInput}
              numberOfLines={1}
            />
          </View>
        </BlurView>

        {/* Quick actions + stats sit on a soft grey band */}
        <View style={styles.quickStatsBand}>
          {/* Quick actions — flat tinted circular buttons */}
          <View style={styles.quickRow}>
            <QuickAction icon="home-outline"     label="Buy"  onPress={() => goBrowse('SALE')} />
            <QuickAction icon="key-outline"      label="Rent" onPress={() => goBrowse('RENT')} />
            <QuickAction icon="pricetag-outline" label="Post" onPress={goPost} />
            <QuickAction icon="card-outline"     label="Loan" onPress={goLoan} />
          </View>

          {/* Trust / stats card */}
          <View style={styles.statsCard}>
            <Stat icon="business"         value={totalListings != null ? `${totalListings}+` : '—'} label="Listings" />
            <View style={styles.statDivider} />
            <Stat icon="shield-checkmark" value="100%"      label="Verified" />
            <View style={styles.statDivider} />
            <Stat icon="location"         value={city.name} label="& expanding" />
          </View>
        </View>

        {/* Featured Collections */}
        <Section title="Featured Collections" subtitle="All in one best spaces." bleed>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 12 }}>
            {(recent.length ? recent : [undefined, undefined, undefined]).slice(0, 6).map((p, i) => (
              <FeaturedCollectionCard
                key={p?.id ?? i}
                imageUrl={p?.primaryImageUrl}
                onPress={() => p ? router.push(`/properties/${p.id}`) : goBrowse('SALE')}
              />
            ))}
          </ScrollView>
        </Section>

        {/* Services */}
        <Section title="Services" subtitle="All your needs covered here." background="#f4f6f9">
          <View style={styles.serviceRow}>
            <ServiceTile icon="calculator-outline" label="EMI Calculator" onPress={() => router.push('/emi-calculator')} />
            <ServiceTile icon="cash-outline"        label="Home Loan"     onPress={() => goService('Home Loan')} />
            <ServiceTile icon="brush-outline"       label="Interior Design" onPress={() => goService('Interior Design')} />
          </View>
        </Section>

        {/* Customize Budget */}
        <Section title="Customize Budget" subtitle="Affordable options, just for you." background={colors.white}>
          <View style={styles.budgetRow}>
            <BudgetChip label="Under 10L" onPress={() => goBudget('Under 10L')} />
            <BudgetChip label="10L – 20L" onPress={() => goBudget('10L–20L')} />
            <BudgetChip label="20L – 50L" onPress={() => goBudget('20L–50L')} />
          </View>
        </Section>

        {/* Why Choose Us */}
        <Section title="Why Choose Us?" background="#f4f6f9">
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
              <Ionicons name="arrow-forward" size={15} color={colors.accent} />
            </Pressable>
          </View>
          <Ionicons name="business" size={72} color="rgba(255,255,255,0.35)" />
        </View>

        {/* Recent listings */}
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>
        ) : recent.length > 0 ? (
          <Section title={`Recent in ${city.name}`} background={colors.white}>
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

        <Text style={styles.footnote}>Made with <Text style={{ color: colors.accent }}>♥</Text> for real estate investments</Text>
      </ScrollView>

      {/* Floating header — sits ON TOP of the hero photo, which runs up behind it.
          Its rounded bottom corners reveal the photo (not white) for a seamless join. */}
      <LinearGradient colors={['#0c3a68', '#185FA5']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.topBarInner}>
            <Pressable style={styles.locationPill} onPress={() => setCityPickerOpen(true)}>
              <Ionicons name="location" size={15} color="#fff" />
              <View>
                <Text style={styles.locationCity}>{city.name}, {city.state}</Text>
                <Text style={styles.subState}>{city.state}</Text>
              </View>
            </Pressable>
            <Pressable style={styles.bellBtn}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              <View style={styles.bellDot} />
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <CityPickerSheet visible={cityPickerOpen} onClose={() => setCityPickerOpen(false)} />
      <InfoSheet
        visible={info !== null}
        onClose={() => setInfo(null)}
        {...(info ?? { title: '', body: '' })}
      />
    </View>
  )
}

// ─── helpers ────────────────────────────────────────────────────

// Pull non-empty primary-image URLs off a list of cards.
function photosOf(cards: PropertyCard[]): string[] {
  return cards.map((c) => c.primaryImageUrl).filter((u): u is string => !!u)
}

// ─── components ─────────────────────────────────────────────────

function QuickAction({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.7 }]}>
      <View style={styles.quickCircle}>
        <Ionicons name={icon} size={32} color={colors.brand} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  )
}

function Stat({ icon, value, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={20} color={colors.brand} />
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    </View>
  )
}

function Section({ title, subtitle, background = colors.white, bleed = false, children }: { title: string; subtitle?: string; background?: string; bleed?: boolean; children: React.ReactNode }) {
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

function FeaturedCollectionCard({ imageUrl, onPress }: { imageUrl?: string | null; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.featured, pressed && { opacity: 0.9 }]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.featuredImg} resizeMode="cover" />
      ) : (
        <View style={[styles.featuredImg, styles.noImage, { backgroundColor: colors.brandTint }]}>
          <Ionicons name="image-outline" size={36} color={colors.mutedLight} />
        </View>
      )}
      {/* Orange circular agent badge, top-right */}
      <View style={styles.featuredBadge}>
        <Ionicons name="person" size={13} color="#fff" />
      </View>
    </Pressable>
  )
}

function ServiceTile({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.serviceTile, pressed && { opacity: 0.85 }]}>
      <View style={styles.serviceIcon}><Ionicons name={icon} size={24} color={colors.brand} /></View>
      <Text style={styles.serviceLabel}>{label}</Text>
    </Pressable>
  )
}

function BudgetChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.budget, pressed && { opacity: 0.85 }]}>
      <View style={styles.budgetIcon}><Ionicons name="wallet" size={18} color={colors.brand} /></View>
      <Text style={styles.budgetLabel}>{label}</Text>
    </Pressable>
  )
}

function Benefit({ icon, title, body }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; body: string }) {
  return (
    <View style={styles.benefit}>
      <View style={styles.benefitIcon}><Ionicons name={icon} size={20} color={colors.brand} /></View>
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
        <View style={[styles.recentImg, styles.noImage]}><Ionicons name="image-outline" size={24} color={colors.mutedLight} /></View>
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
  // Floating top bar — absolute overlay above the hero photo, rounded bottom
  header:            { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, elevation: 12, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, overflow: 'hidden' },
  topBarInner:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12 },
  locationPill:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationCity:      { color: '#fff', fontFamily: fonts.bold, fontSize: 18, lineHeight: 22 },
  subState:          { color: 'rgba(255,255,255,0.7)', fontFamily: fonts.medium, fontSize: 11, marginTop: 0 },
  bellBtn:           { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  bellDot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, position: 'absolute', top: 7, right: 7, borderWidth: 1.5, borderColor: colors.brand },

  // Dark charcoal hero card — overlaps the photo bottom and hangs below it
  heroCard:          { marginHorizontal: 14, marginTop: -114, borderRadius: 26, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 20, zIndex: 5, overflow: 'hidden', backgroundColor: 'rgba(17,19,24,0.42)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  heroHeadline:      { fontFamily: fonts.extra, fontSize: 28, color: colors.white, letterSpacing: 0.2 },
  heroTagline:       { fontFamily: fonts.medium, fontSize: 12, color: 'rgba(255,255,255,0.82)', marginTop: 6 },
  heroAccent:        { width: 46, height: 4, borderRadius: 2, backgroundColor: colors.accent, marginTop: 10, marginBottom: 16 },
  heroSearch:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 15 },
  heroSearchInput:   { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.ink, padding: 0 },

  // Light-grey band behind the quick-actions + stats card
  quickStatsBand:    { backgroundColor: '#f4f6f9' },

  // Quick actions — flat light-blue tinted circular buttons
  quickRow:          { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingTop: 22, paddingBottom: 10 },
  quickAction:       { alignItems: 'center', gap: 9 },
  quickCircle:       { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dbe7f5' },
  quickLabel:        { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },

  // Trust / stats card
  statsCard:         { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, marginHorizontal: 16, marginTop: 4, marginBottom: 18, borderRadius: radius.lg, paddingVertical: 18, borderWidth: 1, borderColor: colors.borderLight, ...shadow.card },
  stat:              { flex: 1, alignItems: 'center', gap: 5 },
  statValue:         { fontFamily: fonts.extra, fontSize: 18, color: colors.ink },
  statLabel:         { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  statDivider:       { width: 1, height: 40, backgroundColor: colors.borderLight },

  // Section
  section:           { paddingHorizontal: 16, paddingVertical: 24 },
  sectionAccentBar:  { width: 32, height: 3, borderRadius: 2, backgroundColor: colors.accent, marginTop: 8 },
  sectionTitle:      { ...typography.h2 },
  sectionSub:        { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 6 },

  // Featured collection cards — photo + orange agent badge
  featured:          { width: 200, height: 150, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.brandTint, ...shadow.card },
  featuredImg:       { width: '100%', height: '100%' },
  featuredBadge:     { position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },

  // Services — white card with a flat light-blue icon circle (matches quick actions)
  serviceRow:        { flexDirection: 'row', gap: 12 },
  serviceTile:       { flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, paddingVertical: 18, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.borderLight, ...shadow.card },
  serviceIcon:       { width: 52, height: 52, borderRadius: 26, backgroundColor: '#dbe7f5', alignItems: 'center', justifyContent: 'center' },
  serviceLabel:      { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink, textAlign: 'center' },

  // Budget — white card + light-blue icon circle (was a flat blue pill)
  budgetRow:         { flexDirection: 'row', gap: 12 },
  budget:            { flex: 1, alignItems: 'center', gap: 8, backgroundColor: colors.white, borderRadius: radius.lg, paddingVertical: 16, borderWidth: 1, borderColor: colors.borderLight, ...shadow.card },
  budgetIcon:        { width: 40, height: 40, borderRadius: 20, backgroundColor: '#dbe7f5', alignItems: 'center', justifyContent: 'center' },
  budgetLabel:       { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },

  // Benefits — flat light-blue icon circle (matches quick actions)
  benefit:           { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 20 },
  benefitIcon:       { width: 46, height: 46, borderRadius: 23, backgroundColor: '#dbe7f5', alignItems: 'center', justifyContent: 'center' },
  benefitTitle:      { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  benefitBody:       { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 3, lineHeight: 20 },

  // CTA
  ctaCard:           { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.brand, marginHorizontal: 16, marginVertical: 14, borderRadius: radius.xl, padding: 22, overflow: 'hidden', ...shadow.cta },
  ctaTitle:          { color: '#fff', fontFamily: fonts.extra, fontSize: 19 },
  ctaBody:           { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.regular, fontSize: 13, marginTop: 7, lineHeight: 18 },
  ctaBtn:            { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.pill, marginTop: 14 },
  ctaBtnText:        { color: colors.brand, fontFamily: fonts.bold, fontSize: 14 },

  // Recent listings
  center:            { padding: 40, alignItems: 'center' },
  recent:            { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.md, marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight, overflow: 'hidden', ...shadow.card },
  recentImg:         { width: 108, height: 108, backgroundColor: colors.border },
  noImage:           { alignItems: 'center', justifyContent: 'center' },
  recentBody:        { flex: 1, padding: 14, justifyContent: 'space-between' },
  recentTitle:       { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  recentLoc:         { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  recentMetaRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  recentPrice:       { fontFamily: fonts.extra, fontSize: 16, color: colors.brand },
  recentMeta:        { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },

  // Social
  social:            { alignItems: 'center', paddingTop: 24 },
  socialLabel:       { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  socialRow:         { flexDirection: 'row', gap: 16, marginTop: 12 },
  socialBtn:         { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderLight, ...shadow.card },

  // Footer
  footnote:          { fontFamily: fonts.regular, fontSize: 12, textAlign: 'center', color: colors.mutedLight, marginTop: 20, marginBottom: 24 },
})
