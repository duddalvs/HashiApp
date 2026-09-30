import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFleet } from '@/providers/FleetProvider';
import type { LastDriverVehicle } from '@/types/models';
import { displayDate } from '@/lib/format';
import { colors } from '@/lib/theme';
import { SearchSelect } from './SearchSelect';
import { Icon } from './Icon';

export function AllocationVehicleSelect({
  driverId,
  entryId,
  ...props
}: {
  driverId: number | null;
  entryId: string;
  label: string;
  value: number | null;
  onChange: (id: number | null) => void;
  error?: string;
  disabled?: boolean;
}) {
  const { vehicleOptions, getLastDriverVehicle } = useFleet();
  const [result, setResult] = useState<{
    driverId: number;
    entryId: string;
    value: LastDriverVehicle | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const request = useRef(0);
  const load = useCallback(async () => {
    const generation = ++request.current;
    setFailed(false);
    setResult(null);
    if (driverId == null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const value = await getLastDriverVehicle(driverId, entryId);
      if (generation === request.current) setResult({ driverId, entryId, value });
    } catch {
      if (generation === request.current) setFailed(true);
    } finally {
      if (generation === request.current) setLoading(false);
    }
  }, [driverId, entryId, getLastDriverVehicle]);
  useEffect(() => {
    void load();
    return () => {
      request.current++;
    };
  }, [load]);
  const last = result?.driverId === driverId && result.entryId === entryId ? result.value : null;
  const option = vehicleOptions.find((v) => v.id === last?.vehicleId);
  const header = (select: (id: number) => void) => (
    <View>
      <View style={styles.history}>
        <View style={styles.titleRow}>
          <Icon name="history" size={20} color={colors.orangeText} />
          <Text style={styles.title}>Último veículo deste motorista</Text>
        </View>
        {option && last && !loading ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Usar último veículo: ${option.label}`}
            accessibilityState={{ selected: props.value === option.id }}
            onPress={() => select(option.id)}
            style={styles.suggestion}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.plate}>{option.label}</Text>
              <Text style={styles.detail}>{option.description}</Text>
              <Text style={styles.detail}>
                Alocação de {displayDate(last.date)} · Toque para usar
              </Text>
            </View>
            <Icon
              name={props.value === option.id ? 'check' : 'arrow'}
              size={20}
              color={colors.orangeText}
            />
          </Pressable>
        ) : (
          <Text style={styles.detail}>
            {driverId == null
              ? 'Escolha o motorista para ver o último veículo.'
              : loading
                ? 'Consultando histórico… Você já pode escolher na lista abaixo.'
                : failed
                  ? 'Não foi possível consultar o histórico.'
                  : 'Nenhuma alocação anterior disponível para este motorista.'}
          </Text>
        )}
        {failed && (
          <Pressable accessibilityRole="button" onPress={() => void load()}>
            <Text style={styles.retry}>Tentar novamente</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
  return (
    <SearchSelect
      {...props}
      options={vehicleOptions}
      listHeader={header}
      listHeading="Todos os veículos"
      onOpen={() => {
        if (!loading) void load();
      }}
    />
  );
}
const styles = StyleSheet.create({
  history: {
    backgroundColor: colors.orangeSoft,
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 16,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, color: colors.navy, fontSize: 14, fontWeight: '700' },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 64 },
  plate: { color: colors.navy, fontSize: 18, fontWeight: '800' },
  detail: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  retry: { color: colors.orangeText, paddingVertical: 8, fontWeight: '700' },
});
