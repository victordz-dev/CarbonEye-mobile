import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Map, History as HistoryIcon, Info, Settings } from 'lucide-react-native';

// Providers / Contexts
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Navigation Params
import { RootStackParamList, AuthStackParamList, MainTabParamList } from '../types/navigation';
import { usePushNotifications } from '../hooks';
import api from '../services/api';
import { useEffect } from 'react';

// Screens
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MapScreen } from '../screens/MapScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { DetailsScreen } from '../screens/DetailsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { InfoScreen } from '../screens/InfoScreen';
import { HealthCheckScreen } from '../screens/HealthCheckScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { TestAreaScreen } from '../screens/TestAreaScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

const TabNavigator: React.FC = () => {
  const { colors } = useTheme();

  return (
    <MainTab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface, shadowColor: 'transparent', elevation: 0 },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <MainTab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Painel',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <MainTab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: 'Análise de Área',
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
        }}
      />
      <MainTab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color, size }) => <HistoryIcon color={color} size={size} />,
        }}
      />
      <MainTab.Screen
        name="Info"
        component={InfoScreen}
        options={{
          title: 'Metodologia',
          tabBarIcon: ({ color, size }) => <Info color={color} size={size} />,
        }}
      />
      <MainTab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </MainTab.Navigator>
  );
};

const PushNotificationManager: React.FC = () => {
  const { expoPushToken } = usePushNotifications();
  const { user } = useAuth();

  useEffect(() => {
    if (user && expoPushToken) {
      api.patch('/auth/push-token', { token: expoPushToken })
        .catch(err => console.warn('Falha ao sincronizar push token:', err.message));
    }
  }, [user, expoPushToken]);

  return null;
};

export const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <PushNotificationManager />
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user === null ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <RootStack.Screen name="Main" component={TabNavigator} />
            <RootStack.Screen
              name="Details"
              component={DetailsScreen}
              options={{
                headerShown: true,
                title: 'Laudo SIRI Detalhado',
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: colors.text,
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <RootStack.Screen
              name="HealthCheck"
              component={HealthCheckScreen}
              options={{
                headerShown: true,
                title: 'Diagnóstico de APIs',
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: colors.text,
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <RootStack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{
                headerShown: true,
                title: 'Notificações',
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: colors.text,
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <RootStack.Screen
              name="TestArea"
              component={TestAreaScreen}
              options={{
                headerShown: true,
                title: 'Área de Testes',
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: colors.text,
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
          </>
        )}
      </RootStack.Navigator>
    </>
  );
};
