import { forwardRef, type PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, ui } from '@/lib/theme';
import { Button } from './Button';
import { ErrorNotice } from './Feedback';
import { useFleet } from '@/providers/FleetProvider';
export const FormScreen = forwardRef<
  ScrollView,
  PropsWithChildren<{
    title: string;
    subtitle: string;
    saveLabel: string;
    saving: boolean;
    onSave: () => void;
    error: string;
  }>
>(function FormScreen({ title, subtitle, saveLabel, saving, onSave, error, children }, ref) {
  const fleet = useFleet();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView ref={ref} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
        <View>
          <Text style={ui.title}>{title}</Text>
          <Text style={ui.subtitle}>{subtitle}</Text>
        </View>
        {fleet.loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.orange} />
            <Text style={ui.subtitle}>Carregando as opções…</Text>
          </View>
        ) : fleet.error ? (
          <ErrorNotice message={fleet.error} onRetry={fleet.reload} />
        ) : (
          children
        )}
        {!!error && <ErrorNotice message={error} />}
      </ScrollView>
      <View style={styles.save}>
        <Button
          title={saveLabel}
          icon="check"
          loading={saving}
          disabled={fleet.loading || !!fleet.error}
          onPress={onSave}
        />
      </View>
    </KeyboardAvoidingView>
  );
});
const styles = StyleSheet.create({
  page: { padding: 23, gap: 22, paddingBottom: 25 },
  save: {
    paddingHorizontal: 23,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.background,
  },
  loading: { paddingVertical: 35, alignItems: 'center' },
});
