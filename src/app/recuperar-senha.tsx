import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand } from '@/components/Brand';
import { Button } from '@/components/Button';
import { PasswordField } from '@/components/PasswordField';
import { ErrorNotice } from '@/components/Feedback';
import { getSupabase } from '@/lib/supabase';
import { normalizeLogin } from '@/lib/login';
import { friendlyError } from '@/lib/format';
import { colors, ui } from '@/lib/theme';

export default function RecoverPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{ usuario?: string }>();
  const [username, setUsername] = useState(
    typeof params.usuario === 'string' ? params.usuario : '',
  );
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  async function validateCode() {
    if (busy) return;
    setError('');
    if (!username.trim() || !code.trim()) {
      setError('Preencha seu usuário e o código de recuperação.');
      return;
    }
    setBusy(true);
    try {
      const result = await getSupabase().rpc('validar_codigo_recuperacao', {
        p_usuario: normalizeLogin(username),
        p_codigo: code,
      });
      if (result.error) throw result.error;
      if (result.data?.error) {
        setError(result.data.error);
        return;
      }
      if (!result.data?.token) throw new Error('Resposta inválida. Tente novamente.');
      setToken(result.data.token);
      setCode('');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (busy) return;
    setError('');
    if ([...password].length < 12) {
      setError('Use uma senha com pelo menos 12 caracteres.');
      return;
    }
    if (password !== confirmation) {
      setError('As senhas não coincidem. Confira a confirmação.');
      return;
    }
    setBusy(true);
    try {
      const result = await getSupabase().rpc('recuperar_senha', {
        p_token: token,
        p_senha: password,
      });
      if (result.error) throw result.error;
      if (result.data?.error) {
        setError(result.data.error);
        if (result.data.expired) {
          setToken('');
          setPassword('');
          setConfirmation('');
        }
        return;
      }
      if (!result.data?.success) throw new Error('Resposta inválida. Tente novamente.');
      setPassword('');
      setConfirmation('');
      setToken('');
      setDone(true);
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
          <View>
            <Text style={ui.title}>
              {done ? 'Senha alterada' : token ? 'Crie sua nova senha' : 'Recuperar senha'}
            </Text>
            <Text style={ui.subtitle}>
              {done
                ? 'Sua senha foi atualizada. Entre com seu usuário e a nova senha.'
                : token
                  ? 'Escolha uma senha com pelo menos 12 caracteres e confirme abaixo.'
                  : 'Peça um código de recuperação ao administrador e informe-o abaixo. O código vale por 30 minutos.'}
            </Text>
          </View>
          {!done &&
            (token ? (
              <>
                <PasswordField
                  label="Nova senha"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Digite a nova senha"
                  autoComplete="new-password"
                  editable={!busy}
                />
                <PasswordField
                  label="Confirmar senha"
                  value={confirmation}
                  onChangeText={setConfirmation}
                  placeholder="Digite a senha novamente"
                  autoComplete="new-password"
                  editable={!busy}
                  onSubmitEditing={save}
                />
                <Button title="Salvar nova senha" onPress={save} loading={busy} />
              </>
            ) : (
              <>
                <View>
                  <Text style={ui.label}>Usuário</Text>
                  <TextInput
                    accessibilityLabel="Usuário"
                    style={ui.field}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username"
                    placeholder="Digite seu usuário"
                    placeholderTextColor={colors.muted}
                    editable={!busy}
                  />
                </View>
                <View>
                  <Text style={ui.label}>Código de recuperação</Text>
                  <TextInput
                    accessibilityLabel="Código de recuperação"
                    style={ui.field}
                    value={code}
                    onChangeText={setCode}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    autoComplete="one-time-code"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    placeholderTextColor={colors.muted}
                    editable={!busy}
                    onSubmitEditing={validateCode}
                  />
                </View>
                <Button title="Validar código" onPress={validateCode} loading={busy} />
              </>
            ))}
          {!!error && <ErrorNotice message={error} />}
          <Button
            title="Voltar ao login"
            secondary={!done}
            disabled={busy}
            onPress={() => router.replace('/login')}
          />
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
    gap: 20,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
});
