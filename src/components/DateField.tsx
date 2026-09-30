import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, ui } from '@/lib/theme';
import { displayDate, localDate, parseLocalDate, validDate } from '@/lib/format';
import { Icon } from './Icon';
import { Button } from './Button';
export function DateField({
  value,
  onChange,
  error,
  disabled,
  label = 'Data',
  placeholder = 'Sem limite',
  errorTone = 'error',
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  errorTone?: 'error' | 'warning';
}) {
  const [open, setOpen] = useState(false);
  const [dateError, setDateError] = useState('');
  const today = localDate();
  const message = dateError || error;
  const errorStyle =
    errorTone === 'warning'
      ? { borderColor: colors.orange, borderWidth: 2 }
      : { borderColor: colors.error };
  const pickerValue = parseLocalDate(validDate(value) && value <= today ? value : today);
  function change(next: string) {
    if (validDate(next) && next > localDate()) {
      setDateError('A data não pode ser posterior a hoje.');
      return;
    }
    setDateError('');
    onChange(next);
  }
  return (
    <View>
      <Text style={ui.label}>{label}</Text>
      {Platform.OS === 'web' ? (
        <View style={[ui.field, styles.row, message && errorStyle]}>
          <Icon name="calendar" color={colors.muted} />
          <input
            aria-label={label}
            aria-invalid={!!message}
            type="date"
            max={today}
            value={value}
            disabled={disabled}
            onChange={(event) => {
              const next = event.target.value;
              change(next);
              if (validDate(next) && next > localDate()) event.target.value = value;
            }}
            style={{
              border: 0,
              background: 'transparent',
              color: colors.navy,
              fontFamily: 'inherit',
              fontSize: 16,
              flex: 1,
              padding: '16px 0',
              minWidth: 0,
            }}
          />
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value ? displayDate(value) : placeholder}`}
          accessibilityHint={message || undefined}
          disabled={disabled}
          onPress={() => setOpen(true)}
          style={[ui.field, styles.row, message && errorStyle]}
        >
          <Icon name="calendar" color={colors.muted} />
          <Text style={styles.value}>{value ? displayDate(value) : placeholder}</Text>
          <Icon name="chevron" size={19} color={colors.muted} />
        </Pressable>
      )}
      {!!message && (
        <Text
          accessibilityRole="alert"
          style={[ui.error, errorTone === 'warning' && { color: colors.orangeText }]}
        >
          {message}
        </Text>
      )}
      {open && Platform.OS === 'android' && (
        <DateTimePicker
          value={pickerValue}
          maximumDate={parseLocalDate(today)}
          mode="date"
          onChange={(event, date) => {
            setOpen(false);
            if (event.type === 'set' && date) change(localDate(date));
          }}
        />
      )}
      {Platform.OS === 'ios' && (
        <Modal
          visible={open}
          transparent
          animationType="slide"
          onRequestClose={() => setOpen(false)}
        >
          <View style={styles.overlay}>
            <View style={styles.picker}>
              <DateTimePicker
                value={pickerValue}
                maximumDate={parseLocalDate(today)}
                mode="date"
                display="spinner"
                locale="pt-BR"
                themeVariant="light"
                onChange={(_, date) => date && change(localDate(date))}
              />
              <Button title="Confirmar data" onPress={() => setOpen(false)} />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  value: { flex: 1, color: colors.navy, fontSize: 16 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0b2c4466' },
  picker: {
    backgroundColor: colors.white,
    padding: 24,
    paddingBottom: 44,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});
