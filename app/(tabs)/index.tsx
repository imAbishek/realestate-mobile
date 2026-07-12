import { useCallback, useEffect, useState } from 'react'
import {
  Image, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { HeroCarousel } from '../../src/components/HeroCarousel'
import { ListSkeleton } from '../../src/components/Skeleton'
import { CityPickerSheet } from '../../src/components/CityPickerSheet'
import { NotificationsSheet } from '../../src/components/NotificationsSheet'
import { InfoSheet, type InfoSheetContent } from '../../src/components/InfoSheet'
import { propertyApi, favoritesApi } from '../../src/lib/api'
import { appAlert } from '../../src/components/AppAlert'
import { useAuthStore } from '../../src/store/authStore'
import { useLocationStore } from '../../src/store/locationStore'
import { colors, fonts, radius, shadow, typography } from '../../src/theme'
import type { ListingType, PriceUnit, PropertyCard } from '../../src/types'

export default function HomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
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

  // Bell opens a client-derived feed (NotificationsSheet). ponytail: unread dot
  // stays off — no server-side read tracking yet; wire when push notifications land.
  const [notifOpen, setNotifOpen] = useState(false)
  const hasNotification = false

  // Featured-card hearts — one saved-ids set, refreshed on focus (Saved tab can
  // change it), optimistic toggle with revert on failure.
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  useFocusEffect(useCallback(() => {
    if (!isLoggedIn) { setSavedIds(new Set()); return }
    let mounted = true
    ;(async () => {
      try {
        const { data } = await favoritesApi.listMine(0, 50)
        if (mounted) setSavedIds(new Set(data.content.map((p) => p.id)))
      } catch { /* hearts just start unfilled */ }
    })()
    return () => { mounted = false }
  }, [isLoggedIn]))

  const toggleSave = useCallback(async (id: string) => {
    if (!isLoggedIn) { router.push('/auth/login'); return }
    const wasSaved = savedIds.has(id)
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (wasSaved) next.delete(id); else next.add(id)
      return next
    })
    try {
      if (wasSaved) await favoritesApi.remove(id)
      else await favoritesApi.add(id)
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev)
        if (wasSaved) next.add(id); else next.delete(id)
        return next
      })
      appAlert('Could not update', 'Please try again.')
    }
  }, [isLoggedIn, savedIds, router])

  // Branded "coming soon" sheet instead of a bare Alert box.
  const [info, setInfo] = useState<InfoSheetContent | null>(null)
  const goBudget = (label: string) => setInfo({
    icon: 'wallet-outline', title: `Budget: ${label}`,
    body: 'Budget-filtered browsing is coming soon. For now, explore every listing and sort by what fits you.',
    actionLabel: 'Browse all listings', onAction: () => router.push('/search'),
  })

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 44 }} showsVerticalScrollIndicator={false}>
        {/* Photo-led hero; the photo runs up behind the fixed header above.
            Headline, trust badges and CTA sit directly on the photo. */}
        <View style={styles.heroWrap}>
          <HeroCarousel images={heroImages} />
          <View style={styles.heroOverlay} pointerEvents="box-none">
            <LinearGradient
              colors={['transparent', 'rgba(15,51,47,0.92)']}
              style={styles.heroOverlayScrim}
              pointerEvents="none"
            />
            <View style={styles.heroContent}>
              <Text style={styles.heroHeadline}>Find Your{'\n'}Dream Property</Text>
              <View style={styles.trustRow}>
                <TrustBadge icon="shield-checkmark-outline" label="Verified Listings" />
                <TrustBadge icon="person-outline"          label="Direct Owners" />
              </View>
              <View style={styles.heroAccent} />
              <Pressable
                onPress={() => router.push('/search')}
                style={({ pressed }) => [styles.exploreBtn, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.exploreText}>Explore Properties</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.brand} style={styles.exploreIcon} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Search + quick actions + stats sit on the ivory band */}
        <View style={styles.quickStatsBand}>
          {/* Search — white pill overlapping up under the hero */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={21} color={colors.brand} />
            <TextInput
              value={propertyIdQuery}
              onChangeText={setPropertyIdQuery}
              onSubmitEditing={goSearch}
              returnKeyType="search"
              placeholder="Search locality, project or property"
              placeholderTextColor={colors.mutedLight}
              style={styles.searchInput}
              numberOfLines={1}
            />
          </View>
          {/* Quick actions — sage card with vertical dividers between each */}
          <View style={styles.quickCard}>
            <QuickAction icon="home-outline"     label="Buy"  onPress={() => goBrowse('SALE')} />
            <View style={styles.quickDivider} />
            <QuickAction icon="key-outline"      label="Rent" onPress={() => goBrowse('RENT')} />
            <View style={styles.quickDivider} />
            <QuickAction icon="pricetag-outline" label="Post Property" onPress={goPost} />
            <View style={styles.quickDivider} />
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

        {/* Featured Properties */}
        <Section title="Featured Properties" bleed action={{ label: 'View All', onPress: () => router.push('/search') }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 12 }}>
            {(recent.length ? recent : [undefined, undefined, undefined]).slice(0, 6).map((p, i) => (
              <FeaturedCollectionCard
                key={p?.id ?? i}
                property={p}
                saved={p ? savedIds.has(p.id) : false}
                onToggleSave={toggleSave}
                onPress={() => p ? router.push(`/properties/${p.id}`) : goBrowse('SALE')}
              />
            ))}
          </ScrollView>
        </Section>

        {/* Customize Budget */}
        <Section title="Customize Budget" background={colors.bg}>
          <View style={styles.budgetRow}>
            <BudgetChip label="Under 10L" onPress={() => goBudget('Under 10L')} />
            <BudgetChip label="10L – 20L" onPress={() => goBudget('10L–20L')} />
            <BudgetChip label="20L – 50L" onPress={() => goBudget('20L–50L')} />
          </View>
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
          <ListSkeleton count={3} />
        ) : recent.length > 0 ? (
          <Section title={`Recent in ${city.name}`} background={colors.white}>
            {recent.map((p) => (
              <RecentRow key={p.id} item={p} onPress={() => router.push(`/properties/${p.id}`)} />
            ))}
          </Section>
        ) : null}
      </ScrollView>

      {/* Fixed header — pinned on top of the hero photo, which runs up behind it. */}
      <LinearGradient colors={['#0f332f', '#184A45']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.topBarInner}>
            <Pressable style={styles.locationPill} onPress={() => setCityPickerOpen(true)}>
              <Ionicons name="location" size={15} color="#fff" />
              <View>
                <Text style={styles.locationCity}>{city.name}, {city.state}</Text>
                <Text style={styles.subState}>{city.state}</Text>
              </View>
            </Pressable>
            <Pressable style={styles.bellBtn} onPress={() => setNotifOpen(true)} hitSlop={6}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              {hasNotification && <View style={styles.bellDot} />}
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <CityPickerSheet visible={cityPickerOpen} onClose={() => setCityPickerOpen(false)} />
      <NotificationsSheet visible={notifOpen} onClose={() => setNotifOpen(false)} />
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
        <Ionicons name={icon} size={25} color={colors.brand} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  )
}

function TrustBadge({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <View style={styles.trustBadge}>
      <Ionicons name={icon} size={15} color={colors.accent} />
      <Text style={styles.trustText} numberOfLines={1}>{label}</Text>
    </View>
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

function Section({ title, subtitle, background = colors.white, bleed = false, action, children }: { title: string; subtitle?: string; background?: string; bleed?: boolean; action?: { label: string; onPress: () => void }; children: React.ReactNode }) {
  const headerPad = bleed ? { paddingHorizontal: 16 } : null
  return (
    <View style={[styles.section, bleed && { paddingHorizontal: 0 }, { backgroundColor: background }]}>
      <View style={[styles.sectionHeaderRow, headerPad]}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action ? (
          <Pressable onPress={action.onPress} hitSlop={8} style={({ pressed }) => [styles.sectionAction, pressed && { opacity: 0.7 }]}>
            <Text style={styles.sectionActionText}>{action.label}</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.accent} />
          </Pressable>
        ) : null}
      </View>
      <View style={[styles.sectionAccentBar, bleed && { marginLeft: 16 }]} />
      {subtitle ? <Text style={[styles.sectionSub, headerPad]}>{subtitle}</Text> : null}
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  )
}

function FeaturedCollectionCard({ property, saved, onToggleSave, onPress }: { property?: PropertyCard; saved: boolean; onToggleSave: (id: string) => void; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.featured, pressed && { opacity: 0.9 }]}>
      {property?.primaryImageUrl ? (
        <Image source={{ uri: property.primaryImageUrl }} style={styles.featuredImg} resizeMode="cover" />
      ) : (
        <View style={[styles.featuredImg, styles.noImage, { backgroundColor: colors.brandTint }]}>
          <Ionicons name="image-outline" size={36} color={colors.mutedLight} />
        </View>
      )}
      {property ? (
        <>
          {/* Verified / Premium badge, top-left — per the Green Growth mock */}
          <View style={[styles.featuredBadge, property.isFeatured && styles.featuredBadgePremium]}>
            <Ionicons name={property.isFeatured ? 'diamond' : 'shield-checkmark'} size={10} color="#fff" />
            <Text style={styles.featuredBadgeText}>{property.isFeatured ? 'Premium' : 'Verified'}</Text>
          </View>
          {/* Heart, top-right — frosted circle per the Green Growth mock */}
          <Pressable
            onPress={() => onToggleSave(property.id)}
            hitSlop={8}
            style={({ pressed }) => [styles.featuredHeart, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name={saved ? 'heart' : 'heart-outline'} size={16} color={saved ? colors.accent : '#fff'} />
          </Pressable>
          {/* Bottom scrim so white text stays legible over any photo */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.78)']}
            style={styles.featuredScrim}
            pointerEvents="none"
          />
          <View style={styles.featuredInfo}>
            <Text style={styles.featuredPrice}>{formatPrice(property.price, property.priceUnit)}</Text>
            <Text style={styles.featuredTitle} numberOfLines={1}>{property.title}</Text>
            <View style={styles.featuredLocRow}>
              <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.85)" />
              <Text style={styles.featuredLoc} numberOfLines={1}>{property.localityName}, {property.cityName}</Text>
            </View>
          </View>
        </>
      ) : null}
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

function formatPrice(price: number, unit: PriceUnit): string {
  if (unit === 'PER_MONTH') return `₹${price.toLocaleString('en-IN')}/mo`
  if (unit === 'PER_SQFT')  return `₹${price.toLocaleString('en-IN')}/sqft`
  if (price >= 10_000_000)  return `₹${(price / 10_000_000).toFixed(2)} Cr`
  if (price >= 100_000)     return `₹${(price / 100_000).toFixed(2)} L`
  return `₹${price.toLocaleString('en-IN')}`
}

const styles = StyleSheet.create({
  // Fixed top bar — absolute overlay above the hero photo, rounded bottom
  header:            { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, elevation: 12, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, overflow: 'hidden' },
  topBarInner:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12 },
  locationPill:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationCity:      { color: '#fff', fontFamily: fonts.display, fontSize: 18, lineHeight: 24 },
  subState:          { color: 'rgba(255,255,255,0.7)', fontFamily: fonts.medium, fontSize: 11, marginTop: 0 },
  bellBtn:           { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  bellDot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, position: 'absolute', top: 7, right: 7, borderWidth: 1.5, borderColor: colors.brand },

  // Hero content sits directly on the photo (bottom-anchored over a forest scrim)
  heroWrap:          { position: 'relative' },
  heroOverlay:       { position: 'absolute', left: 0, right: 0, bottom: 0, justifyContent: 'flex-end' },
  heroOverlayScrim:  { position: 'absolute', left: 0, right: 0, bottom: 0, height: 260 },
  heroContent:       { paddingHorizontal: 22, paddingBottom: 26 },
  heroHeadline:      { fontFamily: fonts.display, fontSize: 30, lineHeight: 38, color: colors.white },
  trustRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 14 },
  trustBadge:        { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText:         { fontFamily: fonts.semibold, fontSize: 12, color: 'rgba(255,255,255,0.92)' },
  heroAccent:        { width: 46, height: 4, borderRadius: 2, backgroundColor: colors.accent, marginTop: 14 },
  exploreBtn:        { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: colors.accent, paddingHorizontal: 20, paddingVertical: 14, borderRadius: radius.sm, marginTop: 13, ...shadow.cta },
  exploreText:       { fontFamily: fonts.bold, fontSize: 14, lineHeight: 18, color: colors.brand, includeFontPadding: false },
  exploreIcon:       { marginTop: 1 },

  // Search — ivory pill with a forest border (per the mock) + a soft lift
  searchBar:         { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bg, borderRadius: radius.pill, paddingLeft: 14, paddingRight: 20, paddingVertical: 15, marginHorizontal: 16, marginTop: 18, borderWidth: 1.5, borderColor: colors.brand, ...shadow.card },
  searchInput:       { flex: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.ink, padding: 0, includeFontPadding: false, textAlignVertical: 'center' },

  // Light-grey band behind the quick-actions + stats card
  quickStatsBand:    { backgroundColor: '#F7F3ED' },

  // Quick actions — sage card, small circles, faint vertical dividers between
  quickCard:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F6F3ED', marginHorizontal: 16, marginTop: 16, marginBottom: 8, borderRadius: radius.lg, paddingVertical: 18, borderWidth: 1, borderColor: '#e2e7da', ...shadow.card },
  quickDivider:      { width: 1, height: 56, backgroundColor: '#dce2d3' },
  quickAction:       { flex: 1, alignItems: 'center', gap: 9 },
  quickCircle:       { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: '#cfd9c3' },
  quickLabel:        { fontFamily: fonts.semibold, fontSize: 12, color: colors.brand },

  // Trust / stats card
  statsCard:         { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, marginHorizontal: 16, marginTop: 20, marginBottom: 18, borderRadius: radius.lg, paddingVertical: 18, borderWidth: 1, borderColor: colors.borderLight, ...shadow.card },
  stat:              { flex: 1, alignItems: 'center', gap: 5 },
  statValue:         { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  statLabel:         { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  statDivider:       { width: 1, height: 40, backgroundColor: colors.borderLight },

  // Section
  section:           { paddingHorizontal: 16, paddingVertical: 24 },
  sectionHeaderRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionAccentBar:  { width: 32, height: 3, borderRadius: 2, backgroundColor: colors.accent, marginTop: 8 },
  sectionTitle:      { ...typography.h2 },
  sectionAction:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionActionText: { fontFamily: fonts.bold, fontSize: 13, color: colors.accent },
  sectionSub:        { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 6 },

  // Featured collection cards — photo + bottom scrim with price/title/location
  featured:          { width: 200, height: 150, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.brandTint, ...shadow.card },
  featuredImg:       { width: '100%', height: '100%' },
  featuredBadge:        { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.brand, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill },
  featuredBadgePremium: { backgroundColor: colors.accent },
  featuredBadgeText:    { fontFamily: fonts.semibold, fontSize: 10, color: '#fff', lineHeight: 13, includeFontPadding: false },
  featuredHeart:        { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.3)' },
  featuredScrim:     { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90 },
  featuredInfo:      { position: 'absolute', left: 10, right: 10, bottom: 10, gap: 2 },
  featuredPrice:     { fontFamily: fonts.extra, fontSize: 16, color: '#fff' },
  featuredTitle:     { fontFamily: fonts.bold, fontSize: 13, color: '#fff' },
  featuredLocRow:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  featuredLoc:       { fontFamily: fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.85)', flexShrink: 1 },

  // Budget — white card + sage icon circle
  budgetRow:         { flexDirection: 'row', gap: 12 },
  budget:            { flex: 1, alignItems: 'center', gap: 8, backgroundColor: colors.white, borderRadius: radius.lg, paddingVertical: 16, borderWidth: 1, borderColor: colors.borderLight, ...shadow.card },
  budgetIcon:        { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e6ece1', alignItems: 'center', justifyContent: 'center' },
  budgetLabel:       { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },

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
})
