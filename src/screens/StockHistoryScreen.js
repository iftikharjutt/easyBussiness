import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useFirestore } from '../config/firebase';
import { ArrowUpCircle, ArrowDownCircle, Search, X, ChevronLeft } from 'lucide-react-native';

export default function StockHistoryScreen({ navigation }) {
  const history = useFirestore('stock_history');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'in', 'out'

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = item.productName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || item.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [history, searchQuery, filterType]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft color="#334155" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Stock Movement Reports</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity 
          style={[styles.filterBtn, filterType === 'all' && styles.activeFilter]} 
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterText, filterType === 'all' && styles.activeText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterBtn, filterType === 'in' && styles.activeFilterIn]} 
          onPress={() => setFilterType('in')}
        >
          <Text style={[styles.filterText, filterType === 'in' && styles.activeText]}>IN</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterBtn, filterType === 'out' && styles.activeFilterOut]} 
          onPress={() => setFilterType('out')}
        >
          <Text style={[styles.filterText, filterType === 'out' && styles.activeText]}>OUT</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="gray" />
        <TextInput 
          placeholder="Search by product name..." 
          style={styles.searchInput} 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color="gray" /></TouchableOpacity>}
      </View>

      <FlatList
        data={filteredHistory}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.historyRow}>
            <View style={styles.iconCol}>
               {item.type === 'in' ? (
                 <ArrowUpCircle color="#22c55e" size={24} />
               ) : (
                 <ArrowDownCircle color="#ef4444" size={24} />
               )}
            </View>
            <View style={styles.infoCol}>
               <Text style={styles.pName}>{item.productName}</Text>
               <Text style={styles.dateText}>{item.date}</Text>
            </View>
            <View style={styles.qtyCol}>
               <Text style={[styles.qtyText, { color: item.type === 'in' ? '#22c55e' : '#ef4444' }]}>
                 {item.type === 'in' ? '+' : '-'}{item.quantity}
               </Text>
               <Text style={styles.typeLabel}>{item.type.toUpperCase()}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No movement records found.</Text>}
        contentContainerStyle={{ paddingBottom: 50 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: 'white', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  filterRow: { flexDirection: 'row', padding: 15, justifyContent: 'center', gap: 10 },
  filterBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  activeFilter: { backgroundColor: '#7e22ce', borderColor: '#7e22ce' },
  activeFilterIn: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  activeFilterOut: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  activeText: { color: 'white' },
  searchBar: { flexDirection: 'row', padding: 12, marginHorizontal: 20, marginBottom: 15, backgroundColor: 'white', borderRadius: 12, alignItems: 'center', elevation: 1 },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 14 },
  historyRow: { flexDirection: 'row', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#f1f5f9', alignItems: 'center' },
  iconCol: { marginRight: 15 },
  infoCol: { flex: 1 },
  pName: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  dateText: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  qtyCol: { alignItems: 'flex-end' },
  qtyText: { fontSize: 18, fontWeight: 'bold' },
  typeLabel: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8', marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' }
});
