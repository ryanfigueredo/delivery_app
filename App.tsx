import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import StoreScreen from './src/screens/StoreScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import MenuScreen from './src/screens/MenuScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SupportScreen from './src/screens/SupportScreen';
import { theme } from './src/theme';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName: keyof typeof MaterialCommunityIcons.glyphMap;

                if (route.name === 'Loja') {
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
              tabBarActiveTintColor: '#4CAF50',
              tabBarInactiveTintColor: 'gray',
              headerStyle: {
                backgroundColor: '#4CAF50',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            })}
          >
            <Tab.Screen 
              name="Loja" 
              component={StoreScreen}
              options={{ title: '🍔 Controle de Loja' }}
            />
            <Tab.Screen 
              name="Pedidos" 
              component={OrdersScreen}
              options={{ title: '📋 Pedidos' }}
            />
            <Tab.Screen 
              name="Atendimento" 
              component={SupportScreen}
              options={{ title: '💬 Atendimento' }}
            />
            <Tab.Screen 
              name="Cardápio" 
              component={MenuScreen}
              options={{ title: '📝 Cardápio' }}
            />
            <Tab.Screen 
              name="Configurações" 
              component={SettingsScreen}
              options={{ title: '⚙️ Config' }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
