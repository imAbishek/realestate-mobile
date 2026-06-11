import { create } from 'zustand'

/**
 * Currently selected city. PropFind launches in Coimbatore, but the brand is
 * location-neutral — supported cities come from `/search/cities` (`active` flag)
 * and this list grows as we expand. Unsupported detections get a friendly
 * "expanding soon" state in the picker instead of a dead end.
 */
export interface SelectedCity {
  name: string
  slug: string
  state: string
}

export const DEFAULT_CITY: SelectedCity = { name: 'Coimbatore', slug: 'coimbatore', state: 'Tamil Nadu' }

interface LocationState {
  city: SelectedCity
  setCity: (city: SelectedCity) => void
}

export const useLocationStore = create<LocationState>((set) => ({
  city: DEFAULT_CITY,
  setCity: (city) => set({ city }),
}))
