import Constants from 'expo-constants';
import { StyleSheet, Text } from 'react-native';
import { colors } from '@/lib/theme';

export function AppVersion() {
  const config = Constants.expoConfig;
  return (
    <Text style={styles.version} testID="app-version">
      {config?.name ?? 'Hashi App'} · versão {config?.version ?? 'desconhecida'}
      {config?.android?.versionCode != null && ` · compilação ${config.android.versionCode}`}
    </Text>
  );
}

const styles = StyleSheet.create({
  version: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 10,
  },
});
