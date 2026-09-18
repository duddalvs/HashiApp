import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, ui } from '@/lib/theme';
import { Icon } from './Icon';

type Props = Omit<TextInputProps, 'secureTextEntry' | 'style'> & { label: string };
export function PasswordField({ label, editable = true, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <View>
      <Text style={ui.label}>{label}</Text>
      <View style={styles.field}>
        <TextInput
          {...props}
          accessibilityLabel={label}
          style={styles.input}
          placeholderTextColor={colors.muted}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
          accessibilityState={{ disabled: !editable }}
          disabled={!editable}
          onPress={() => setVisible((value) => !value)}
          style={styles.toggle}
        >
          <Icon name={visible ? 'eye-off' : 'eye'} size={22} color={colors.muted} />
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  field: { ...ui.field, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 0 },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    paddingLeft: 15,
    paddingRight: 8,
    fontSize: 16,
    color: colors.navy,
  },
  toggle: { width: 48, minHeight: 54, alignItems: 'center', justifyContent: 'center' },
});
