import { ActivityIndicator, View } from 'react-native';
import { Redirect, Slot } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { SelectOverlayProvider } from '@/components/SelectOverlay';
import { FleetProvider } from '@/providers/FleetProvider';
import { useAuth } from '@/providers/AuthProvider';
import { colors } from '@/lib/theme';
export default function FleetLayout() {
  const { loading, session, profile, demo } = useAuth();
  if (loading)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  if (!demo && (!session || !profile?.ativo)) return <Redirect href="/login" />;
  return (
    <FleetProvider key={demo ? 'demo' : session!.user.id}>
      <SelectOverlayProvider>
        <AppShell>
          <Slot />
        </AppShell>
      </SelectOverlayProvider>
    </FleetProvider>
  );
}
