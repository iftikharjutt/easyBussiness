import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFirestore, db, auth } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { TrendingUp, TrendingDown, DollarSign, Package, Download, AlertTriangle } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const screenWidth = Dimensions.get('window').width;

export default function ReportsScreen() {
  const transactions = useFirestore('transactions');
  const expenses = useFirestore('expenses');
  const bills = useFirestore('bills');
  const stock = useFirestore('stock');
  const user = auth.currentUser;
  
  const [preferences, setPreferences] = useState({ reportTheme: 'Default' });

  useEffect(() => {
    if (user) fetchPreferences();
  }, [user?.uid]);

  const fetchPreferences = async () => {
    try {
      const prefSnap = await getDoc(doc(db, 'users', user.uid, 'settings', 'app_preferences'));
      if (prefSnap.exists()) setPreferences(prefSnap.data());
    } catch (e) { console.error(e); }
  };

  // Dynamic Theme Colors
  const themeColors = useMemo(() => {
    const theme = preferences.reportTheme || 'Default';
    if (theme === 'Professional') return { primary: '#3b82f6', secondary: '#14b8a6', accent: '#0ea5e9' };
    if (theme === 'Contrast') return { primary: '#1e293b', secondary: '#64748b', accent: '#334155' };
    return { primary: '#7e22ce', secondary: '#ec4899', accent: '#f59e0b' }; // Default
  }, [preferences.reportTheme]);

  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalSales = bills.reduce((acc, b) => acc + b.total, 0);
  const netProfit = totalSales - totalExpense;

  // Process Expense Categories for Pie Chart
  const expensePieData = useMemo(() => {
    const categories = {};
    expenses.forEach(e => {
      const cat = e.category || 'General';
      categories[cat] = (categories[cat] || 0) + e.amount;
    });
    
    const palette = [themeColors.primary, themeColors.secondary, themeColors.accent, '#10b981', '#f43f5e', '#8b5cf6'];
    return Object.keys(categories).map((cat, index) => ({
      name: cat,
      amount: categories[cat],
      color: palette[index % palette.length],
      legendFontColor: "#7F7F7F",
      legendFontSize: 11
    }));
  }, [expenses, themeColors]);

  const barChartData = useMemo(() => {
    const monthlySales = {};
    bills.forEach(b => {
      const month = b.date.split(' ')[1];
      monthlySales[month] = (monthlySales[month] || 0) + b.total;
    });
    const labels = Object.keys(monthlySales).slice(-6);
    return { labels: labels.length ? labels : ['No Data'], datasets: [{ data: labels.map(l => monthlySales[l]) }] };
  }, [bills]);

  const exportToCSV = async () => {
    try {
      let csvContent = "Type,Category,Description,Amount,Date\n";
      bills.forEach(b => { csvContent += `Sale,Invoice,${b.customerName},${b.total},${b.date}\n`; });
      expenses.forEach(e => { csvContent += `Expense,${e.category},${e.description},${e.amount},${e.date}\n`; });
      const fileName = `easyBussiness_Report_${new Date().toISOString().slice(0,10)}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(filePath);
      else Alert.alert("Success", `Report saved to ${filePath}`);
    } catch (e) { Alert.alert("Error", "Failed to generate CSV report."); }
  };

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `${themeColors.primary}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Business Analytics</Text>
        <Text style={styles.headerSub}>Theme: {preferences.reportTheme || 'Default'}</Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={[styles.statCard, { borderLeftColor: themeColors.primary }]}>
          <TrendingUp color={themeColors.primary} size={20} />
          <Text style={styles.statLabel}>Revenue</Text>
          <Text style={styles.statAmt}>Rs {totalSales.toLocaleString()}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: themeColors.secondary }]}>
          <TrendingDown color={themeColors.secondary} size={20} />
          <Text style={styles.statLabel}>Expenses</Text>
          <Text style={styles.statAmt}>Rs {totalExpense.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.profitCard}>
        <View style={styles.profitInfo}>
          <Text style={styles.profitLabel}>Total Net Profit</Text>
          <Text style={[styles.profitAmt, { color: netProfit >= 0 ? '#22c55e' : '#ef4444' }]}>
            Rs {netProfit.toLocaleString()}
          </Text>
        </View>
        <View style={[styles.profitBadge, { backgroundColor: netProfit >= 0 ? '#dcfce7' : '#fee2e2' }]}>
           <DollarSign color={netProfit >= 0 ? '#22c55e' : '#ef4444'} size={24} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Sales Trend</Text>
        <View style={styles.chartBox}>
          <BarChart
            data={barChartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            fromZero={true}
            style={{ borderRadius: 16, marginVertical: 8 }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expense Breakdown</Text>
        <View style={styles.chartBox}>
          {expensePieData.length > 0 ? (
            <PieChart
              data={expensePieData}
              width={screenWidth - 40}
              height={180}
              chartConfig={chartConfig}
              accessor={"amount"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              center={[10, 0]}
              absolute
            />
          ) : (
            <Text style={styles.emptyText}>No expenses recorded yet.</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Critical Inventory Alerts</Text>
        <View style={styles.alertBox}>
           {stock.filter(s => s.quantity < 5).length > 0 ? (
             <View style={styles.alertRow}>
                <AlertTriangle color="#ef4444" size={20} />
                <Text style={styles.alertText}>
                  {stock.filter(s => s.quantity < 5).length} items are running low on stock!
                </Text>
             </View>
           ) : (
             <Text style={styles.noAlertText}>All inventory levels are healthy.</Text>
           )}
        </View>
      </View>

      <TouchableOpacity style={styles.downloadBtn} onPress={exportToCSV}>
        <Download color="white" size={20} />
        <Text style={styles.downloadText}>Export Full Report (CSV)</Text>
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 25, backgroundColor: 'white' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  headerSub: { fontSize: 13, color: '#64748b', marginTop: 4 },
  summaryGrid: { flexDirection: 'row', padding: 15, justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: 'white', padding: 15, borderRadius: 12, borderLeftWidth: 4, elevation: 2 },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  statAmt: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 2 },
  profitCard: { flexDirection: 'row', margin: 15, backgroundColor: 'white', padding: 25, borderRadius: 20, alignItems: 'center', justifyContent: 'space-between', elevation: 3 },
  profitLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  profitAmt: { fontSize: 28, fontWeight: 'bold', marginTop: 5 },
  profitBadge: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  section: { paddingHorizontal: 20, marginTop: 10 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#334155', marginBottom: 12 },
  chartBox: { backgroundColor: 'white', padding: 10, borderRadius: 20, elevation: 1, alignItems: 'center', minHeight: 100, justifyContent: 'center' },
  alertBox: { backgroundColor: 'white', padding: 20, borderRadius: 15, elevation: 1 },
  alertRow: { flexDirection: 'row', alignItems: 'center' },
  alertText: { marginLeft: 12, color: '#ef4444', fontWeight: '600', fontSize: 13, flex: 1 },
  noAlertText: { color: '#22c55e', fontSize: 13, textAlign: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 13 },
  downloadBtn: { margin: 20, backgroundColor: '#1e293b', padding: 18, borderRadius: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  downloadText: { color: 'white', fontWeight: 'bold', marginLeft: 10 }
});
