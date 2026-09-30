import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand } from '@/components/Brand';
import { AppVersion } from '@/components/AppVersion';
import { Button } from '@/components/Button';
import { PasswordField } from '@/components/PasswordField';
import { ErrorNotice } from '@/components/Feedback';
import { colors, ui } from '@/lib/theme';
import { isConfigured } from '@/lib/supabase';
import { friendlyError } from '@/lib/format';
import { useAuth } from '@/providers/AuthProvider';
export default function Login() {
  const router = useRouter();
  const auth = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (auth.demo || (auth.session && auth.profile?.ativo && !auth.loading))
    return <Redirect href="/inicio" />;
  async function submit() {
    if (busy) return;
    setError('');
    if (!username.trim() || !password) {
      setError('Preencha seu usuário e sua senha.');
      return;
    }
    setBusy(true);
    try {
      await auth.signIn(username, password);
      setPassword('');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <Brand compact />
          <View style={styles.heading}>
            <Text style={ui.title}>Bem-vindo de volta</Text>
            <Text style={ui.subtitle}>Entre com o acesso fornecido pela sua equipe.</Text>
          </View>
          {!isConfigured ? (
            <ErrorNotice message="O acesso da empresa ainda está sendo preparado. Entre em contato com o administrador para liberar o aplicativo." />
          ) : auth.loading ? (
            <ActivityIndicator color={colors.orange} />
          ) : auth.session ? (
            <View style={styles.form}>
              <ErrorNotice
                message={auth.error || 'Seu acesso aguarda liberação do administrador.'}
                onRetry={auth.reloadProfile}
              />
              <Button
                secondary
                title="Usar outra conta"
                onPress={() => {
                  void auth.signOut().catch((err) => setError(friendlyError(err)));
                }}
              />
            </View>
          ) : (
            <View style={styles.form}>
              <View>
                <Text style={ui.label}>Usuário</Text>
                <TextInput
                  accessibilityLabel="Usuário"
                  style={ui.field}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Digite seu usuário"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  editable={!busy}
                />
              </View>
              <PasswordField
                label="Senha"
                value={password}
                onChangeText={setPassword}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                editable={!busy}
                onSubmitEditing={submit}
              />
              <Button title="Acessar minha conta" onPress={submit} loading={busy} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Esqueceu sua senha?"
                disabled={busy}
                accessibilityState={{ disabled: busy }}
                style={styles.helpButton}
                onPress={() => {
                  setPassword('');
                  router.push({
                    pathname: '/recuperar-senha',
                    params: { usuario: username.trim() },
                  });
                }}
              >
                <Text style={styles.help}>Esqueceu sua senha?</Text>
              </Pressable>
            </View>
          )}
          {!!(error || auth.error) && <ErrorNotice message={error || auth.error} />}
          <Button secondary title="Voltar" onPress={() => router.replace('/')} />
          <AppVersion />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  page: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 28,
    gap: 24,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  heading: { marginVertical: 10 },
  form: { gap: 20 },
  helpButton: { minHeight: 48, justifyContent: 'center' },
  help: {
    color: colors.orangeText,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
  },
});
