import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { ui } from '@/lib/theme';
export default function NotFound() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 28, gap: 24 }}>
      <Text style={ui.title}>Tela não encontrada</Text>
      <Button title="Voltar ao início" onPress={() => router.replace('/')} />
    </View>
  );
}
