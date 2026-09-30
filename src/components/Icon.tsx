import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '@/lib/theme';
export type IconName =
  | 'clipboard'
  | 'truck'
  | 'wrench'
  | 'history'
  | 'menu'
  | 'chevron'
  | 'search'
  | 'filter'
  | 'close'
  | 'calendar'
  | 'check'
  | 'logout'
  | 'home'
  | 'alert'
  | 'arrow'
  | 'lock'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'eye'
  | 'eye-off';
const paths: Record<Exclude<IconName, 'clipboard' | 'search' | 'calendar'>, string> = {
  truck:
    'M3 17H2V5h12v12H8M14 9h4l4 4v4h-1M14 17h2M17 9v4h5M8 17a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM21 17a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
  wrench: 'M14.5 5.5a5 5 0 0 0-6 6L3 17a2.8 2.8 0 0 0 4 4l5.5-5.5a5 5 0 0 0 6-6l-3 3-4-4 3-3Z',
  history: 'M3 11a9 9 0 1 1 2.8 7M3 4v7h7M12 7v5l3 2',
  menu: 'M4 6h16M4 12h16M4 18h16',
  chevron: 'm9 5 7 7-7 7',
  filter: 'M3 4h18l-7 8v7l-4 2v-9L3 4Z',
  close: 'm6 6 12 12M6 18 18 6',
  check: 'm4 12 5 5L20 6',
  logout: 'M10 4H4v16h6M14 8l4 4-4 4M8 12h11',
  home: 'm3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10',
  alert: 'm12 3 10 18H2L12 3ZM12 9v5M12 17h.01',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  lock: 'M6 10h12v11H6V10Zm2 0V6a4 4 0 0 1 8 0v4',
  plus: 'M12 5v14M5 12h14',
  edit: 'm15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-4-4L5 15l-1 5Z',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  'eye-off':
    'm3 3 18 18M10.6 5.1 12 5c6.5 0 10 7 10 7a21 21 0 0 1-3 3.8M6.2 6.2A22 22 0 0 0 2 12s3.5 7 10 7a11 11 0 0 0 5.8-1.8M10 10a2.8 2.8 0 0 0 4 4',
};
export function Icon({
  name,
  size = 24,
  color = colors.navy,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {name === 'clipboard' ? (
        <>
          <Rect x="5" y="4" width="14" height="18" rx="2" />
          <Rect x="9" y="2" width="6" height="4" rx="1" fill={colors.white} />
          <Path d="M9 11h6M9 15h6M9 19h4" />
        </>
      ) : name === 'search' ? (
        <>
          <Circle cx="10.5" cy="10.5" r="6.5" />
          <Path d="m16 16 5 5" />
        </>
      ) : name === 'calendar' ? (
        <>
          <Rect x="3" y="5" width="18" height="16" rx="2" />
          <Path d="M7 3v4M17 3v4M3 10h18" />
        </>
      ) : (
        <Path d={paths[name]} />
      )}
    </Svg>
  );
}
