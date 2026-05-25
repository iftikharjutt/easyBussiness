import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { useFirestore, db } from '../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const GridItem = ({ title, icon, color, onPress }) => {
  const Icon = Icons[icon];
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={[styles.gridBtn, { backgroundColor: colors.card }]} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
        <Icon color={color} size={24} />
      </View>
      <Text style={[styles.gridText, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

export default function HomeScreen({ navigation }) {
  const { colors, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const transactions = useFirestore('transactions');
  const customers = useFirestore('customers');
  const [syncTime, setSyncTime] = useState('Syncing...');

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'sync_info'), (doc) => {
      if (doc.exists()) {
        const date = doc.data().lastSync.toDate();
        setSyncTime(`Last synced: ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      } else {
        setSyncTime('Cloud Sync Active');
      }
    });
    return unsubscribe;
  }, []);

  const calculateCashInHand = () => {
    let totalIn = 0;
    let totalOut = 0;
    transactions.forEach(t => {
      if (t.type === 'in') totalIn += t.amount;
      else totalOut += t.amount;
    });
    return totalIn - totalOut;
  };

  const calculateNetBalance = () => {
    return customers.reduce((acc, c) => acc + (c.balance || 0), 0);
  };

  const cashInHand = calculateCashInHand();
  const netBalance = calculateNetBalance();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TouchableOpacity 
        style={[styles.syncBar, { backgroundColor: colors.card }]} 
        onPress={() => navigation.navigate('Backup')}
      >
        <Icons.CloudCheck size={14} color="#22c55e" />
        <Text style={[styles.syncText, { color: colors.textSecondary }]}>{syncTime}</Text>
      </TouchableOpacity>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.primary, '#ef4444']} style={styles.topCard}>
          <View style={styles.dashboardRow}>
            <View style={styles.dashItem}>
              <Text style={styles.cardLabel}>{t('home.cash_in_hand')}</Text>
              <Text style={styles.cardAmount}>Rs {cashInHand.toLocaleString()}</Text>
            </View>
            <View style={[styles.dashItem, { alignItems: 'flex-end' }]}>
              <Text style={styles.cardLabel}>{t('home.net_balance')}</Text>
              <Text style={styles.cardAmount}>Rs {netBalance.toLocaleString()}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={[styles.secTitle, { color: colors.textSecondary }]}>{t('home.khata')}</Text>
          <View style={styles.grid}>
            <GridItem title={t('ledger.title')} icon="Users" color="#ef4444" onPress={() => navigation.navigate('Party')} />
            <GridItem title={t('cashbook.title')} icon="Wallet" color="#22c55e" onPress={() => navigation.navigate('Cash')} />
            <GridItem title={t('stock.title')} icon="Package" color="#3b82f6" onPress={() => navigation.navigate('Stock')} />
            <GridItem title={t('bills.title')} icon="FileText" color="#f59e0b" onPress={() => navigation.navigate('Bills')} />
            <GridItem title={t('staff.title')} icon="UserCog" color="#8b5cf6" onPress={() => navigation.navigate('Staff')} />
            <GridItem title="Expense" icon="TrendingDown" color="#ec4899" onPress={() => navigation.navigate('Expense')} />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.reportsBanner, { backgroundColor: colors.card }]} 
          onPress={() => navigation.navigate('Reports')}
        >
          <Icons.BarChart3 color={colors.primary} size={24} />
          <View style={styles.bannerText}>
             <Text style={[styles.bannerTitle, { color: colors.text }]}>{t('home.reports')}</Text>
             <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>{t('home.reports_sub')}</Text>
          </View>
          <Icons.ChevronRight color={colors.border} size={20} />
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={[styles.secTitle, { color: colors.textSecondary }]}>{t('home.payments')}</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.payCard, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('POS')}>
              <Icons.Monitor color={colors.primary} />
              <Text style={[styles.payText, { color: colors.text }]}>POS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.payCard, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('Payments')}>
              <Icons.QrCode color={colors.primary} />
              <Text style={[styles.payText, { color: colors.text }]}>QR</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{height: 30}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  syncBar: { flexDirection: 'row', paddingTop: 50, paddingBottom: 8, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', gap: 6 },
  syncText: { fontSize: 10, fontWeight: '500' },
  topCard: { padding: 25, height: 140, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, justifyContent: 'center' },
  dashboardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dashItem: { flex: 1 },
  cardLabel: { color: 'white', opacity: 0.9, fontSize: 13 },
  cardAmount: { color: 'white', fontSize: 22, fontWeight: 'bold', marginTop: 5 },
  section: { padding: 20 },
  secTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridBtn: { width: '31%', alignItems: 'center', marginBottom: 20, padding: 10, borderRadius: 15, elevation: 1 },
  iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  gridText: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  reportsBanner: { flexDirection: 'row', marginHorizontal: 20, padding: 20, borderRadius: 20, alignItems: 'center', elevation: 2 },
  bannerText: { flex: 1, marginLeft: 15 },
  bannerTitle: { fontSize: 16, fontWeight: 'bold' },
  bannerSub: { fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  payCard: { width: '48%', padding: 20, borderRadius: 15, alignItems: 'center', elevation: 2 },
  payText: { marginTop: 8, fontWeight: '600' }
});
