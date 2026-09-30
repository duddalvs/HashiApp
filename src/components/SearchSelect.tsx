import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { normalize, normalizePlate } from '@/lib/format';
import {
  matchIndexedNameParts,
  matchesIndexedName,
  nameSearchTerms,
  prepareNameSearch,
} from '@/lib/nameSearch';
import { colors, ui } from '@/lib/theme';
import { Icon } from './Icon';
import { Button } from './Button';
import { SelectOverlay } from './SelectOverlay';
import { prepareSearchOptions, type Option } from '@/lib/searchOptions';
export type { Option } from '@/lib/searchOptions';
type SearchSelectProps = {
  label: string;
  options: Option[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  searchMode?: 'text' | 'ordered-name';
  listHeader?: (select: (id: number) => void) => ReactElement;
  listHeading?: string;
  onOpen?: () => void;
} & (
  | { multiple: true; values: number[]; onChange: (values: number[]) => void; value?: never }
  | {
      multiple?: false;
      value: number | null;
      onChange: (value: number | null) => void;
      values?: never;
    }
);
export function SearchSelect(props: SearchSelectProps) {
  const {
    label,
    value,
    options,
    placeholder = 'Toque para selecionar',
    error,
    disabled = false,
    searchMode = 'text',
    listHeader,
    listHeading,
    onOpen,
  } = props;
  const [open, setOpen] = useState(false);
  const { height } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => onOpenRef.current?.());
    return () => cancelAnimationFrame(frame);
  }, [open]);
  const selectedIds = props.multiple ? props.values : value == null ? [] : [value];
  const selected = options.filter((o) => selectedIds.includes(o.id));
  const selectedLabel =
    selectedIds.length > 1
      ? `${selectedIds.length} selecionados`
      : (selected[0]?.label ?? placeholder);
  const indexedOptions = useMemo(
    () => prepareSearchOptions(options, searchMode),
    [options, searchMode],
  );
  const terms = useMemo(() => nameSearchTerms(query), [query]);
  const filtered = useMemo(() => {
    if (!query.trim()) return indexedOptions;
    if (searchMode === 'ordered-name')
      return indexedOptions.filter((option) => matchesIndexedName(option.nameIndex!, terms));
    const text = normalize(query);
    const plate = normalizePlate(query);
    return indexedOptions.filter(
      (option) => option.text.includes(text) || option.plate.includes(plate),
    );
  }, [indexedOptions, query, searchMode, terms]);
  const close = useCallback(() => {
    Keyboard.dismiss();
    setOpen(false);
    setQuery('');
  }, []);
  function change(id: number | null) {
    if (props.multiple) {
      props.onChange(
        id === null
          ? []
          : props.values.includes(id)
            ? props.values.filter((value) => value !== id)
            : [...props.values, id],
      );
    } else {
      props.onChange(id);
      close();
    }
  }
  return (
    <View style={styles.group}>
      <Text style={ui.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selectedLabel}`}
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
        <Text style={[styles.value, !selectedIds.length && { color: colors.muted }]}>
          {selectedLabel}
        </Text>
        <Icon name="chevron" size={19} color={colors.muted} />
      </Pressable>
      {error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      {open && (
        <SelectOverlay onClose={close}>
          <View style={styles.overlay}>
            <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={close} />
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={[styles.sheet, height < 640 && styles.compactSheet]}
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
                      searchMode === 'ordered-name'
                        ? 'Digite partes do nome'
                        : 'Digite para filtrar'
                    }
                    placeholderTextColor={colors.muted}
                    value={query}
                    onChangeText={setQuery}
                    autoCorrect={false}
                    style={styles.input}
                  />
                </View>
                <Text style={styles.hint}>
                  {props.multiple
                    ? 'Marque uma ou mais opções e toque em Concluir seleção.'
                    : searchMode === 'ordered-name'
                      ? 'Busque partes do nome na ordem. Toque para selecionar.'
                      : 'Toque em uma opção para confirmar.'}
                </Text>
                {!query.trim() && listHeader && (
                  <ScrollView
                    testID="select-suggestion"
                    style={styles.suggestion}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  >
                    {listHeader(change)}
                  </ScrollView>
                )}
                {!query.trim() && listHeading && (
                  <Text style={styles.listHeading}>{listHeading}</Text>
                )}
                <FlatList
                  testID="select-options"
                  keyboardShouldPersistTaps="handled"
                  data={filtered}
                  extraData={selectedIds}
                  keyExtractor={(item) => String(item.id)}
                  style={styles.list}
                  initialNumToRender={10}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  renderItem={({ item }) => {
                    const nameParts =
                      item.nameIndex && terms.length
                        ? matchIndexedNameParts(prepareNameSearch(item.label), terms)
                        : null;
                    return (
                      <Pressable
                        accessibilityRole={props.multiple ? 'checkbox' : 'button'}
                        accessibilityLabel={item.label}
                        accessibilityState={
                          props.multiple
                            ? { checked: selectedIds.includes(item.id) }
                            : { selected: item.id === value }
                        }
                        aria-checked={props.multiple ? selectedIds.includes(item.id) : undefined}
                        onPress={() => change(item.id)}
                        style={[
                          styles.option,
                          selectedIds.includes(item.id) && { backgroundColor: colors.orangeSoft },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.optionLabel}>
                            {nameParts
                              ? nameParts.map((part, index) =>
                                  part.highlighted ? (
                                    <Text
                                      key={index}
                                      testID="name-search-match"
                                      style={styles.match}
                                    >
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
                        {props.multiple ? (
                          <View
                            style={[
                              styles.checkbox,
                              selectedIds.includes(item.id) && styles.checked,
                            ]}
                          >
                            {selectedIds.includes(item.id) && (
                              <Icon name="check" size={17} color={colors.white} />
                            )}
                          </View>
                        ) : (
                          item.id === value && <Icon name="check" color={colors.orangeText} />
                        )}
                      </Pressable>
                    );
                  }}
                  ListEmptyComponent={
                    <Text style={styles.empty}>Nenhuma opção encontrada. Tente outro nome.</Text>
                  }
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => change(null)}
                  style={styles.clear}
                >
                  <Text style={styles.clearText}>Limpar seleção</Text>
                </Pressable>
                {props.multiple && (
                  <View style={styles.confirm}>
                    <Button title={`Concluir seleção (${props.values.length})`} onPress={close} />
                  </View>
                )}
              </SafeAreaView>
            </KeyboardAvoidingView>
          </View>
        </SelectOverlay>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  checkbox: {
    width: 23,
    height: 23,
    borderWidth: 1.5,
    borderColor: colors.muted,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: { backgroundColor: colors.orange, borderColor: colors.orange },
  confirm: { paddingBottom: 12 },
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
  compactSheet: { height: '90%' },
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
  suggestion: { maxHeight: '36%', flexGrow: 0, flexShrink: 1 },
  listHeading: { color: colors.navy, fontSize: 14, fontWeight: '700', marginBottom: 8 },
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
