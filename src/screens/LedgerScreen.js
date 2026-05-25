import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { Search, UserPlus, EyeOff, X } from 'lucide-react-native';
import { useFirestore, addDocToDb } from '../config/firebase';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function LedgerScreen({ navigation }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const customers = useFirestore('customers');
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery)
    );
  }, [customers, searchQuery]);

  const handleAddCustomer = async () => {
    try {
      if (!name) return;
      await addDocToDb('customers', { name, phone, balance: 0 });
      setName(''); setPhone('');
      setModalVisible(false);
    } catch (e) {
      console.error("Error in handleAddCustomer:", e);
      Alert.alert("Error", "Failed to add customer. " + e.message);
    }
  };

  const calculateTotals = () => {
    let get = 0; let give = 0;
    customers.forEach(c => {
      const bal = parseFloat(c.balance || 0);
      if (bal >= 0) get += bal; else give += Math.abs(bal);
    });
    return { get, give };
  };

  const { get, give } = calculateTotals();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.balanceRow}>
          <View style={styles.item}>
            <Text style={{color: '#ef4444', fontSize: 11, fontWeight: 'bold'}}>{t('ledger.you_give')}</Text>
            <Text style={[styles.redAmt, { color: '#ef4444' }]}>Rs {give.toLocaleString()}</Text>
          </View>
          <View style={styles.item}>
            <Text style={{color: '#22c55e', fontSize: 11, fontWeight: 'bold'}}>{t('ledger.you_get')}</Text>
            <Text style={[styles.greenAmt, { color: '#22c55e' }]}>Rs {get.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Search size={18} color={colors.textSecondary} />
        <TextInput 
          placeholder={t('common.search')} 
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.text }]} 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color={colors.textSecondary} /></TouchableOpacity>}
      </View>

      <FlatList
        data={filteredCustomers}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.listRow, { borderBottomColor: colors.border }]} 
            onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id, customerName: item.name })}
          >
            <View>
              <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.time, { color: colors.textSecondary }]}>{item.phone || 'No phone'}</Text>
            </View>
            <View style={{alignItems: 'flex-end'}}>
               <Text style={[styles.balance, { color: item.balance >= 0 ? '#22c55e' : '#ef4444' }]}>
                 Rs {Math.abs(item.balance).toLocaleString()}
               </Text>
               <Text style={[styles.subText, { color: colors.textSecondary }]}>{item.balance >= 0 ? t('ledger.receive') : t('ledger.pay')}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
        <UserPlus color="white" size={20} />
        <Text style={styles.fabText}>{t('ledger.add_customer')}</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('ledger.add_customer')}</Text>
            <TextInput 
              placeholder="Name" 
              placeholderTextColor={colors.textSecondary}
              style={[styles.mInput, { color: colors.text, borderColor: colors.border }]} 
              value={name} onChangeText={setName}
            />
            <TextInput 
              placeholder="Phone" 
              placeholderTextColor={colors.textSecondary}
              style={[styles.mInput, { color: colors.text, borderColor: colors.border }]} 
              keyboardType="phone-pad" value={phone} onChangeText={setPhone}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}><Text style={{ color: colors.textSecondary }}>{t('common.cancel')}</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleAddCustomer} style={[styles.saveBtn, { backgroundColor: colors.primary }]}><Text style={{color: 'white', fontWeight: 'bold'}}>{t('common.save')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, borderBottomWidth: 1 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  item: { alignItems: 'center', flex: 1 },
  redAmt: { fontSize: 20, fontWeight: 'bold' },
  greenAmt: { fontSize: 20, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', padding: 12, margin: 15, borderRadius: 12, alignItems: 'center', elevation: 2 },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 14 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
  name: { fontSize: 15, fontWeight: 'bold' },
  time: { fontSize: 12, marginTop: 2 },
  balance: { fontSize: 16, fontWeight: 'bold' },
  subText: { fontSize: 10, marginTop: 2 },
  fab: { position: 'absolute', bottom: 30, right: 20, paddingHorizontal: 20, height: 52, borderRadius: 26, flexDirection: 'row', alignItems: 'center', elevation: 5 },
  fabText: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  mInput: { borderBottomWidth: 1, padding: 10, marginBottom: 15, fontSize: 16 },
  modalActions: { flexDirection: 'row', marginTop: 10 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center' },
  saveBtn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center' }
});
