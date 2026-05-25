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
  const user = auth.currentUser;

  React.useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'users', user.uid, 'customer_transactions'),
      where('customerId', '==', customerId),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
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
      console.error(e, 'handleAddEntry');
      Alert.alert('Error', 'An error occurred while adding entry: ' + e.message);
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
          console.error(e, 'handleDeleteTransaction');
          Alert.alert('Error', 'An error occurred while deleting transaction: ' + e.message);
        }
      }}
    ]);
  };
...
  const calculateTotal = () => {
    return transactions.reduce((acc, t) => acc + (t.type === 'gave' ? t.amount : -t.amount), 0);
  };

  return (
    <View style={styles.container}>
...
  );
}

const styles = StyleSheet.create({
...
});
