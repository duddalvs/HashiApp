import { useState, type PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Brand } from './Brand';
import { Icon } from './Icon';
import { Button } from './Button';
import { ErrorNotice } from './Feedback';
import { colors } from '@/lib/theme';
import { useAuth } from '@/providers/AuthProvider';
import { friendlyError } from '@/lib/format';
export function AppShell({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const [menu, setMenu] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function exit() {
    setBusy(true);
    try {
      await auth.signOut();
      setMenu(false);
      router.replace('/');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.app}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ir para a tela principal"
            onPress={() => router.navigate('/inicio')}
            style={styles.brandButton}
          >
            <Brand compact wordmarkOnly />
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir menu"
              onPress={() => setMenu(true)}
              style={styles.iconButton}
            >
              <Icon name="menu" size={26} />
            </Pressable>
          </View>
        </View>
        {auth.demo && (
          <View style={styles.demo}>
            <Text style={styles.demoText}>Demonstração · exemplos locais, sem envio</Text>
          </View>
        )}
        <View style={styles.content}>{children}</View>
        <View style={styles.footer}>
          {(
            [
              { route: '/registro', label: 'Registro', icon: 'clipboard' },
              { route: '/manutencao', label: 'Manutenção', icon: 'wrench' },
            ] as const
          ).map((item) => {
            const active = pathname === item.route;
            const highlighted = active || (pathname === '/inicio' && item.route === '/registro');
            return (
              <Pressable
                key={item.route}
                accessibilityRole="tab"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: active }}
                onPress={() => router.navigate(item.route)}
                style={styles.tab}
              >
                <View style={styles.tabIcon}>
                  <Icon
                    name={item.icon}
                    size={28}
                    color={highlighted ? colors.orange : colors.navy}
                  />
                </View>
                <Text style={[styles.tabText, highlighted && { color: colors.orangeText }]}>
                  {item.label}
                </Text>
                <View style={[styles.tabIndicator, highlighted && styles.activeTabIndicator]} />
              </Pressable>
            );
          })}
        </View>
      </View>
      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <View style={styles.overlay}>
          <View style={styles.menu}>
            <View style={styles.menuHead}>
              <Text style={styles.menuTitle}>Sua conta</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar menu"
                style={styles.iconButton}
                onPress={() => setMenu(false)}
              >
                <Icon name="close" />
              </Pressable>
            </View>
            <Text style={styles.userName}>
              {auth.demo
                ? 'Modo demonstração'
                : [auth.profile?.nome, auth.profile?.sobrenome].filter(Boolean).join(' ')}
            </Text>
            <Text style={styles.accountRole}>
              {auth.demo
                ? 'Os exemplos são apagados ao sair.'
                : auth.profile?.perfil === 'admin'
                  ? 'Administrador'
                  : 'Usuário comum'}
            </Text>
            <Button
              title="Tela principal"
              secondary
              icon="home"
              onPress={() => {
                setMenu(false);
                router.navigate('/inicio');
              }}
            />
            <Button
              title="Histórico"
              secondary
              icon="history"
              onPress={() => {
                setMenu(false);
                router.navigate('/historico');
              }}
            />
            {!!error && <ErrorNotice message={error} />}
            <Button title="Sair da conta" icon="logout" loading={busy} onPress={exit} />
            <Text style={styles.version}>
              {Constants.expoConfig?.name ?? 'Hashi App'} · versão{' '}
              {Constants.expoConfig?.version ?? '0.1'}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  app: {
    flex: 1,
    width: '100%',
    maxWidth: 660,
    alignSelf: 'center',
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 64,
    paddingHorizontal: 20,
    paddingVertical: 7,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: { flexDirection: 'row', gap: 5 },
  brandButton: { minHeight: 48, justifyContent: 'center' },
  iconButton: {
    height: 48,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  content: { flex: 1 },
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderColor: colors.homeLine,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 9,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 66, gap: 4 },
  tabIcon: {
    width: 45,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.navy },
  tabIndicator: {
    height: 7,
    width: 7,
    borderRadius: 4,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  activeTabIndicator: { backgroundColor: colors.orange },
  demo: { backgroundColor: colors.orangeSoft, padding: 7 },
  demoText: { color: colors.orangeText, fontSize: 11, textAlign: 'center', fontWeight: '600' },
  overlay: {
    flex: 1,
    backgroundColor: '#0b2c4477',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  menu: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 23,
    width: '100%',
    maxWidth: 420,
    gap: 14,
  },
  menuHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuTitle: { color: colors.navy, fontSize: 23, fontWeight: '800' },
  userName: { color: colors.navy, fontSize: 18, fontWeight: '700' },
  accountRole: { color: colors.muted, marginBottom: 8, lineHeight: 22 },
  version: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 10 },
});
