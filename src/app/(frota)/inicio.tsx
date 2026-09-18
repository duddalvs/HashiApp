import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/Icon';
import { CardWave, HomeArtwork } from '@/components/HomeArtwork';
import { colors } from '@/lib/theme';
import { useAuth } from '@/providers/AuthProvider';

export default function Home() {
  const router = useRouter();
  const { profile, demo } = useAuth();
  const { width } = useWindowDimensions();
  const compact = width < 370;
  const firstName = demo ? 'equipe' : profile?.nome.trim().split(/\s+/)[0] || 'equipe';
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.page}>
      <View style={styles.intro}>
        <View style={styles.introCopy}>
          <View style={styles.greetingAccent} />
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            style={[styles.greeting, compact && styles.smallGreeting]}
          >
            Olá, {firstName}!
          </Text>
          <Text style={styles.subtitle}>O que vamos registrar hoje?</Text>
        </View>
        <View pointerEvents="none" style={[styles.artwork, compact && styles.smallArtwork]}>
          <HomeArtwork />
        </View>
      </View>
      <View style={styles.cards}>
        {(
          [
            {
              title: 'Alocação',
              subtitle: 'Equipe e veículo',
              icon: 'truck',
              route: '/registro',
              tint: '#fff2e7',
              ink: '#ed5b08',
              wave: '#fff2e7',
            },
            {
              title: 'Manutenção',
              subtitle: 'Serviço e custo',
              icon: 'wrench',
              route: '/manutencao',
              tint: '#eff3f6',
              ink: colors.navy,
              wave: '#f0f4f7',
            },
          ] as const
        ).map((card) => (
          <Pressable
            key={card.route}
            accessibilityRole="button"
            accessibilityLabel={`${card.title}, ${card.subtitle}`}
            onPress={() => router.navigate(card.route)}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View pointerEvents="none" style={styles.cardWave}>
              <CardWave color={card.wave} />
            </View>
            <View style={styles.cardTop}>
              <View style={[styles.circle, { backgroundColor: card.tint }]}>
                <Icon name={card.icon} size={31} color={card.ink} />
              </View>
              <View style={styles.arrowCircle}>
                <Icon name="arrow" size={20} color={colors.navy} />
              </View>
            </View>
            <View style={styles.cardCopy}>
              <Text style={[styles.cardTitle, compact && styles.smallCardTitle]}>{card.title}</Text>
              <Text style={styles.cardSub}>{card.subtitle}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Histórico, consulte os registros enviados"
        onPress={() => router.navigate('/historico')}
        style={({ pressed }) => [styles.history, pressed && styles.pressed]}
      >
        <View pointerEvents="none" style={styles.historyWave}>
          <CardWave color="#f0f4f7" />
        </View>
        <View style={styles.historyCircle}>
          <Icon name="history" size={34} color={colors.navy} />
        </View>
        <View style={styles.historyCopy}>
          <Text style={styles.historyTitle}>Histórico</Text>
          <Text style={styles.historySub}>Consulte os registros enviados</Text>
        </View>
        <View style={styles.arrowCircle}>
          <Icon name="arrow" size={20} color={colors.navy} />
        </View>
      </Pressable>
      <View style={styles.tip}>
        <View pointerEvents="none" style={styles.tipWave}>
          <CardWave color="#ffead8" layered />
        </View>
        <View style={styles.infoCircle}>
          <Text style={styles.infoLetter}>i</Text>
        </View>
        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>Tudo em um só lugar</Text>
          <Text style={styles.tipText}>Registre, mantenha e acompanhe com facilidade.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.homeBackground },
  page: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    flexGrow: 1,
    justifyContent: 'center',
  },
  intro: {
    minHeight: 140,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  introCopy: { flex: 1, minWidth: 0, paddingVertical: 18 },
  greetingAccent: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.orange,
    marginBottom: 15,
  },
  greeting: {
    color: colors.homeInk,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  smallGreeting: { fontSize: 22, lineHeight: 29 },
  subtitle: { color: colors.homeMuted, fontSize: 15, lineHeight: 22, marginTop: 6, maxWidth: 230 },
  artwork: { width: 116, height: 136, flexShrink: 0 },
  smallArtwork: { width: 80, height: 96 },
  cards: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    minWidth: 0,
    minHeight: 164,
    paddingHorizontal: 15,
    paddingVertical: 18.5,
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#f0f3f5',
    borderRadius: 16,
    gap: 14,
    overflow: 'hidden',
    boxShadow: '0 5px 16px rgba(35, 77, 110, 0.07)',
  },
  pressed: { opacity: 0.75 },
  cardWave: { position: 'absolute', bottom: 0, right: 0, width: '100%', height: 48 },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f8f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  circle: {
    width: 53,
    height: 53,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: { gap: 5 },
  cardTitle: { color: colors.homeInk, fontSize: 21, fontWeight: '800', letterSpacing: -0.6 },
  smallCardTitle: { fontSize: 16 },
  cardSub: { color: colors.homeMuted, fontSize: 14, lineHeight: 20 },
  history: {
    marginTop: 13,
    padding: 14,
    minHeight: 96,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#f0f3f5',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
    boxShadow: '0 6px 16px rgba(35, 77, 110, 0.05)',
  },
  historyWave: { position: 'absolute', bottom: 0, right: 0, width: '42%', height: 40 },
  historyCircle: {
    width: 57,
    height: 57,
    borderRadius: 29,
    backgroundColor: '#eff3f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyCopy: { flex: 1 },
  historyTitle: { color: colors.homeInk, fontSize: 21, fontWeight: '800', letterSpacing: -0.5 },
  historySub: { color: colors.homeMuted, fontSize: 14, lineHeight: 20, marginTop: 4 },
  tip: {
    marginTop: 20,
    padding: 18,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.orange,
    backgroundColor: '#fff6ef',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 94,
    overflow: 'hidden',
  },
  tipWave: { position: 'absolute', bottom: 0, right: 0, width: '30%', height: 52 },
  infoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLetter: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'serif',
    lineHeight: 34,
  },
  tipCopy: { flex: 1, gap: 5 },
  tipTitle: { color: colors.homeInk, fontSize: 16, fontWeight: '700' },
  tipText: { color: colors.homeMuted, fontSize: 13, lineHeight: 19 },
});
