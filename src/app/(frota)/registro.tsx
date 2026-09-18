import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { DateField } from '@/components/DateField';
import { SearchSelect } from '@/components/SearchSelect';
import { FormScreen } from '@/components/FormScreen';
import { SuccessDialog } from '@/components/Feedback';
import { useFleet, newRegistration } from '@/providers/FleetProvider';
import { useAuth } from '@/providers/AuthProvider';
import { colors } from '@/lib/theme';
import { validateRegistration, type Errors } from '@/lib/validation';
import { friendlyError } from '@/lib/format';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import type { Registration } from '@/types/models';
export default function RegistrationScreen({
  initialValue,
  onEdited,
  onCancel,
}: { initialValue?: Registration; onEdited?: () => void; onCancel?: () => void } = {}) {
  const router = useRouter();
  const { demo } = useAuth();
  const { catalogs, registration, setRegistration, saveRegistration } = useFleet();
  const [editData, setEditData] = useState(() => initialValue ?? newRegistration());
  const editing = !!initialValue;
  const data = editing ? editData : registration;
  const setData = editing ? setEditData : setRegistration;
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const lock = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const patch = (value: Partial<typeof data>) => {
    setData((d) => ({ ...d, ...value }));
    setErrors({});
    setError('');
  };
  async function save() {
    if (lock.current) return;
    const nextErrors = validateRegistration(data, catalogs);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      if (nextErrors.duplicates) setDuplicateWarning(nextErrors.duplicates);
      setError('Confira os campos destacados antes de salvar.');
      scroll.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    lock.current = true;
    setSaving(true);
    setError('');
    try {
      await saveRegistration(data);
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
    setData(newRegistration());
    setErrors({});
    setError('');
    setSuccess(false);
    scroll.current?.scrollTo({ y: 0 });
    if (history) router.navigate({ pathname: '/historico', params: { tipo: 'registro' } });
  }
  function addTeam() {
    if (data.teams.length >= 50) return;
    patch({ teams: [...data.teams, { responsavel_id: null, veiculo_id: null }] });
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 100);
  }
  function removeTeam(index: number) {
    if (data.teams.length === 1) return;
    patch({ teams: data.teams.filter((_, teamIndex) => teamIndex !== index) });
  }
  return (
    <>
      <FormScreen
        ref={scroll}
        title={editing ? 'Editar registro' : 'Registro da Frota'}
        subtitle={
          editing
            ? 'Atualize os dados e salve as alterações.'
            : 'Cadastre sua equipe e o veículo do dia.'
        }
        saveLabel={editing ? 'Salvar alterações' : 'Salvar registro'}
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
        {data.teams.map((team, index) => (
          <View key={index} style={styles.team}>
            <View style={styles.teamHead}>
              <Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
              <View style={styles.teamHeading}>
                <Text style={styles.teamTitle}>EQUIPE {index + 1}</Text>
                <Text style={styles.teamSub}>Responsável e placa do veículo</Text>
              </View>
              {data.teams.length > 1 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remover equipe ${index + 1}`}
                  disabled={saving}
                  onPress={() => removeTeam(index)}
                  style={({ pressed }) => [styles.removeTeam, pressed && styles.pressed]}
                >
                  <Icon name="close" size={20} color={colors.muted} />
                </Pressable>
              )}
            </View>
            <View style={styles.fields}>
              <SearchSelect
                label={`Equipe ${index + 1} — Responsável`}
                searchMode="ordered-name"
                value={team.responsavel_id}
                onChange={(id) =>
                  patch({
                    teams: data.teams.map((t, i) =>
                      i === index ? { ...t, responsavel_id: id } : t,
                    ),
                  })
                }
                options={catalogs.employees.map((e) => ({ id: e.id, label: e.nome }))}
                error={errors[`employee-${index}`]}
                disabled={saving}
              />
              <SearchSelect
                label={`Equipe ${index + 1} — Placa do veículo`}
                value={team.veiculo_id}
                onChange={(id) =>
                  patch({
                    teams: data.teams.map((t, i) => (i === index ? { ...t, veiculo_id: id } : t)),
                  })
                }
                options={catalogs.vehicles.map((v) => ({
                  id: v.id,
                  label: v.placa,
                  description: v.modelo,
                }))}
                error={errors[`vehicle-${index}`]}
                disabled={saving}
              />
            </View>
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adicionar equipe"
          disabled={saving || data.teams.length >= 50}
          onPress={addTeam}
          style={({ pressed }) => [
            styles.addTeam,
            pressed && styles.pressed,
            (saving || data.teams.length >= 50) && styles.disabled,
          ]}
        >
          <View style={styles.addIcon}>
            <Icon name="plus" size={22} color={colors.white} />
          </View>
          <View style={styles.addCopy}>
            <Text style={styles.addTitle}>Adicionar equipe</Text>
            <Text style={styles.addSub}>
              {data.teams.length === 1
                ? 'Inclua outra equipe neste registro'
                : `${data.teams.length} equipes adicionadas`}
            </Text>
          </View>
        </Pressable>
        {!!errors.count && <Text style={styles.countError}>{errors.count}</Text>}
      </FormScreen>
      <Modal
        visible={!!duplicateWarning}
        transparent
        animationType="fade"
        onRequestClose={() => setDuplicateWarning('')}
      >
        <View style={styles.warningOverlay}>
          <View style={styles.warningDialog}>
            <Icon name="alert" size={32} color={colors.orangeText} />
            <Text accessibilityRole="header" style={styles.warningTitle}>
              Confira as equipes
            </Text>
            <Text style={styles.warningText}>
              O mesmo funcionário ou veículo foi selecionado em mais de uma equipe neste registro.
            </Text>
            <ScrollView style={styles.warningDetails}>
              <Text accessibilityRole="alert" style={styles.warningText}>
                {duplicateWarning}
              </Text>
            </ScrollView>
            <Text style={styles.warningText}>Corrija os campos destacados antes de enviar.</Text>
            <Button title="Corrigir equipes" onPress={() => setDuplicateWarning('')} />
          </View>
        </View>
      </Modal>
      <SuccessDialog
        visible={success}
        message="Registro enviado com sucesso."
        demo={demo}
        onContinue={() => reset(false)}
        onHistory={() => reset(true)}
      />
    </>
  );
}
const styles = StyleSheet.create({
  warningOverlay: {
    flex: 1,
    backgroundColor: '#0b2c4488',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  warningDialog: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 22,
    gap: 16,
  },
  warningTitle: { fontSize: 22, fontWeight: '700', color: colors.navy },
  warningText: { fontSize: 15, lineHeight: 22, color: colors.navy },
  warningDetails: { maxHeight: 240, flexShrink: 1 },
  team: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 17,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  teamHead: {
    backgroundColor: colors.blueSoft,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  teamHeading: { flex: 1 },
  removeTeam: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { color: colors.orangeText, fontSize: 24, fontWeight: '800' },
  teamTitle: { color: colors.navy, fontSize: 13, fontWeight: '800', letterSpacing: 0.6 },
  teamSub: { color: colors.muted, fontSize: 12, marginTop: 6 },
  fields: { padding: 16, gap: 20 },
  addTeam: {
    minHeight: 72,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.orange,
    borderRadius: 17,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.orangeSoft,
  },
  addIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
  },
  addCopy: { flex: 1 },
  addTitle: { color: colors.navy, fontSize: 15, fontWeight: '800' },
  addSub: { color: colors.muted, fontSize: 12, marginTop: 4 },
  countError: { color: colors.error, fontSize: 13, marginTop: -8 },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
});
