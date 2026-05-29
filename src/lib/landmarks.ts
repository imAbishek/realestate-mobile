// Curated nearby landmarks per Coimbatore locality.
// Used by the Property Detail screen (Phase C) as a stand-in for the
// Google Places Nearby Search API. Replace with live Places results
// once we have a budget for it (~$17 per 1k requests).
//
// Distances are walking/driving distance from the locality center as
// a human-readable string. Numbers are realistic but not surveyed —
// good enough to give buyers a sense of the area.

export type LandmarkKind = 'hospital' | 'school' | 'mall' | 'transport' | 'food' | 'park' | 'tech'

export type Landmark = {
  name: string
  kind: LandmarkKind
  distance: string  // e.g. "1.2 km", "350 m"
}

// Fallback used when a locality has no curated entries yet.
const GENERIC_COIMBATORE: Landmark[] = [
  { name: 'Brookefields Mall',          kind: 'mall',      distance: '5.5 km'  },
  { name: 'Coimbatore Junction',        kind: 'transport', distance: '6.0 km'  },
  { name: 'PSG Hospitals',              kind: 'hospital',  distance: '4.8 km'  },
  { name: 'Coimbatore Intl. Airport',   kind: 'transport', distance: '12.0 km' },
]

export const COIMBATORE_LANDMARKS: Record<string, Landmark[]> = {
  'rs-puram': [
    { name: 'Cross Cut Road',            kind: 'mall',      distance: '450 m'  },
    { name: 'PSG Hospitals',             kind: 'hospital',  distance: '3.5 km' },
    { name: 'Stanes School',             kind: 'school',    distance: '1.1 km' },
    { name: 'Race Course',               kind: 'park',      distance: '900 m'  },
    { name: 'Gandhipuram Bus Stand',     kind: 'transport', distance: '3.0 km' },
    { name: 'Annapoorna Restaurant',     kind: 'food',      distance: '800 m'  },
  ],
  'saibaba-colony': [
    { name: 'GRD Tower',                 kind: 'mall',      distance: '750 m'  },
    { name: 'KMCH Hospital',             kind: 'hospital',  distance: '1.6 km' },
    { name: 'CMS College',               kind: 'school',    distance: '1.0 km' },
    { name: 'NSR Road Market',           kind: 'mall',      distance: '500 m'  },
    { name: 'Brookefields Mall',         kind: 'mall',      distance: '5.5 km' },
    { name: 'Coimbatore Junction',       kind: 'transport', distance: '5.0 km' },
  ],
  'peelamedu': [
    { name: 'PSG College of Tech',       kind: 'school',    distance: '600 m'  },
    { name: 'Hindustan College',         kind: 'school',    distance: '1.4 km' },
    { name: 'PSG Hospitals',             kind: 'hospital',  distance: '1.2 km' },
    { name: 'Fun Republic Mall',         kind: 'mall',      distance: '2.5 km' },
    { name: 'Singanallur Bus Stand',     kind: 'transport', distance: '3.0 km' },
    { name: 'Coimbatore Intl. Airport',  kind: 'transport', distance: '4.5 km' },
  ],
  'gandhipuram': [
    { name: 'Gandhipuram Bus Stand',     kind: 'transport', distance: '300 m'  },
    { name: '100 Feet Road',             kind: 'mall',      distance: '500 m'  },
    { name: 'Lakshmi Hospital',          kind: 'hospital',  distance: '900 m'  },
    { name: 'Coimbatore Junction',       kind: 'transport', distance: '2.5 km' },
    { name: 'CMS College',               kind: 'school',    distance: '2.2 km' },
    { name: 'Sree Annapoorna Sweets',    kind: 'food',      distance: '600 m'  },
  ],
  'singanallur': [
    { name: 'Singanallur Lake',          kind: 'park',      distance: '700 m'  },
    { name: 'Singanallur Bus Stand',     kind: 'transport', distance: '500 m'  },
    { name: 'Coimbatore Intl. Airport',  kind: 'transport', distance: '3.0 km' },
    { name: 'PSG IMSR',                  kind: 'hospital',  distance: '4.5 km' },
    { name: 'Hindustan College',         kind: 'school',    distance: '4.0 km' },
    { name: 'Fun Republic Mall',         kind: 'mall',      distance: '4.2 km' },
  ],
  'hopes-college': [
    { name: 'Hope College Junction',     kind: 'transport', distance: '300 m'  },
    { name: 'PSG College of Tech',       kind: 'school',    distance: '1.1 km' },
    { name: 'PSG Hospitals',             kind: 'hospital',  distance: '1.4 km' },
    { name: 'Fun Republic Mall',         kind: 'mall',      distance: '2.0 km' },
    { name: 'Coimbatore Intl. Airport',  kind: 'transport', distance: '5.5 km' },
    { name: 'Avinashi Road Market',      kind: 'mall',      distance: '600 m'  },
  ],
  'tidel-park': [
    { name: 'Tidel Park Coimbatore',     kind: 'tech',      distance: '350 m'  },
    { name: 'KGiSL Campus',              kind: 'tech',      distance: '1.0 km' },
    { name: 'KMCH Hospital',             kind: 'hospital',  distance: '6.0 km' },
    { name: 'Brookefields Mall',         kind: 'mall',      distance: '6.5 km' },
    { name: 'Coimbatore Intl. Airport',  kind: 'transport', distance: '7.5 km' },
    { name: 'Hopes College Junction',    kind: 'transport', distance: '5.0 km' },
  ],
  'ramanathapuram': [
    { name: 'Ramanathapuram Bus Stop',   kind: 'transport', distance: '400 m'  },
    { name: 'Sankara Eye Hospital',      kind: 'hospital',  distance: '1.8 km' },
    { name: 'Suguna PIP School',         kind: 'school',    distance: '1.2 km' },
    { name: 'Brookefields Mall',         kind: 'mall',      distance: '3.5 km' },
    { name: 'Coimbatore Junction',       kind: 'transport', distance: '2.8 km' },
    { name: 'Trichy Road',               kind: 'mall',      distance: '500 m'  },
  ],
}

export function getLandmarks(localitySlug?: string | null): Landmark[] {
  if (!localitySlug) return GENERIC_COIMBATORE
  return COIMBATORE_LANDMARKS[localitySlug] ?? GENERIC_COIMBATORE
}

export function landmarkIcon(kind: LandmarkKind): string {
  switch (kind) {
    case 'hospital':  return 'medkit-outline'
    case 'school':    return 'school-outline'
    case 'mall':      return 'bag-handle-outline'
    case 'transport': return 'bus-outline'
    case 'food':      return 'restaurant-outline'
    case 'park':      return 'leaf-outline'
    case 'tech':      return 'business-outline'
  }
}
