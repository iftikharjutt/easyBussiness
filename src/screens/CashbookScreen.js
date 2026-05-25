import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useFirestore, addDocToDb, db } from '../config/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { Search, X } from 'lucide-react-native';

export default function CashbookScreen() {
  const transactions = useFirestore('transactions');
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState('in'); // 'in' or 'out'
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Search/Filter Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.date.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transactions, searchQuery]);

  const handleAddTransaction = async () => {
    try {
      if (!amount) return;
      await addDocToDb('transactions', {
        type,
        amount: parseFloat(amount),
        description: desc,
        date: new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }),
        timestamp: new Date()
      });
      setAmount('');
      setDesc('');
      setModalVisible(false);
    } catch (e) {
      console.error("Error in handleAddTransaction:", e);
      Alert.alert("Error", "Failed to add transaction. " + e.message);
    }
  };

  const handleDeleteEntry = (id) => {
    Alert.alert("Delete Entry", "Are you sure you want to remove this transaction?", [
      { text: "Cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
        try {
          await deleteDoc(doc(db, 'transactions', id));
        } catch (e) {
          console.error("Error in handleDeleteEntry:", e);
          Alert.alert("Error", "Failed to delete transaction. " + e.message);
        }
      }}
    ]);
  };

  const calculateBalances = () => {
    let totalIn = 0;
    let totalOut = 0;
    transactions.forEach(t => {
      if (t.type === 'in') totalIn += t.amount;
      else totalOut += t.amount;
    });
    return { 
      cashInHand: totalIn - totalOut,
      todayBalance: totalIn - totalOut 
    };
  };

  const { cashInHand, todayBalance } = calculateBalances();

  return (
    <View style={styles.container}>
      <View style={styles.summaryContainer}>
        <View style={styles.sumBox}>
           <Text style={styles.sumLabel}>Total Cash In Hand</Text>
           <Text style={styles.totalAmt}>Rs {cashInHand.toLocaleString()}</Text>
        </View>
        <View style={styles.todayBox}>
           <Text style={styles.todayLabel}>Today's Balance</Text>
           <Text style={[styles.todayAmt, { color: todayBalance >= 0 ? '#22c55e' : '#ef4444' }]}>
             Rs {todayBalance >= 0 ? '+' : ''}{todayBalance.toLocaleString()}
           </Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="gray" />
        <TextInput 
          placeholder="Search by date or description..." 
          style={styles.searchInput} 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color="gray" /></TouchableOpacity>}
      </View>
      
      <FlatList
        data={filteredTransactions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.row}
            onLongPress={() => handleDeleteEntry(item.id)}
          >
            <View>
              <Text style={styles.dateText}>{item.date}</Text>
              <Text style={styles.descText}>{item.description || 'No description'}</Text>
            </View>
            <View style={styles.amtCol}>
              {item.type === 'out' ? (
                <Text style={styles.outAmt}>-{item.amount.toLocaleString()}</Text>
              ) : (
                <Text style={styles.inAmt}>+{item.amount.toLocaleString()}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No matching entries found.</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <View style={styles.bottomButtons}>
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: '#ef4444' }]}
          onPress={() => { setType('out'); setModalVisible(true); }}
        >
           <Text style={styles.btnText}>CASH OUT</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: '#22c55e' }]}
          onPress={() => { setType('in'); setModalVisible(true); }}
        >
           <Text style={styles.btnText}>CASH IN</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: type === 'in' ? '#22c55e' : '#ef4444' }]}>
              New {type === 'in' ? 'Cash In' : 'Cash Out'}
            </Text>
            <TextInput 
              placeholder="Amount (Rs)" 
              style={styles.mInput} 
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus={true}
            />
            <TextInput 
              placeholder="Description" 
              style={styles.mInput} 
              value={desc}
              onChangeText={setDesc}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleAddTransaction} 
                style={[styles.saveBtn, { backgroundColor: type === 'in' ? '#22c55e' : '#ef4444' }]}
              >
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
  summaryContainer: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', justifyContent: 'space-between' },
  sumBox: { flex: 1 },
  sumLabel: { fontSize: 12, color: 'gray' },
  totalAmt: { fontSize: 24, fontWeight: 'bold', color: '#7e22ce' },
  todayBox: { alignItems: 'flex-end' },
  todayLabel: { fontSize: 12, color: 'gray' },
  todayAmt: { fontSize: 18, fontWeight: '600' },
  searchBar: { flexDirection: 'row', padding: 12, marginHorizontal: 20, marginVertical: 10, backgroundColor: 'white', borderRadius: 10, alignItems: 'center', elevation: 1 },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
  dateText: { fontSize: 10, color: 'gray' },
  descText: { fontSize: 16, fontWeight: '500', color: '#1e293b' },
  amtCol: { alignItems: 'flex-end', justifyContent: 'center' },
  outAmt: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },
  inAmt: { color: '#22c55e', fontWeight: 'bold', fontSize: 16 },
  empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' },
  bottomButtons: { flexDirection: 'row', padding: 15, position: 'absolute', bottom: 0, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#eee' },
  btn: { flex: 1, height: 50, marginHorizontal: 5, borderRadius: 10, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  mInput: { borderBottomWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 15 },
  modalActions: { flexDirection: 'row', marginTop: 10 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center' },
  saveBtn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center' }
});
