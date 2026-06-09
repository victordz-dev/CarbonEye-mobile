import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Providers
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

// Navigation
import { AppNavigator } from './src/navigation/AppNavigator';

const queryClient = new QueryClient();

/**
 * Wrapper interno que sincroniza o tema do React Navigation com o ThemeContext.
 * Precisa estar dentro do ThemeProvider para acessar useTheme().
 */
const NavigationWrapper: React.FC = () => {
  const { colors, isDark } = useTheme();

  const navigationTheme: Theme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
      notification: colors.danger,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NavigationWrapper />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
