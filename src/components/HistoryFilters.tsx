import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type {
  HistoryFilter,
  HistoryFilterOptions,
  HistoryFilters as Filters,
} from '@/types/models';
import {
  defaultHistoryFilters,
  historyFilterCount,
  historyDateErrors,
  historyPeriodLabel,
} from '@/lib/historyFilters';
import { friendlyError } from '@/lib/format';
import { colors } from '@/lib/theme';
import { Button } from './Button';
import { DateField } from './DateField';
import { ErrorNotice } from './Feedback';
import { Icon } from './Icon';
import { SearchSelect } from './SearchSelect';

const emptyOptions: HistoryFilterOptions = {
  drivers: [],
  vehicles: [],
  contracts: [],
  authors: [],
  maintenanceTypes: [],
};

export function HistoryFilters({
  value,
  type,
  open,
  onOpenChange,
  onApply,
  onInvalid,
  loadOptions,
}: {
  value: Filters;
  type: HistoryFilter;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (filters: Filters) => void;
  onInvalid?: () => void;
  loadOptions: () => Promise<HistoryFilterOptions>;
}) {
  const [draft, setDraft] = useState(value);
  const [options, setOptions] = useState(emptyOptions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (open) {
      setDraft(value);
      setAttempted(false);
    }
  }, [open, value]);
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError('');
    loadOptions()
      .then((data) => {
        if (active) setOptions(data);
      })
      .catch((err) => {
        if (active) setError(friendlyError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, loadOptions, retry]);
  const choices = useMemo(
    () => ({
      drivers: [
        ...(type === 'manutencao' ? [{ id: 0, label: 'Motorista não identificado' }] : []),
        ...options.drivers.map((o) => ({ id: o.id, label: o.nome })),
      ],
      vehicles: options.vehicles.map((o) => ({ id: o.id, label: o.placa, description: o.modelo })),
      contracts: options.contracts.map((o) => ({ id: o.id, label: o.nome })),
      authors: options.authors.map((o, i) => ({
        id: i + 1,
        label: [o.nome, o.sobrenome].filter(Boolean).join(' '),
        description: o.login,
      })),
      maintenanceTypes: options.maintenanceTypes.map((o) => ({ id: o.id, label: o.nome })),
    }),
    [options, type],
  );
  function update<K extends keyof Filters>(key: K, next: Filters[K]) {
    setDraft((prev) => ({ ...prev, [key]: next }));
  }
  const dateErrors = attempted ? historyDateErrors(draft) : { from: '', to: '' };
  const count = historyFilterCount(value);
  const summary = [
    ...choices.drivers.filter((o) => value.driverIds.includes(o.id)).map((o) => o.label),
    ...choices.vehicles.filter((o) => value.vehicleIds.includes(o.id)).map((o) => o.label),
    ...choices.contracts.filter((o) => value.contractIds.includes(o.id)).map((o) => o.label),
    ...options.authors
      .filter((o) => value.authorIds.includes(o.id))
      .map((o) => [o.nome, o.sobrenome].filter(Boolean).join(' ')),
    ...choices.maintenanceTypes
      .filter((o) => value.maintenanceTypeIds.includes(o.id))
      .map((o) => o.label),
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Filtros do histórico"
        aria-expanded={open}
        onPress={() => onOpenChange(!open)}
        style={styles.trigger}
      >
        <Icon name="filter" size={21} color={colors.orangeText} />
        <View style={styles.triggerText}>
          <Text style={styles.title}>Filtros{count ? ` (${count})` : ''}</Text>
          <Text style={styles.hint}>{historyPeriodLabel(value)}</Text>
        </View>
        <View style={{ transform: [{ rotate: open ? '-90deg' : '90deg' }] }}>
          <Icon name="chevron" size={19} />
        </View>
      </Pressable>
      {!open && !!summary && <Text style={styles.summary}>{summary}</Text>}
      {open && (
        <View style={styles.panel}>
          <Text style={styles.hint}>
            Marque quantas opções precisar em cada filtro. Campos sem seleção incluem todas as
            opções.
          </Text>
          <DateField
            label="Data inicial"
            value={draft.from}
            onChange={(date) => update('from', date)}
            placeholder="Selecione a data inicial"
            error={dateErrors.from}
            errorTone="warning"
          />
          <DateField
            label="Data final"
            value={draft.to}
            onChange={(date) => update('to', date)}
            placeholder="Selecione a data final"
            error={dateErrors.to}
            errorTone="warning"
          />
          <Text style={styles.hint}>Use a data informada no registro.</Text>
          {loading && (
            <ActivityIndicator
              accessibilityLabel="Carregando opções dos filtros"
              color={colors.orange}
            />
          )}
          {!!error && <ErrorNotice message={error} onRetry={() => setRetry((v) => v + 1)} />}
          <SearchSelect
            multiple
            label={type === 'registro' ? 'Motorista / responsável' : 'Motorista'}
            values={draft.driverIds}
            options={choices.drivers}
            onChange={(ids) => update('driverIds', ids)}
            placeholder="Todos os motoristas"
            searchMode="ordered-name"
            disabled={loading || !!error}
          />
          <SearchSelect
            multiple
            label="Placa"
            values={draft.vehicleIds}
            options={choices.vehicles}
            onChange={(ids) => update('vehicleIds', ids)}
            placeholder="Todas as placas"
            disabled={loading || !!error}
          />
          <SearchSelect
            multiple
            label="Contrato"
            values={draft.contractIds}
            options={choices.contracts}
            onChange={(ids) => update('contractIds', ids)}
            placeholder="Todos os contratos"
            disabled={loading || !!error}
          />
          <SearchSelect
            multiple
            label="Lançado por"
            values={draft.authorIds
              .map((id) => options.authors.findIndex((o) => o.id === id) + 1)
              .filter((id) => id > 0)}
            options={choices.authors}
            onChange={(ids) =>
              update(
                'authorIds',
                ids.map((id) => options.authors[id - 1].id),
              )
            }
            placeholder="Todos os autores"
            searchMode="ordered-name"
            disabled={loading || !!error}
          />
          {type === 'manutencao' && (
            <SearchSelect
              multiple
              label="Tipo de manutenção"
              values={draft.maintenanceTypeIds}
              options={choices.maintenanceTypes}
              onChange={(ids) => update('maintenanceTypeIds', ids)}
              placeholder="Todos os serviços"
              disabled={loading || !!error}
            />
          )}
          <Button
            title="Aplicar filtros"
            icon="filter"
            onPress={() => {
              const errors = historyDateErrors(draft);
              setAttempted(true);
              if (errors.from || errors.to) {
                onInvalid?.();
                return;
              }
              onApply(draft);
              onOpenChange(false);
            }}
          />
          <Button
            title="Limpar filtro"
            secondary
            onPress={() => {
              onApply(defaultHistoryFilters());
              onOpenChange(false);
            }}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpenChange(false)}
            style={styles.cancel}
          >
            <Text style={styles.link}>Cancelar</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    overflow: 'hidden',
  },
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 64 },
  triggerText: { flex: 1, gap: 3 },
  title: { fontSize: 15, fontWeight: '700', color: colors.navy },
  hint: { fontSize: 12, lineHeight: 18, color: colors.muted },
  summary: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    fontSize: 12,
    lineHeight: 18,
    color: colors.navy,
  },
  panel: { borderTopWidth: 1, borderTopColor: colors.line, padding: 14, gap: 16 },
  link: { color: colors.orangeText, fontSize: 13, fontWeight: '600' },
  cancel: { alignItems: 'center', justifyContent: 'center', minHeight: 44 },
});
