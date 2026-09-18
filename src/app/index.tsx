import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand } from '@/components/Brand';
import { Button } from '@/components/Button';
import { colors } from '@/lib/theme';
import { useAuth } from '@/providers/AuthProvider';
import { isConfigured } from '@/lib/supabase';
export default function Welcome() {
  const router = useRouter();
  const { loading, session, demo, enterDemo } = useAuth();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topLine} />
      <View style={styles.page}>
        <View style={styles.brand}>
          <Brand />
          <Text style={styles.tagline}>Gestão simples da sua frota.</Text>
          <Text style={styles.description}>
            {'Sua equipe em campo.\nTudo registrado em um só lugar.'}
          </Text>
        </View>
        <View style={styles.actions}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.orange} />
          ) : (
            <Button
              title="Entrar"
              icon="arrow"
              onPress={() => router.push(session || demo ? '/inicio' : '/login')}
            />
          )}
          {__DEV__ && !isConfigured && (
            <Button
              secondary
              title="Conhecer as telas"
              onPress={() => {
                enterDemo();
                router.push('/inicio');
              }}
            />
          )}
          <Text style={styles.footer}>HASHIMOTO · USO INTERNO</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  topLine: { height: 8, backgroundColor: colors.navy },
  page: { flex: 1, width: '100%', maxWidth: 500, alignSelf: 'center', padding: 32 },
  brand: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 45 },
  tagline: { fontSize: 18, fontWeight: '700', color: colors.navy, marginTop: 45 },
  description: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    color: colors.muted,
    marginTop: 13,
  },
  actions: { gap: 13, paddingBottom: 15 },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    letterSpacing: 1.7,
    color: colors.muted,
    marginTop: 14,
  },
});
