import { Stack } from 'expo-router';
import { AuthProvider } from '../AuthContext';
import { SearchProvider } from '../SearchContext';
import { theme } from '../theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <SearchProvider>
        <Stack screenOptions={{
          headerStyle: { backgroundColor: theme.card },
          headerTitleStyle: { fontWeight: '700', color: theme.text },
          headerTintColor: theme.primary,
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.bg },
        }} />
      </SearchProvider>
    </AuthProvider>
  );
}
