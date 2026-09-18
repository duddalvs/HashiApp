import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { ErrorNotice } from '@/components/Feedback';
import { useFleet } from '@/providers/FleetProvider';
import { useAuth } from '@/providers/AuthProvider';
import { colors, ui } from '@/lib/theme';
import { currency, displayDate, displayTime, friendlyError } from '@/lib/format';
import type { HistoryFilter, HistoryItem } from '@/types/models';
function HistoryCard({
  item,
  onEdit,
  onDelete,
}: {
  item: HistoryItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const maintenance = item.tipo === 'manutencao';
  const sentTime = displayTime(item.created_at);
  return (
    <View style={styles.card} testID={`history-${item.tipo}-${item.id}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${maintenance ? 'Manutenção' : 'Registro de equipe'}, ${item.contrato}, ${item.placas.join(', ')}. Data: ${displayDate(item.data)}.${sentTime ? ` Enviado às ${sentTime}.` : ''} Ver detalhes`}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((v) => !v)}
      >
        <View style={styles.cardTop}>
          <View
            style={[
              styles.badge,
              { backgroundColor: maintenance ? colors.blueSoft : colors.orangeSoft },
            ]}
          >
            <Icon
              name={maintenance ? 'wrench' : 'clipboard'}
              size={17}
              color={maintenance ? colors.navy : colors.orangeText}
            />
            <Text
              style={[styles.badgeText, { color: maintenance ? colors.navy : colors.orangeText }]}
            >
              {maintenance ? 'Manutenção' : 'Registro'}
            </Text>
          </View>
          <Text style={styles.date}>
            {displayDate(item.data)}
            {sentTime ? ` · ${sentTime}` : ''}
          </Text>
        </View>
        <Text style={styles.cardTitle}>
          {maintenance
            ? (item.detalhes[0]?.servico ?? 'Serviço realizado')
            : `Registro de ${item.detalhes.length === 1 ? 'equipe' : `${item.detalhes.length} equipes`}`}
        </Text>
        <View style={styles.summaryLine}>
          <Text style={styles.summaryLabel}>Contrato</Text>
          <Text style={styles.contract}>{item.contrato}</Text>
        </View>
        <View style={styles.summaryLine}>
          <Text style={styles.summaryLabel}>{item.placas.length > 1 ? 'Placas' : 'Placa'}</Text>
          <Text style={styles.plates}>{item.placas.join(' · ')}</Text>
        </View>
        <View style={styles.cardBottom}>
          {maintenance ? (
            <Text style={styles.cost}>{currency(Number(item.custo))}</Text>
          ) : (
            <Text style={styles.sent}>Registro enviado</Text>
          )}
          <Text style={styles.detailsLink}>{expanded ? 'Ocultar detalhes' : 'Ver detalhes'}</Text>
        </View>
        {expanded && (
          <View style={styles.details}>
            {item.detalhes.map((detail, i) => (
              <View key={i} style={styles.detail}>
                <Text style={styles.detailTitle}>
                  {detail.equipe ? `Equipe ${detail.equipe} · ` : ''}
                  {detail.placa}
                </Text>
                <Text style={styles.detailText}>
                  {maintenance ? 'Motorista' : 'Responsável'}:{' '}
                  {detail.responsavel ?? 'Motorista não identificado'}
                </Text>
                <Text style={styles.detailText}>Veículo: {detail.modelo}</Text>
              </View>
            ))}
          </View>
        )}
      </Pressable>
      <View style={styles.cardActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Editar registro"
          onPress={onEdit}
          style={styles.cardAction}
        >
          <Icon name="edit" size={18} color={colors.white} />
          <Text style={styles.actionText}>Editar</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Apagar registro"
          onPress={onDelete}
          style={[styles.cardAction, styles.deleteAction]}
        >
          <Icon name="trash" size={18} color={colors.white} />
          <Text style={styles.actionText}>Apagar</Text>
        </Pressable>
      </View>
    </View>
  );
}
export default function HistoryScreen() {
  const { history, deleteEntry } = useFleet();
  const router = useRouter();
  const { atualizado, tipo } = useLocalSearchParams<{ atualizado?: string; tipo?: string }>();
  const { profile, demo } = useAuth();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [type, setType] = useState<HistoryFilter>(
    tipo === 'manutencao' ? 'manutencao' : 'registro',
  );
  const [rows, setRows] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [retryOffset, setRetryOffset] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<HistoryItem | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleted, setDeleted] = useState(false);
  const deleteLock = useRef(false);
  const canDelete = profile?.ativo === true && profile.perfil === 'admin';
  async function confirmDelete() {
    if (!pendingDelete || deleteLock.current) return;
    if (!canDelete) {
      setPendingDelete(null);
      setAccessDenied(true);
      return;
    }
    deleteLock.current = true;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteEntry(pendingDelete.id, pendingDelete.tipo);
      setPendingDelete(null);
      setDeleted(true);
      await load();
    } catch (err) {
      setDeleteError(friendlyError(err));
    } finally {
      deleteLock.current = false;
      setDeleting(false);
    }
  }
  const generation = useRef(0);
  const moreLock = useRef(false);
  useEffect(() => {
    if (tipo === 'registro' || tipo === 'manutencao') setType(tipo);
  }, [tipo]);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const load = useCallback(
    async (offset = 0, refresh = false) => {
      const request = ++generation.current;
      setLoading(true);
      setRefreshing(refresh);
      setError('');
      setRetryOffset(offset);
      try {
        const data = await history(query, offset, type);
        if (request !== generation.current) return;
        setRows((prev) => (offset ? [...prev, ...data.slice(0, 20)] : data.slice(0, 20)));
        setHasMore(data.length > 20);
      } catch (err) {
        if (request === generation.current) setError(friendlyError(err));
      } finally {
        if (request === generation.current) {
          setLoading(false);
          setRefreshing(false);
          moreLock.current = false;
        }
      }
    },
    [history, query, type],
  );
  useFocusEffect(
    useCallback(() => {
      setRows([]);
      void load();
      return () => {
        generation.current++;
        moreLock.current = false;
      };
    }, [load]),
  );
  function showMore() {
    if (loading || moreLock.current) return;
    moreLock.current = true;
    void load(rows.length);
  }
  return (
    <>
      <FlatList
        data={rows}
        keyExtractor={(row) => `${row.tipo}-${row.id}`}
        renderItem={({ item }) => (
          <HistoryCard
            item={item}
            onEdit={() =>
              router.push({ pathname: '/editar', params: { id: item.id, tipo: item.tipo } })
            }
            onDelete={() => {
              if (!canDelete) {
                setAccessDenied(true);
                return;
              }
              setDeleteError('');
              setPendingDelete(item);
            }}
          />
        )}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        refreshing={refreshing}
        onRefresh={() => {
          void load(0, true);
        }}
        ListHeaderComponent={
          <View style={styles.heading}>
            {(deleted || atualizado) && (
              <Text accessibilityRole="alert" style={styles.sent}>
                {deleted ? 'Registro apagado.' : 'Alterações salvas.'}
              </Text>
            )}
            <View>
              <Text style={ui.title}>Histórico</Text>
              <Text style={ui.subtitle}>
                {profile?.perfil === 'admin'
                  ? 'Registros enviados pela equipe.'
                  : 'Consulte seus registros enviados.'}
              </Text>
            </View>
            <View style={styles.filters}>
              {(
                [
                  {
                    value: 'registro',
                    label: 'Registros',
                    icon: 'clipboard',
                    description: 'Equipes e veículos',
                  },
                  {
                    value: 'manutencao',
                    label: 'Manutenções',
                    icon: 'wrench',
                    description: 'Serviços e custos',
                  },
                ] as const
              ).map((filter) => {
                const selected = type === filter.value;
                return (
                  <Pressable
                    key={filter.value}
                    accessibilityRole="button"
                    accessibilityLabel={filter.label}
                    accessibilityState={{ selected }}
                    aria-pressed={selected}
                    onPress={() => {
                      setSearch('');
                      setQuery('');
                      setType(filter.value);
                      router.setParams({ tipo: filter.value });
                    }}
                    style={[styles.filter, selected && styles.selectedFilter]}
                  >
                    <Icon
                      name={filter.icon}
                      size={24}
                      color={selected ? colors.white : colors.homeMuted}
                    />
                    <Text style={[styles.filterText, selected && styles.selectedFilterText]}>
                      {filter.label}
                    </Text>
                    <Text style={[styles.filterDescription, selected && styles.selectedFilterText]}>
                      {filter.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={[ui.field, styles.search]}>
              <Icon name="search" size={21} color={colors.muted} />
              <TextInput
                accessibilityLabel="Buscar por placa ou contrato"
                placeholder="Buscar por placa ou contrato"
                placeholderTextColor={colors.muted}
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
                autoCorrect={false}
              />
              {!!search && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Limpar busca"
                  onPress={() => setSearch('')}
                  style={styles.clear}
                >
                  <Icon name="close" size={19} />
                </Pressable>
              )}
            </View>
            <View style={styles.resultsHeading}>
              <Text style={styles.resultsTitle}>
                {type === 'registro' ? 'Registros de equipes' : 'Serviços de manutenção'}
              </Text>
              <Text style={styles.resultsHint}>Mais recentes primeiro</Text>
            </View>
            {!!error && (
              <ErrorNotice
                message={error}
                onRetry={() => {
                  void load(retryOffset);
                }}
              />
            )}
          </View>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Icon name="history" size={37} color={colors.muted} />
              </View>
              <Text style={styles.emptyTitle}>
                {query ? 'Nenhum resultado encontrado' : 'Seu histórico começa aqui'}
              </Text>
              <Text style={styles.emptyText}>
                {query
                  ? 'Tente outra placa ou outro contrato.'
                  : demo
                    ? `Salve um exemplo em ${type === 'registro' ? 'Registro' : 'Manutenção'} para vê-lo aqui.`
                    : `Seus envios de ${type === 'registro' ? 'equipes' : 'manutenção'} aparecerão nesta categoria.`}
              </Text>
              {!query && (
                <Button
                  title={type === 'registro' ? 'Registrar equipe' : 'Registrar manutenção'}
                  onPress={() => router.navigate(type === 'registro' ? '/registro' : '/manutencao')}
                />
              )}
            </View>
          ) : null
        }
        ListFooterComponent={
          <View style={styles.listFooter}>
            {loading && <ActivityIndicator color={colors.orange} />}
            {!error && hasMore && (
              <Button secondary title="Carregar mais" loading={loading} onPress={showMore} />
            )}
            {!loading && rows.length > 0 && !hasMore && (
              <Text style={styles.end}>Você chegou ao fim desta categoria.</Text>
            )}
          </View>
        }
      />
      <Modal
        visible={accessDenied}
        transparent
        animationType="fade"
        onRequestClose={() => setAccessDenied(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.emptyTitle}>Acesso negado</Text>
            <Text accessibilityRole="alert" style={styles.detailText}>
              Somente administradores podem fazer esse tipo de ação.
            </Text>
            <Button title="Entendi" onPress={() => setAccessDenied(false)} />
          </View>
        </View>
      </Modal>
      <Modal
        visible={!!pendingDelete}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleting) setPendingDelete(null);
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.emptyTitle}>Apagar este registro?</Text>
            <Text style={styles.detailText}>
              {pendingDelete?.contrato} · {pendingDelete?.placas.join(', ')}
            </Text>
            <Text style={styles.detailText}>
              O registro será excluído do histórico e do banco de dados. Essa ação não pode ser
              desfeita.
            </Text>
            {!!deleteError && <ErrorNotice message={deleteError} />}
            <Button
              title="Confirmar exclusão"
              icon="trash"
              loading={deleting}
              onPress={() => {
                void confirmDelete();
              }}
            />
            <Button
              title="Cancelar"
              secondary
              disabled={deleting}
              onPress={() => setPendingDelete(null)}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 30, gap: 14 },
  heading: { gap: 20, marginBottom: 7 },
  search: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingRight: 5 },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: 54,
    fontSize: 14,
    color: colors.navy,
    outlineWidth: 0,
  },
  clear: { height: 44, width: 38, alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', gap: 8 },
  filter: {
    flex: 1,
    minHeight: 100,
    paddingVertical: 15,
    paddingHorizontal: 4,
    borderRadius: 15,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  selectedFilter: { backgroundColor: colors.navy, borderColor: colors.navy },
  filterText: { fontSize: 15, fontWeight: '700', color: colors.navy },
  filterDescription: { fontSize: 11, color: colors.homeMuted },
  selectedFilterText: { color: colors.white },
  resultsHeading: { gap: 5 },
  resultsTitle: { fontSize: 17, fontWeight: '700', color: colors.navy },
  resultsHint: { fontSize: 12, color: colors.muted },
  card: {
    padding: 17,
    backgroundColor: colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderColor: colors.line,
    marginTop: 16,
    paddingTop: 12,
  },
  cardAction: {
    minHeight: 44,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.navy,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  deleteAction: { backgroundColor: colors.error },
  actionText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  overlay: {
    flex: 1,
    backgroundColor: '#0b2c4488',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 20,
    gap: 18,
  },
  cardTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 7,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  date: { fontSize: 12, color: colors.muted },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.navy, marginTop: 17 },
  summaryLine: { marginTop: 12, gap: 3 },
  summaryLabel: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  contract: { fontSize: 15, color: colors.navy },
  plates: { fontSize: 14, fontWeight: '600', color: colors.navy, lineHeight: 21 },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    gap: 8,
  },
  cost: { fontSize: 20, color: colors.navy, fontWeight: '800' },
  sent: { color: colors.green, fontSize: 12, fontWeight: '600' },
  detailsLink: { color: colors.orangeText, fontSize: 12, fontWeight: '700' },
  details: { borderTopWidth: 1, borderColor: colors.line, marginTop: 17, paddingTop: 5 },
  detail: { paddingTop: 12, gap: 5 },
  detailTitle: { fontSize: 14, color: colors.navy, fontWeight: '700' },
  detailText: { fontSize: 13, color: colors.muted, lineHeight: 20 },
  empty: { paddingVertical: 35, alignItems: 'center', gap: 14 },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.navy, textAlign: 'center' },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 280,
  },
  listFooter: { gap: 18, paddingTop: 10 },
  end: { color: colors.muted, textAlign: 'center', fontSize: 12 },
});
