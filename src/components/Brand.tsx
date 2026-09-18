import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '@/lib/theme';
export function Brand({
  compact = false,
  wordmarkOnly = false,
}: {
  compact?: boolean;
  wordmarkOnly?: boolean;
}) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="Hashi App" style={styles.wrap}>
      {!wordmarkOnly && (
        <Svg
          width={compact ? 61 : 148}
          height={compact ? 36 : 90}
          viewBox="0 0 160 94"
          fill="none"
          aria-hidden
        >
          <Path
            d="M12 16h83v53H12a7 7 0 0 1-7-7V23a7 7 0 0 1 7-7ZM95 30h31l25 26v13H95V30Z"
            fill={colors.orange}
          />
          <Path d="M105 39h17l17 18h-34V39Z" fill={colors.white} />
          <Rect x="16" y="26" width="67" height="30" rx="2" fill={colors.white} />
          <Path d="M8 70h144" stroke={colors.orange} strokeWidth="7" />
          <Circle cx="35" cy="74" r="14" fill={colors.orange} />
          <Circle cx="35" cy="74" r="6" fill={colors.white} />
          <Circle cx="122" cy="74" r="14" fill={colors.orange} />
          <Circle cx="122" cy="74" r="6" fill={colors.white} />
        </Svg>
      )}
      <Image
        source={require('../../assets/Hashi_App_v1.png')}
        resizeMode="contain"
        accessible={false}
        style={[
          styles.wordmark,
          compact && styles.compactWordmark,
          wordmarkOnly && styles.headerWordmark,
        ]}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { alignItems: 'center', maxWidth: '100%' },
  wordmark: { width: 280, height: 94, maxWidth: '100%' },
  compactWordmark: { width: 132, height: 44 },
  headerWordmark: { width: 144, height: 48 },
});
