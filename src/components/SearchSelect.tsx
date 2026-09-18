import { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { normalize, normalizePlate } from '@/lib/format';
import { matchNameParts, type NamePart } from '@/lib/nameSearch';
import { colors, ui } from '@/lib/theme';
import { Icon } from './Icon';
export type Option = { id: number; label: string; description?: string };
export function SearchSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Toque para selecionar',
  error,
  disabled = false,
  searchMode = 'text',
}: {
  label: string;
  value: number | null;
  options: Option[];
  onChange: (value: number | null) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  searchMode?: 'text' | 'ordered-name';
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((o) => o.id === value);
  const filtered = useMemo<(Option & { nameParts?: NamePart[] })[]>(() => {
    if (searchMode === 'ordered-name')
      return options.flatMap((option) => {
        const nameParts = matchNameParts(option.label, query);
        return nameParts ? [{ ...option, nameParts }] : [];
      });
    return options.filter(
      (o) =>
        normalize(`${o.label} ${o.description ?? ''}`).includes(normalize(query)) ||
        normalizePlate(o.label).includes(normalizePlate(query)),
    );
  }, [options, query, searchMode]);
  const close = () => {
    setOpen(false);
    setQuery('');
  };
  return (
    <View style={styles.group}>
      <Text style={ui.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
        accessibilityState={{ expanded: open, disabled }}
        disabled={disabled}
        onPress={() => {
          setQuery('');
          setOpen(true);
        }}
        style={[
          ui.field,
          styles.trigger,
          error && { borderColor: colors.error },
          disabled && { opacity: 0.6 },
        ]}
      >
        <Text style={[styles.value, !selected && { color: colors.muted }]}>
          {selected?.label ?? placeholder}
        </Text>
        <Icon name="chevron" size={19} color={colors.muted} />
      </Pressable>
      {error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
        <View style={styles.overlay}>
          <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={close} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheet}
          >
            <SafeAreaView edges={['bottom']} style={styles.safe}>
              <View style={styles.heading}>
                <Text style={styles.title}>{label}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Fechar opções"
                  onPress={close}
                  style={styles.iconButton}
                >
                  <Icon name="close" />
                </Pressable>
              </View>
              <View style={[ui.field, styles.search]}>
                <Icon name="search" size={20} color={colors.muted} />
                <TextInput
                  accessibilityLabel={`Pesquisar ${label}`}
                  placeholder={
                    searchMode === 'ordered-name' ? 'Digite partes do nome' : 'Digite para filtrar'
                  }
                  placeholderTextColor={colors.muted}
                  value={query}
                  onChangeText={setQuery}
                  autoCorrect={false}
                  style={styles.input}
                />
              </View>
              <Text style={styles.hint}>
                {searchMode === 'ordered-name'
                  ? 'Busque partes do nome na ordem. Toque para selecionar.'
                  : 'Toque em uma opção para confirmar.'}
              </Text>
              <FlatList
                keyboardShouldPersistTaps="handled"
                data={filtered}
                keyExtractor={(item) => String(item.id)}
                style={styles.list}
                renderItem={({ item }) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: item.id === value }}
                    onPress={() => {
                      onChange(item.id);
                      close();
                    }}
                    style={[
                      styles.option,
                      item.id === value && { backgroundColor: colors.orangeSoft },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optionLabel}>
                        {item.nameParts
                          ? item.nameParts.map((part, index) =>
                              part.highlighted ? (
                                <Text key={index} testID="name-search-match" style={styles.match}>
                                  {part.text}
                                </Text>
                              ) : (
                                part.text
                              ),
                            )
                          : item.label}
                      </Text>
                      {item.description && (
                        <Text style={styles.description}>{item.description}</Text>
                      )}
                    </View>
                    {item.id === value && <Icon name="check" color={colors.orangeText} />}
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text style={styles.empty}>Nenhuma opção encontrada. Tente outro nome.</Text>
                }
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onChange(null);
                  close();
                }}
                style={styles.clear}
              >
                <Text style={styles.clearText}>Limpar seleção</Text>
              </Pressable>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  group: { gap: 0 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 14,
  },
  value: { flex: 1, fontSize: 16, lineHeight: 23, color: colors.navy },
  overlay: {
    flex: 1,
    backgroundColor: '#0b2c4466',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 600,
    height: '78%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  safe: { flex: 1, paddingHorizontal: 20 },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  title: { flex: 1, fontSize: 21, fontWeight: '800', color: colors.navy },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  input: { flex: 1, height: 54, color: colors.navy, fontSize: 16, outlineWidth: 0 },
  hint: { color: colors.muted, fontSize: 13, marginVertical: 13 },
  list: { flex: 1 },
  option: {
    minHeight: 59,
    padding: 14,
    borderBottomWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 8,
  },
  optionLabel: { color: colors.navy, fontSize: 16, lineHeight: 23, fontWeight: '600' },
  match: { backgroundColor: colors.orangeSoft, color: colors.orangeText, fontWeight: '800' },
  description: { fontSize: 13, color: colors.muted, marginTop: 4 },
  empty: { paddingVertical: 30, color: colors.muted, lineHeight: 22, textAlign: 'center' },
  clear: {
    minHeight: 55,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderColor: colors.line,
  },
  clearText: { color: colors.orangeText, fontSize: 15, fontWeight: '700' },
});
