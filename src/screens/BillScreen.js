import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { useFirestore, addDocToDb, db } from '../config/firebase';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { FileText, Plus, Search, Calendar, User, X } from 'lucide-react-native';

export default function BillScreen({ navigation }) {
  const bills = useFirestore('bills');
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [customer, setCustomer] = useState('');
  const [items, setItems] = useState('');
  const [totalAmount, setTotalAmount] = useState('');

  // Search Logic
  const filteredBills = useMemo(() => {
    return bills.filter(b => 
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.billNo.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [bills, searchQuery]);

  const handleCreateBill = async () => {
    try {
      if (!customer || !totalAmount) return;
      const billData = {
        customerName: customer,
        itemsSummary: items,
        total: parseFloat(totalAmount),
        billNo: `INV-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: 'unpaid',
        timestamp: new Date()
      };
      await addDocToDb('bills', billData);
      setCustomer(''); setItems(''); setTotalAmount('');
      setModalVisible(false);
    } catch (e) {
      console.error(e, 'handleCreateBill');
      Alert.alert('Error', 'An error occurred while creating bill: ' + e.message);
    }
  };

  const handleDeleteBill = (id) => {
    Alert.alert("Delete Bill", "Are you sure you want to delete this invoice?", [
      { text: "Cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
        try {
          await deleteDoc(doc(db, 'bills', id));
        } catch (e) {
          console.error(e, 'handleDeleteBill');
          Alert.alert('Error', 'An error occurred while deleting bill: ' + e.message);
        }
      }}
    ]);
  };

  const toggleBillStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
      await updateDoc(doc(db, 'bills', id), {
        status: newStatus
      });
    } catch (e) {
      console.error(e, 'toggleBillStatus');
      Alert.alert('Error', 'An error occurred while updating bill status: ' + e.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Total Sales</Text>
          <Text style={styles.statVal}>Rs {bills.reduce((acc, b) => acc + b.total, 0).toLocaleString()}</Text>
        </View>
        <View style={[styles.stat, { borderLeftWidth: 1, borderColor: '#eee' }]}>
          <Text style={styles.statLabel}>Pending Bills</Text>
          <Text style={[styles.statVal, { color: '#f59e0b' }]}>{bills.filter(b => b.status === 'unpaid').length}</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="gray" />
        <TextInput 
          placeholder="Search by Bill No or Customer..." 
          style={styles.searchInput} 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color="gray" /></TouchableOpacity>}
      </View>

      <FlatList
        data={filteredBills}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.billCard}
            onLongPress={() => handleDeleteBill(item.id)}
            onPress={() => navigation.navigate('BillDetail', { bill: item })}
          >
            <View style={styles.billHeader}>
              <View>
                 <Text style={styles.billNo}>{item.billNo}</Text>
                 <TouchableOpacity onPress={() => toggleBillStatus(item.id, item.status)}>
                    <View style={[styles.statusBadge, { backgroundColor: item.status === 'paid' ? '#dcfce7' : '#fef3c7' }]}>
                      <Text style={[styles.statusText, { color: item.status === 'paid' ? '#166534' : '#92400e' }]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                 </TouchableOpacity>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                 <Text style={styles.totalAmt}>Rs {item.total.toLocaleString()}</Text>
                 <Text style={styles.dateText}>{item.date}</Text>
              </View>
            </View>
            <View style={styles.billBody}>
              <View style={styles.infoRow}>
                <User size={14} color="#64748b" />
                <Text style={styles.custName}>{item.customerName}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No bills found.</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus color="white" size={24} />
        <Text style={styles.fabText}>CREATE BILL</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Digital Bill</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Customer Name</Text>
              <TextInput placeholder="e.g. Imran Khan" style={styles.mInput} value={customer} onChangeText={setCustomer} />
              
              <Text style={styles.inputLabel}>Items (Summary)</Text>
              <TextInput placeholder="e.g. 5kg Sugar, 2L Oil" style={styles.mInput} value={items} onChangeText={setItems} />
              
              <Text style={styles.inputLabel}>Total Amount (Rs)</Text>
              <TextInput placeholder="0.00" style={styles.mInput} keyboardType="numeric" value={totalAmount} onChangeText={setTotalAmount} />
              
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCreateBill} style={styles.saveBtn}>
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Generate Bill</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  topBar: { flexDirection: 'row', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#eee' },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 12, color: 'gray' },
  statVal: { fontSize: 20, fontWeight: 'bold', color: '#f59e0b' },
  searchBar: { flexDirection: 'row', padding: 12, margin: 15, backgroundColor: 'white', borderRadius: 12, alignItems: 'center', elevation: 1 },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 14 },
  billCard: { backgroundColor: 'white', marginHorizontal: 15, marginBottom: 15, borderRadius: 15, padding: 15, elevation: 2 },
  billHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderColor: '#f1f5f9', paddingBottom: 10 },
  billNo: { fontWeight: 'bold', fontSize: 14, color: '#475569', marginBottom: 5 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, alignSelf: 'flex-start' },
  statusText: { fontSize: 9, fontWeight: 'bold' },
  billBody: { paddingTop: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  custName: { marginLeft: 8, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  dateText: { fontSize: 10, color: '#64748b', marginTop: 2 },
  totalAmt: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' },
  fab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#f59e0b', paddingHorizontal: 20, height: 52, borderRadius: 26, flexDirection: 'row', alignItems: 'center', elevation: 5 },
  fabText: { color: 'white', fontWeight: 'bold', marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 25, maxHeight: '70%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#f59e0b', textAlign: 'center' },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#475569', marginTop: 15 },
  mInput: { borderBottomWidth: 1, borderColor: '#ddd', paddingVertical: 8, marginBottom: 5 },
  modalActions: { flexDirection: 'row', marginTop: 30 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center' },
  saveBtn: { flex: 1.5, backgroundColor: '#f59e0b', padding: 15, borderRadius: 12, alignItems: 'center' }
});
