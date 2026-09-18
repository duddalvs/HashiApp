import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/lib/theme';
import { Icon, type IconName } from './Icon';
export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  secondary = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  secondary?: boolean;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        (disabled || loading) && { opacity: 0.6 },
        pressed && { opacity: 0.8 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : icon ? (
        <Icon name={icon} color={colors.white} size={22} />
      ) : null}
      <Text style={styles.text}>{loading ? 'Aguarde…' : title}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 13,
    backgroundColor: colors.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  secondary: { backgroundColor: colors.navy },
  text: { color: colors.white, fontSize: 16, fontWeight: '800', textAlign: 'center' },
});
