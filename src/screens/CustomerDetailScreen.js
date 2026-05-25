import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useFirestore, addDocToDb, db, auth } from '../config/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import { ChevronLeft, Phone, Share2, Trash2 } from 'lucide-react-native';

export default function CustomerDetailScreen({ route, navigation }) {
  const { customerId, customerName, customerPhone } = route.params;
  const [transactions, setTransactions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState('got');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const user = auth.currentUser || { uid: 'guest_user' };

  React.useEffect(() => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'users', user.uid, 'customer_transactions'),
        where('customerId', '==', customerId),
        orderBy('timestamp', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        console.error("Customer Transactions Sync Error:", error);
      });
      return unsubscribe;
    } catch (e) {
      console.error("Customer Detail Effect Error:", e);
    }
  }, [customerId, user?.uid]);

  const handleAddEntry = async () => {
    try {
      if (!amount || !user) return;
      const amt = parseFloat(amount);
      
      await addDocToDb('customer_transactions', {
        customerId,
        amount: amt,
        description: desc,
        type,
        date: new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
      });

      const balanceChange = type === 'gave' ? amt : -amt;
      const customerRef = doc(db, 'users', user.uid, 'customers', customerId);
      await updateDoc(customerRef, {
        balance: increment(balanceChange)
      });

      setAmount('');
      setDesc('');
      setModalVisible(false);
    } catch (e) {
      console.error("handleAddEntry Error:", e);
      Alert.alert('Error', 'Failed to add transaction entry.');
    }
  };

  const handleDeleteTransaction = (transaction) => {
    if (!user) return;
    Alert.alert("Delete Entry", "Are you sure? This will adjust the customer balance.", [
      { text: "Cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'customer_transactions', transaction.id));
          const balanceCorrection = transaction.type === 'gave' ? -transaction.amount : transaction.amount;
          const customerRef = doc(db, 'users', user.uid, 'customers', customerId);
          await updateDoc(customerRef, { balance: increment(balanceCorrection) });
        } catch (e) {
          console.error("handleDeleteTransaction Error:", e);
          Alert.alert('Error', 'Failed to delete transaction.');
        }
      }}
    ]);
  };

  const calculateTotal = () => {
    try {
      return transactions.reduce((acc, t) => acc + (t.type === 'gave' ? t.amount : -t.amount), 0);
    } catch (e) {
      console.error("calculateTotal Error:", e);
      return 0;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft color="white" /></TouchableOpacity>
          <Text style={styles.headerName}>{customerName}</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.hIcon}><Phone color="white" size={20} /></TouchableOpacity>
            <TouchableOpacity style={styles.hIcon}><Share2 color="white" size={20} /></TouchableOpacity>
          </View>
        </View>
        <View style={styles.balanceSummary}>
          <Text style={styles.balLabel}>Total Balance</Text>
          <Text style={styles.balAmount}>Rs {calculateTotal().toLocaleString()}</Text>
        </View>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.transRow} 
            onLongPress={() => handleDeleteTransaction(item)}
          >
            <View style={styles.dateCol}>
              <Text style={styles.dateText}>{item.date}</Text>
              <Text style={styles.subText}>{item.description || 'No notes'}</Text>
            </View>
            <View style={styles.amtCol}>
              {item.type === 'gave' ? (
                <View style={styles.gaveBox}><Text style={styles.gaveText}>{item.amount.toLocaleString()}</Text></View>
              ) : (
                <View style={styles.gotBox}><Text style={styles.gotText}>{item.amount.toLocaleString()}</Text></View>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.headerCol}>Entries</Text>
            <Text style={[styles.headerCol, { textAlign: 'right' }]}>Amount (Rs)</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No entries yet.</Text>}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]} 
          onPress={() => { setType('gave'); setModalVisible(true); }}
        >
          <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>GAVE Rs</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#dcfce7' }]}
          onPress={() => { setType('got'); setModalVisible(true); }}
        >
          <Text style={{ color: '#22c55e', fontWeight: 'bold' }}>GOT Rs</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: type === 'gave' ? '#ef4444' : '#22c55e' }]}>
              Entry: {type === 'gave' ? 'You Gave' : 'You Got'}
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
              placeholder="Description/Remark" 
              style={styles.mInput} 
              value={desc}
              onChangeText={setDesc}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity 
                onPress={handleAddEntry} 
                style={[styles.saveBtn, { backgroundColor: type === 'gave' ? '#ef4444' : '#22c55e' }]}
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
  container: { flex: 1, backgroundColor: 'white' },
  topHeader: { backgroundColor: '#7e22ce', padding: 20, paddingTop: 50 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerName: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  headerIcons: { flexDirection: 'row' },
  hIcon: { marginLeft: 15 },
  balanceSummary: { marginTop: 20, alignItems: 'center' },
  balLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  balAmount: { color: 'white', fontSize: 30, fontWeight: 'bold', marginTop: 5 },
  listHeader: { flexDirection: 'row', padding: 15, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderColor: '#eee' },
  headerCol: { flex: 1, fontSize: 12, color: '#64748b', fontWeight: 'bold' },
  transRow: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderColor: '#f1f5f9', alignItems: 'center' },
  dateCol: { flex: 1.5 },
  dateText: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  subText: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  amtCol: { flex: 1, alignItems: 'flex-end' },
  gaveBox: { backgroundColor: '#fee2e2', padding: 8, borderRadius: 5, width: 90, alignItems: 'center' },
  gaveText: { color: '#ef4444', fontWeight: 'bold' },
  gotBox: { backgroundColor: '#dcfce7', padding: 8, borderRadius: 5, width: 90, alignItems: 'center' },
  gotText: { color: '#22c55e', fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' },
  bottomActions: { position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', padding: 15, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#eee' },
  actionBtn: { flex: 1, height: 50, marginHorizontal: 5, borderRadius: 10, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  mInput: { borderBottomWidth: 1, borderColor: '#ddd', padding: 12, marginBottom: 15, fontSize: 16 },
  modalActions: { flexDirection: 'row', marginTop: 10 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center' },
  saveBtn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center' }
});
