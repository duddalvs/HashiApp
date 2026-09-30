import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { DateField } from '@/components/DateField';
import { SearchSelect } from '@/components/SearchSelect';
import { FormScreen } from '@/components/FormScreen';
import { SuccessDialog } from '@/components/Feedback';
import { Icon } from '@/components/Icon';
import { useFleet, newMaintenance } from '@/providers/FleetProvider';
import { useAuth } from '@/providers/AuthProvider';
import { colors, ui } from '@/lib/theme';
import { MAINTENANCE_NOTE_LIMIT, validateMaintenance, type Errors } from '@/lib/validation';
import { costFromDigits, currency, digitsOnly, friendlyError } from '@/lib/format';
import { Button } from '@/components/Button';
import type { Maintenance } from '@/types/models';
export default function MaintenanceScreen({
  initialValue,
  onEdited,
  onCancel,
}: { initialValue?: Maintenance; onEdited?: () => void; onCancel?: () => void } = {}) {
  const router = useRouter();
  const { demo } = useAuth();
  const { catalogs, employeeOptions, maintenance, setMaintenance, saveMaintenance } = useFleet();
  const [editData, setEditData] = useState(() => initialValue ?? newMaintenance());
  const editing = !!initialValue;
  const data = editing ? editData : maintenance;
  const setData = editing ? setEditData : setMaintenance;
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const lock = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const vehicle = catalogs.vehicles.find((v) => v.id === data.vehicleId);
  const patch = (value: Partial<typeof data>) => {
    setData((d) => ({ ...d, ...value }));
    setErrors({});
    setError('');
  };
  async function save() {
    if (lock.current) return;
    const nextErrors = validateMaintenance(data, catalogs);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setError('Confira os campos destacados antes de salvar.');
      scroll.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    lock.current = true;
    setSaving(true);
    setError('');
    try {
      await saveMaintenance(data);
      if (editing) {
        onEdited?.();
        return;
      }
      setSuccess(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }
  function reset(history: boolean) {
    setData(newMaintenance());
    setErrors({});
    setError('');
    setSuccess(false);
    scroll.current?.scrollTo({ y: 0 });
    if (history) router.navigate({ pathname: '/historico', params: { tipo: 'manutencao' } });
  }
  return (
    <>
      <FormScreen
        ref={scroll}
        title={editing ? 'Editar manutenção' : 'Manutenção da Frota'}
        subtitle={
          editing
            ? 'Atualize o serviço e salve as alterações.'
            : 'Registre o serviço realizado e seu custo.'
        }
        saveLabel={editing ? 'Salvar alterações' : 'Salvar manutenção'}
        saving={saving}
        onSave={save}
        error={error}
      >
        {editing && (
          <Button title="Cancelar edição" secondary disabled={saving} onPress={onCancel!} />
        )}
        <DateField
          value={data.date}
          onChange={(date) => patch({ date })}
          error={errors.date}
          disabled={saving}
        />
        <SearchSelect
          label="Contrato"
          value={data.contractId}
          onChange={(contractId) => patch({ contractId })}
          options={catalogs.contracts.map((c) => ({ id: c.id, label: c.nome }))}
          error={errors.contract}
          disabled={saving}
        />
        <SearchSelect
          label="Placa"
          value={data.vehicleId}
          onChange={(vehicleId) => patch({ vehicleId })}
          options={catalogs.vehicles.map((v) => ({
            id: v.id,
            label: v.placa,
            description: v.modelo,
          }))}
          error={errors.vehicle}
          disabled={saving}
        />
        <View style={styles.vehicle}>
          <View style={styles.vehicleHead}>
            <Text style={styles.vehicleLabel}>VEÍCULO SELECIONADO</Text>
            <Icon name="lock" size={16} color={colors.muted} />
          </View>
          {vehicle && <Text style={styles.plate}>{vehicle.placa}</Text>}
          <Text style={[ui.label, { fontSize: 13, marginTop: 12 }]}>Modelo do veículo</Text>
          <TextInput
            accessibilityLabel="Modelo do veículo"
            editable={false}
            value={vehicle?.modelo ?? ''}
            placeholder="Selecione uma placa acima"
            placeholderTextColor={colors.muted}
            multiline
            style={styles.model}
          />
          {vehicle?.modelo.startsWith('PENDENTE') && (
            <Text style={styles.pending}>Modelo aguardando atualização do cadastro.</Text>
          )}
        </View>
        <View>
          <SearchSelect
            label="Motorista"
            searchMode="ordered-name"
            value={data.driverId}
            onChange={(driverId) => patch({ driverId, driverUnidentified: false })}
            placeholder={data.driverUnidentified ? 'Motorista não identificado' : undefined}
            options={employeeOptions}
            error={errors.driver}
            disabled={saving || data.driverUnidentified}
          />
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel="Motorista não identificado"
            aria-checked={!!data.driverUnidentified}
            accessibilityState={{ checked: !!data.driverUnidentified, disabled: saving }}
            disabled={saving}
            onPress={() => patch({ driverUnidentified: !data.driverUnidentified, driverId: null })}
            style={styles.driverOption}
          >
            <View style={[styles.checkbox, data.driverUnidentified && styles.checkboxChecked]}>
              {data.driverUnidentified && <Icon name="check" size={18} color={colors.white} />}
            </View>
            <Text style={styles.driverOptionText}>Motorista não identificado</Text>
          </Pressable>
        </View>
        <SearchSelect
          label="Tipo de manutenção"
          value={data.typeId}
          onChange={(typeId) => patch({ typeId })}
          options={catalogs.maintenanceTypes.map((t) => ({ id: t.id, label: t.nome }))}
          error={errors.type}
          disabled={saving}
        />
        <View>
          <View style={styles.noteHeading}>
            <Text style={ui.label}>Observação (opcional)</Text>
            <Text style={styles.noteCount}>
              {Array.from(data.note ?? '').length}/{MAINTENANCE_NOTE_LIMIT}
            </Text>
          </View>
          <TextInput
            accessibilityLabel="Observação"
            accessibilityHint="Opcional. Máximo de 40 caracteres."
            value={data.note ?? ''}
            onChangeText={(text) =>
              patch({ note: Array.from(text).slice(0, MAINTENANCE_NOTE_LIMIT).join('') })
            }
            // Native maxLength counts UTF-16 units; the handler limits Unicode characters.
            maxLength={MAINTENANCE_NOTE_LIMIT * 2}
            editable={!saving}
            placeholder="Adicione uma observação"
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
            style={[ui.field, styles.note, errors.note && { borderColor: colors.error }]}
          />
          {!!errors.note && <Text style={ui.error}>{errors.note}</Text>}
        </View>
        <View>
          <Text style={ui.label}>Valor</Text>
          <TextInput
            accessibilityLabel="Valor"
            keyboardType="number-pad"
            inputMode="numeric"
            value={data.costDigits ? currency(costFromDigits(data.costDigits)) : ''}
            onChangeText={(text) => patch({ costDigits: digitsOnly(text) })}
            editable={!saving}
            placeholder="R$ 0,00"
            placeholderTextColor={colors.muted}
            style={[ui.field, styles.cost, errors.cost && { borderColor: colors.error }]}
          />
          {errors.cost && <Text style={ui.error}>{errors.cost}</Text>}
        </View>
      </FormScreen>
      <SuccessDialog
        visible={success}
        message="Manutenção registrada com sucesso."
        demo={demo}
        onContinue={() => reset(false)}
        onHistory={() => reset(true)}
      />
    </>
  );
}
const styles = StyleSheet.create({
  noteHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  noteCount: { color: colors.muted, fontSize: 12 },
  note: { minHeight: 82, paddingVertical: 14 },
  driverOption: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
  driverOptionText: { flex: 1, color: colors.navy, fontSize: 15 },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.muted,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.orange, borderColor: colors.orange },
  vehicle: { backgroundColor: colors.blueSoft, padding: 17, borderRadius: 14 },
  vehicleHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleLabel: { fontSize: 10, letterSpacing: 1, color: colors.muted, fontWeight: '800' },
  plate: {
    alignSelf: 'flex-start',
    marginTop: 12,
    color: colors.navy,
    borderColor: colors.line,
    borderWidth: 1,
    borderTopWidth: 5,
    borderTopColor: colors.navy,
    borderRadius: 6,
    backgroundColor: colors.white,
    paddingVertical: 7,
    paddingHorizontal: 14,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: 2,
  },
  model: { color: colors.navy, fontSize: 15, lineHeight: 22, padding: 0 },
  pending: { color: colors.orangeText, fontSize: 12, marginTop: 8 },
  cost: { fontSize: 21, fontWeight: '700' },
});
