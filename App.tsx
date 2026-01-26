import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import StoreScreen from './src/screens/StoreScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import MenuScreen from './src/screens/MenuScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SupportScreen from './src/screens/SupportScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import { theme } from './src/theme';

const Tab = createBottomTabNavigator();

function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName: keyof typeof MaterialCommunityIcons.glyphMap;

                if (route.name === 'Dashboard') {
                  iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
                } else if (route.name === 'Loja') {
                  iconName = focused ? 'store' : 'store-outline';
                } else if (route.name === 'Pedidos') {
                  iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
                } else if (route.name === 'Atendimento') {
                  iconName = focused ? 'message-text' : 'message-text-outline';
                } else if (route.name === 'Cardápio') {
                  iconName = focused ? 'food' : 'food-outline';
                } else {
                  iconName = focused ? 'cog' : 'cog-outline';
                }

                return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#22c55e',
              tabBarInactiveTintColor: '#757575',
              tabBarStyle: {
                backgroundColor: '#ffffff',
                borderTopWidth: 1,
                borderTopColor: '#e0e0e0',
              },
              headerStyle: {
                backgroundColor: '#22c55e',
                elevation: 0,
                shadowOpacity: 0,
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
            })}
          >
            <Tab.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ title: 'Dashboard' }}
            />
            <Tab.Screen 
              name="Loja" 
              component={StoreScreen}
              options={{ title: 'Controle de Loja' }}
            />
            <Tab.Screen 
              name="Pedidos" 
              component={OrdersScreen}
              options={{ title: 'Pedidos' }}
            />
            <Tab.Screen 
              name="Atendimento" 
              component={SupportScreen}
              options={{ title: 'Atendimento' }}
            />
            <Tab.Screen 
              name="Cardápio" 
              component={MenuScreen}
              options={{ title: 'Cardápio' }}
            />
            <Tab.Screen 
              name="Configurações" 
              component={SettingsScreen}
              options={{ title: 'Configurações' }}
            />
          </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
