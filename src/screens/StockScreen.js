import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { Plus, Package, Search, ArrowUpCircle, ArrowDownCircle, X, History } from 'lucide-react-native';
import { useFirestore, addDocToDb, db } from '../config/firebase';
import { doc, updateDoc, increment, deleteDoc } from 'firebase/firestore';

export default function StockScreen({ navigation }) {
  const stockItems = useFirestore('stock');
  const [modalVisible, setModalVisible] = useState(false);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustType, setAdjustType] = useState('in'); // 'in' or 'out'
  const [adjustQty, setAdjustQty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Search Logic
  const filteredStock = useMemo(() => {
    return stockItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stockItems, searchQuery]);

  const handleAddItem = async () => {
    try {
      if (!name || !salePrice) return;
      await addDocToDb('stock', {
        name,
        category,
        unit,
        purchasePrice: parseFloat(purchasePrice) || 0,
        salePrice: parseFloat(salePrice) || 0,
        quantity: 0
      });
      setName(''); setCategory(''); setUnit(''); setPurchasePrice(''); setSalePrice('');
      setModalVisible(false);
    } catch (e) {
      console.error("Error in handleAddItem:", e);
      Alert.alert("Error", "Failed to add item. " + e.message);
    }
  };

  const handleAdjustStock = async () => {
    if (!adjustQty || !selectedItem) return;
    const qty = parseInt(adjustQty);
    const finalQty = adjustType === 'in' ? qty : -qty;

    try {
      const stockRef = doc(db, 'stock', selectedItem.id);
      
      // 1. Update Current Stock
      await updateDoc(stockRef, {
        quantity: increment(finalQty)
      });

      // 2. Record in Stock History
      await addDocToDb('stock_history', {
        productId: selectedItem.id,
        productName: selectedItem.name,
        type: adjustType,
        quantity: qty,
        date: new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }),
        timestamp: new Date()
      });

      setAdjustQty('');
      setSelectedItem(null);
      setAdjustModalVisible(false);
    } catch (e) {
      console.error("Error in handleAdjustStock:", e);
      Alert.alert("Error", "Failed to update stock. " + e.message);
    }
  };

  const handleDeleteItem = (id) => {
    Alert.alert("Delete Item", "Are you sure? This will remove the item permanently.", [
      { text: "Cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
        try {
          await deleteDoc(doc(db, 'stock', id));
        } catch (e) {
          console.error("Error in handleDeleteItem:", e);
          Alert.alert("Error", "Failed to delete item. " + e.message);
        }
      }}
    ]);
  };

  const calculateStockValue = () => {
    return stockItems.reduce((acc, item) => acc + (item.quantity * item.salePrice), 0);
  };

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.statBox}>
           <Text style={styles.statLabel}>Total Items</Text>
           <Text style={styles.statVal}>{stockItems.length}</Text>
        </View>
        <View style={[styles.statBox, { borderLeftWidth: 1, borderColor: '#eee' }]}>
           <Text style={styles.statLabel}>Stock Value</Text>
           <Text style={styles.statVal}>Rs {calculateStockValue().toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.toggleRow}>
        <TouchableOpacity 
          style={styles.historyBtn} 
          onPress={() => navigation.navigate('StockHistory')}
        >
          <History size={18} color="#3b82f6" />
          <Text style={styles.historyText}>View Stock IN/OUT Reports</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="gray" />
        <TextInput 
          placeholder="Search items..." 
          style={styles.searchInput} 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color="gray" /></TouchableOpacity>}
      </View>

      <FlatList
        data={filteredStock}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.itemRow} 
            onLongPress={() => handleDeleteItem(item.id)}
            onPress={() => { setSelectedItem(item); setAdjustModalVisible(true); }}
          >
            <View style={styles.iconCircle}>
               <Package color="#3b82f6" size={20} />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
               <Text style={styles.itemName}>{item.name}</Text>
               <Text style={styles.itemCat}>{item.category || 'No Category'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
               <Text style={[styles.itemQty, { color: item.quantity < 5 ? '#ef4444' : '#3b82f6' }]}>
                 {item.quantity} {item.unit || 'pcs'}
               </Text>
               <Text style={styles.itemPrice}>Sale: Rs {item.salePrice}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No items found.</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus color="white" size={24} />
        <Text style={styles.fabText}>ADD ITEM</Text>
      </TouchableOpacity>

      {/* Modal: Add Product */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Product</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                <TextInput placeholder="Item Name *" style={styles.mInput} value={name} onChangeText={setName} />
                <TextInput placeholder="Category" style={styles.mInput} value={category} onChangeText={setCategory} />
                <View style={styles.rowInputs}>
                   <TextInput placeholder="Unit" style={[styles.mInput, {flex: 1, marginRight: 10}]} value={unit} onChangeText={setUnit} />
                   <TextInput placeholder="Cost Price" style={[styles.mInput, {flex: 1}]} keyboardType="numeric" value={purchasePrice} onChangeText={setPurchasePrice} />
                </View>
                <TextInput placeholder="Sale Price *" style={styles.mInput} keyboardType="numeric" value={salePrice} onChangeText={setSalePrice} />
                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}><Text>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleAddItem}><Text style={{color: 'white', fontWeight: 'bold'}}>Save</Text></TouchableOpacity>
                </View>
              </ScrollView>
           </View>
        </View>
      </Modal>

      {/* Modal: Adjust Stock */}
      <Modal visible={adjustModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
           <View style={styles.adjustContent}>
              <Text style={styles.adjustTitle}>Update Stock: {selectedItem?.name}</Text>
              <View style={styles.adjustTypeRow}>
                <TouchableOpacity 
                  style={[styles.typeBtn, adjustType === 'in' && styles.inActive]} 
                  onPress={() => setAdjustType('in')}
                >
                  <ArrowUpCircle color={adjustType === 'in' ? 'white' : '#22c55e'} size={20} />
                  <Text style={[styles.typeText, adjustType === 'in' && {color: 'white'}]}>Stock IN</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeBtn, adjustType === 'out' && styles.outActive]} 
                  onPress={() => setAdjustType('out')}
                >
                  <ArrowDownCircle color={adjustType === 'out' ? 'white' : '#ef4444'} size={20} />
                  <Text style={[styles.typeText, adjustType === 'out' && {color: 'white'}]}>Stock OUT</Text>
                </TouchableOpacity>
              </View>
              <TextInput 
                placeholder="Quantity" 
                style={styles.mInput} 
                keyboardType="numeric" 
                value={adjustQty}
                onChangeText={setAdjustQty}
                autoFocus={true}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setAdjustModalVisible(false)} style={styles.cancelBtn}><Text>Cancel</Text></TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveBtn, {backgroundColor: adjustType === 'in' ? '#22c55e' : '#ef4444'}]} 
                  onPress={handleAdjustStock}
                >
                  <Text style={{color: 'white', fontWeight: 'bold'}}>Confirm</Text>
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
  topBar: { flexDirection: 'row', padding: 20, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderColor: '#eee' },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 12, color: 'gray' },
  statVal: { fontSize: 20, fontWeight: 'bold', color: '#3b82f6' },
  toggleRow: { padding: 15, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  historyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', padding: 12, borderRadius: 12 },
  historyText: { marginLeft: 10, color: '#3b82f6', fontWeight: 'bold', fontSize: 13 },
  searchBar: { flexDirection: 'row', padding: 12, marginHorizontal: 20, marginVertical: 10, backgroundColor: '#f1f5f9', borderRadius: 10, alignItems: 'center' },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 14 },
  itemRow: { flexDirection: 'row', padding: 18, borderBottomWidth: 1, borderColor: '#f1f5f9', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  itemCat: { fontSize: 12, color: '#64748b' },
  itemQty: { fontSize: 16, fontWeight: 'bold' },
  itemPrice: { fontSize: 12, color: '#64748b' },
  empty: { textAlign: 'center', marginTop: 40, color: '#94a3b8' },
  fab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#3b82f6', paddingHorizontal: 20, height: 52, borderRadius: 26, flexDirection: 'row', alignItems: 'center', elevation: 5 },
  fabText: { color: 'white', fontWeight: 'bold', marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  mInput: { borderBottomWidth: 1, borderColor: '#d1d5db', paddingVertical: 12, marginBottom: 15, fontSize: 16 },
  rowInputs: { flexDirection: 'row' },
  modalActions: { flexDirection: 'row', marginTop: 20 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center' },
  saveBtn: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', backgroundColor: '#3b82f6' },
  adjustContent: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 25 },
  adjustTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  adjustTypeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee', marginHorizontal: 5 },
  typeText: { marginLeft: 8, fontWeight: '600', fontSize: 12 },
  inActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  outActive: { backgroundColor: '#ef4444', borderColor: '#ef4444' }
});
