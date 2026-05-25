import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useFirestore, addDocToDb, db } from '../config/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { TrendingDown, Plus, Search, X } from 'lucide-react-native';

export default function ExpenseScreen() {
  const expenses = useFirestore('expenses');
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Search Logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => 
      e.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [expenses, searchQuery]);

  const handleAddExpense = async () => {
    try {
      if (!amount) return;
      await addDocToDb('expenses', {
        amount: parseFloat(amount),
        category: category || 'General',
        description: desc,
        date: new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }),
        timestamp: new Date()
      });
      setAmount('');
      setCategory('');
      setDesc('');
      setModalVisible(false);
    } catch (e) {
      console.error(e, 'handleAddExpense');
      Alert.alert('Error', 'An error occurred while adding expense: ' + e.message);
    }
  };

  const handleDeleteExpense = (id) => {
    Alert.alert("Delete Expense", "Remove this record from your history?", [
      { text: "Cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
        try {
          await deleteDoc(doc(db, 'expenses', id));
        } catch (e) {
          console.error(e, 'handleDeleteExpense');
          Alert.alert('Error', 'An error occurred while deleting expense: ' + e.message);
        }
      }}
    ]);
  };

  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <View style={styles.container}>
      <View style={styles.topSummary}>
        <TrendingDown color="#ec4899" size={40} />
        <Text style={styles.totalLabel}>Total Monthly Expenses</Text>
        <Text style={styles.totalAmt}>Rs {totalExpense.toLocaleString()}</Text>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="gray" />
        <TextInput 
          placeholder="Search by category or description..." 
          style={styles.searchInput} 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color="gray" /></TouchableOpacity>}
      </View>

      <FlatList
        data={filteredExpenses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.row}
            onLongPress={() => handleDeleteExpense(item.id)}
          >
            <View style={styles.iconCircle}>
               <Text style={styles.catInitial}>{item.category?.[0] || 'E'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.catText}>{item.category || 'General'}</Text>
              <Text style={styles.descText}>{item.description || 'No notes'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.amtText}>Rs {item.amount.toLocaleString()}</Text>
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No matching expenses found.</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus color="white" size={24} />
        <Text style={styles.fabText}>ADD EXPENSE</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Expense Entry</Text>
            <TextInput 
              placeholder="Amount (Rs)" 
              style={styles.mInput} 
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus={true}
            />
            <TextInput 
              placeholder="Category (e.g. Rent, Electricity)" 
              style={styles.mInput} 
              value={category}
              onChangeText={setCategory}
            />
            <TextInput 
              placeholder="Description (Optional)" 
              style={styles.mInput} 
              value={desc}
              onChangeText={setDesc}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddExpense} style={styles.saveBtn}>
                <Text style={{color: 'white', fontWeight: 'bold'}}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  topSummary: { padding: 40, backgroundColor: 'white', alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 3 },
  totalLabel: { fontSize: 14, color: 'gray', marginTop: 10 },
  totalAmt: { fontSize: 32, fontWeight: 'bold', color: '#ec4899', marginTop: 5 },
  searchBar: { flexDirection: 'row', padding: 12, marginHorizontal: 20, marginVertical: 15, backgroundColor: 'white', borderRadius: 12, alignItems: 'center', elevation: 1 },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 14 },
  row: { flexDirection: 'row', padding: 20, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff', alignItems: 'center' },
  iconCircle: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#fce7f3', justifyContent: 'center', alignItems: 'center' },
  catInitial: { color: '#ec4899', fontWeight: 'bold', fontSize: 18 },
  catText: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  descText: { fontSize: 12, color: 'gray' },
  amtText: { fontSize: 16, fontWeight: 'bold', color: '#ef4444' },
  dateText: { fontSize: 10, color: 'gray' },
  empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' },
  fab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#ec4899', paddingHorizontal: 20, height: 52, borderRadius: 26, flexDirection: 'row', alignItems: 'center', elevation: 5 },
  fabText: { color: 'white', fontWeight: 'bold', marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#ec4899' },
  mInput: { borderBottomWidth: 1, borderColor: '#ddd', padding: 12, marginBottom: 15, fontSize: 16 },
  modalActions: { flexDirection: 'row', marginTop: 10 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center' },
  saveBtn: { flex: 1, backgroundColor: '#ec4899', padding: 15, borderRadius: 10, alignItems: 'center' }
});
