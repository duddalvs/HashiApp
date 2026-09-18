import { Modal, StyleSheet, Text, View } from 'react-native';
import { colors, ui } from '@/lib/theme';
import { Icon } from './Icon';
import { Button } from './Button';
export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View accessibilityRole="alert" style={styles.error}>
      <Icon name="alert" size={21} color={colors.error} />
      <View style={{ flex: 1, gap: 12 }}>
        <Text style={styles.errorText}>{message}</Text>
        {onRetry && <Button secondary title="Tentar novamente" onPress={onRetry} />}
      </View>
    </View>
  );
}
export function SuccessDialog({
  visible,
  message,
  demo,
  onContinue,
  onHistory,
}: {
  visible: boolean;
  message: string;
  demo?: boolean;
  onContinue: () => void;
  onHistory: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinue}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.circle}>
            <Icon name="check" size={36} color={colors.green} />
          </View>
          <Text style={[ui.title, { fontSize: 23, textAlign: 'center' }]}>
            {demo ? 'Exemplo salvo nesta sessão' : message}
          </Text>
          <Text style={[ui.subtitle, { textAlign: 'center' }]}>
            {demo
              ? 'Demonstração: nenhum dado foi enviado ao banco.'
              : 'Você já pode consultar este envio no histórico.'}
          </Text>
          <Button title="Ver histórico" onPress={onHistory} />
          <Button title="Fazer novo registro" secondary onPress={onContinue} />
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  error: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
    borderRadius: 12,
    backgroundColor: '#fff0ee',
  },
  errorText: { color: colors.error, fontSize: 14, lineHeight: 21 },
  overlay: {
    flex: 1,
    backgroundColor: '#0b2c4488',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 24,
    width: '100%',
    maxWidth: 420,
    gap: 18,
  },
  circle: {
    borderRadius: 35,
    width: 70,
    height: 70,
    backgroundColor: colors.greenSoft,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
