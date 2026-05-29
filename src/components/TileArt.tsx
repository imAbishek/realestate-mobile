import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg'

// Decorative vector illustrations for the home-screen quick tiles.
// Hand-built to sit bottom-right on the translucent blue cards — no raster assets.

const ROOF   = '#D85A30' // accent
const WALL   = '#ffffff'
const TRIM   = '#185FA5' // brand
const GOLD   = '#f5c542'
const GOLD_D = '#e0a82e'
const GREEN  = '#5bbf7a'
const LEATHER = '#cf8a45'
const LEATHER_D = '#9c5f26'
const STRAP  = '#7a4a2b'

type ArtProps = { size?: number }

/** Buy — a simple house. */
export function HouseArt({ size = 56 }: ArtProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect x={16} y={30} width={32} height={24} rx={2} fill={WALL} />
      <Path d="M10 32 L32 14 L54 32 Z" fill={ROOF} />
      <Rect x={20} y={36} width={7} height={7} rx={1} fill={TRIM} />
      <Rect x={37} y={36} width={7} height={7} rx={1} fill={TRIM} />
      <Rect x={28} y={43} width={8} height={11} rx={1} fill={TRIM} />
    </Svg>
  )
}

/** Post Property — house with a SALE sign. */
export function SaleHouseArt({ size = 58 }: ArtProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect x={6} y={32} width={26} height={20} rx={2} fill={WALL} />
      <Path d="M2 34 L19 20 L36 34 Z" fill={ROOF} />
      <Rect x={15} y={40} width={8} height={12} rx={1} fill={TRIM} />
      <Rect x={44} y={26} width={3} height={28} rx={1.5} fill={STRAP} />
      <Rect x={37} y={22} width={23} height={15} rx={2} fill={ROOF} />
      <SvgText x={48.5} y={33} fill="#fff" fontSize={9} fontWeight="700" textAnchor="middle">SALE</SvgText>
    </Svg>
  )
}

/** Rent — a golden key. */
export function KeyArt({ size = 54 }: ArtProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx={32} cy={18} r={11} fill="none" stroke={GOLD} strokeWidth={5} />
      <Circle cx={32} cy={18} r={3} fill={GOLD_D} />
      <Rect x={29.5} y={26} width={5} height={28} rx={2} fill={GOLD} />
      <Rect x={34} y={42} width={8} height={4} rx={1} fill={GOLD} />
      <Rect x={34} y={49} width={6} height={4} rx={1} fill={GOLD} />
    </Svg>
  )
}

/** Loan — a wallet with cash and a coin. */
export function WalletArt({ size = 58 }: ArtProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect x={12} y={24} width={40} height={30} rx={5} fill={LEATHER_D} />
      <Rect x={22} y={16} width={22} height={16} rx={2} fill={GREEN} />
      <Circle cx={45} cy={22} r={7} fill={GOLD} stroke={GOLD_D} strokeWidth={2} />
      <Rect x={12} y={32} width={40} height={22} rx={5} fill={LEATHER} />
      <Circle cx={44} cy={43} r={3.5} fill={STRAP} />
    </Svg>
  )
}
