import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Home, ArrowLeftRight, MoreHorizontal, BarChart3 } from 'lucide-react-native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import './src/config/i18n';
import { useTranslation } from 'react-i18next';

// Import Screens
import HomeScreen from './src/screens/HomeScreen';
import LedgerScreen from './src/screens/LedgerScreen';
import CustomerDetailScreen from './src/screens/CustomerDetailScreen';
import CashbookScreen from './src/screens/CashbookScreen';
import StockScreen from './src/screens/StockScreen';
import StockHistoryScreen from './src/screens/StockHistoryScreen';
import StaffScreen from './src/screens/StaffScreen';
import ExpenseScreen from './src/screens/ExpenseScreen';
import BillScreen from './src/screens/BillScreen';
import BillDetailScreen from './src/screens/BillDetailScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import POSScreen from './src/screens/POSScreen';
import MoreScreen from './src/screens/MoreScreen';
import BusinessProfileScreen from './src/screens/BusinessProfileScreen';
import GeneralSettingsScreen from './src/screens/GeneralSettingsScreen';
import HelpCenterScreen from './src/screens/HelpCenterScreen';
import BackupScreen from './src/screens/BackupScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: true,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="MainHome" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Party" component={LedgerScreen} options={{ title: t('ledger.title') }} />
      <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} options={{ title: 'Transaction History' }} />
      <Stack.Screen name="Cash" component={CashbookScreen} options={{ title: t('cashbook.title') }} />
      <Stack.Screen name="Stock" component={StockScreen} options={{ title: t('stock.title') }} />
      <Stack.Screen name="StockHistory" component={StockHistoryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Staff" component={StaffScreen} options={{ title: t('staff.title') }} />
      <Stack.Screen name="Expense" component={ExpenseScreen} options={{ title: t('settings.general') }} />
      <Stack.Screen name="Bills" component={BillScreen} options={{ title: t('bills.title') }} />
      <Stack.Screen name="BillDetail" component={BillDetailScreen} options={{ title: 'Invoice Details', headerShown: false }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: t('home.reports') }} />
      <Stack.Screen name="POS" component={POSScreen} options={{ title: 'Point of Sale' }} />
      <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} options={{ title: t('settings.business_profile') }} />
      <Stack.Screen name="GeneralSettings" component={GeneralSettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Backup" component={BackupScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function NavigationRoot() {
  const [user, setUser] = useState({ uid: 'default_user', email: 'guest@easybussiness.com' });
  const { isDarkMode, colors } = useTheme();
  const { t } = useTranslation();

  return (
    <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: 'gray',
          tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
          tabBarStyle: { height: 60, paddingBottom: 10, backgroundColor: colors.card },
          tabBarIcon: ({ color, size }) => {
            if (route.name === 'Home') return <Home color={color} size={size} />;
            if (route.name === 'ReportsTab') return <BarChart3 color={color} size={size} />;
            if (route.name === 'Payments') return <ArrowLeftRight color={color} size={size} />;
            if (route.name === 'More') return <MoreHorizontal color={color} size={size} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: t('home.khata') }} />
        <Tab.Screen name="ReportsTab" component={ReportsScreen} options={{ title: t('home.reports'), tabBarLabel: 'Reports' }} />
        <Tab.Screen name="Payments" component={PaymentsScreen} options={{ tabBarLabel: t('home.payments') }} />
        <Tab.Screen name="More" component={MoreScreen} options={{ tabBarLabel: 'More' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NavigationRoot />
    </ThemeProvider>
  );
}
