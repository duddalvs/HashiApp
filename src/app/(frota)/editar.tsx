import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ErrorNotice } from '@/components/Feedback';
import { Button } from '@/components/Button';
import { useFleet } from '@/providers/FleetProvider';
import { colors } from '@/lib/theme';
import { friendlyError } from '@/lib/format';
import type { Registration, Maintenance } from '@/types/models';
import RegistrationScreen from './registro';
import MaintenanceScreen from './manutencao';

export default function EditScreen() {
  const { id, tipo } = useLocalSearchParams<{ id: string; tipo: string }>();
  const router = useRouter();
  const { getEntry } = useFleet();
  const getter = useRef(getEntry);
  getter.current = getEntry;
  const [data, setData] = useState<Registration | Maintenance | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setData(null);
    setError('');
    if (typeof id !== 'string' || (tipo !== 'registro' && tipo !== 'manutencao')) {
      setError('Registro inválido.');
      return;
    }
    getter
      .current(id, tipo)
      .then((value) => {
        if (active) setData(value);
      })
      .catch((err) => {
        if (active) setError(friendlyError(err));
      });
    return () => {
      active = false;
    };
  }, [id, tipo]);
  const back = () => router.replace({ pathname: '/historico', params: { tipo } });
  const done = () =>
    router.replace({ pathname: '/historico', params: { tipo, atualizado: Date.now().toString() } });
  if (error)
    return (
      <View style={{ padding: 24, gap: 16 }}>
        <ErrorNotice message={error} />
        <Button title="Voltar ao histórico" onPress={back} />
      </View>
    );
  if (!data) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.orange} />;
  return tipo === 'registro' ? (
    <RegistrationScreen
      key={id}
      initialValue={data as Registration}
      onEdited={done}
      onCancel={back}
    />
  ) : (
    <MaintenanceScreen
      key={id}
      initialValue={data as Maintenance}
      onEdited={done}
      onCancel={back}
    />
  );
}
