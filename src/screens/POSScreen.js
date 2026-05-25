import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useFirestore, addDocToDb, db, auth } from '../config/firebase';
import { doc, updateDoc, increment, collection, query, where, getDocs } from 'firebase/firestore';
import { ShoppingCart, Search, Plus, Minus, X, CheckCircle2, User, CreditCard, Banknote, Filter } from 'lucide-react-native';

export default function POSScreen({ navigation }) {
  const stockItems = useFirestore('stock');
  const customers = useFirestore('customers');
  
  const [cart, setCart] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentType, setPaymentType] = useState('cash');
  const [custSearch, setCustSearch] = useState('');

  const categories = useMemo(() => {
    const cats = ['All', ...new Set(stockItems.map(item => item.category || 'General'))];
    return cats;
  }, [stockItems]);

  const filteredStock = useMemo(() => {
    return stockItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || (item.category || 'General') === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [stockItems, searchQuery, selectedCategory]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
      c.phone?.includes(custSearch)
    );
  }, [customers, custSearch]);

  const addToCart = (item) => {
    if (item.quantity <= 0) {
      Alert.alert("Out of Stock", "This item is currently not available.");
      return;
    }
    setCart(prev => {
      const existing = prev[item.id];
      if (existing) {
        if (existing.cartQty >= item.quantity) {
          Alert.alert("Limit Reached", "Available stock is " + item.quantity);
          return prev;
        }
        return { ...prev, [item.id]: { ...existing, cartQty: existing.cartQty + 1 } };
      }
      return { ...prev, [item.id]: { ...item, cartQty: 1 } };
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId].cartQty > 1) newCart[itemId].cartQty -= 1;
      else delete newCart[itemId];
      return newCart;
    });
  };

  const calculateTotal = () => {
    return Object.values(cart).reduce((acc, item) => acc + (item.salePrice * item.cartQty), 0);
  };

  const handleCheckout = async () => {
    const total = calculateTotal();
    if (total <= 0) return;

    try {
      const billData = {
        customerName: selectedCustomer ? selectedCustomer.name : "Walk-in Customer",
        customerId: selectedCustomer ? selectedCustomer.id : null,
        itemsSummary: Object.values(cart).map(i => `${i.cartQty}x ${i.name}`).join(', '),
        total: total,
        billNo: `POS-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: paymentType === 'cash' ? 'paid' : 'unpaid',
        type: paymentType,
        timestamp: new Date()
      };

      const billId = await addDocToDb('bills', billData);

      for (const item of Object.values(cart)) {
        const stockRef = doc(db, 'users', auth.currentUser.uid, 'stock', item.id);
        await updateDoc(stockRef, { quantity: increment(-item.cartQty) });
        
        await addDocToDb('stock_history', {
          productId: item.id,
          productName: item.name,
          type: 'out',
          quantity: item.cartQty,
          date: billData.date,
          timestamp: new Date()
        });
      }

      if (paymentType === 'credit' && selectedCustomer) {
        const customerRef = doc(db, 'users', auth.currentUser.uid, 'customers', selectedCustomer.id);
        await updateDoc(customerRef, { balance: increment(total) });
        await addDocToDb('customer_transactions', {
          customerId: selectedCustomer.id,
          amount: total,
          description: `POS Bill ${billData.billNo}`,
          type: 'gave',
          date: billData.date,
          timestamp: new Date()
        });
      }

      navigation.replace('BillDetail', { bill: { ...billData, id: billId } });
    } catch (e) {
      console.error("Checkout Error:", e);
      Alert.alert("Checkout Failed", "Failed to process sale. Error: " + e.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.posHeader}>
         <TouchableOpacity style={styles.customerSelector} onPress={() => setCustomerModalVisible(true)}>
           <User size={18} color="#7e22ce" />
           <Text style={styles.selectedCustText}>{selectedCustomer ? selectedCustomer.name : 'Walk-in'}</Text>
           <Plus size={14} color="#94a3b8" />
         </TouchableOpacity>

         <View style={styles.typeSelector}>
           <TouchableOpacity 
             style={[styles.typeBtn, paymentType === 'cash' && styles.typeActive]}
             onPress={() => setPaymentType('cash')}
           >
             <Banknote size={16} color={paymentType === 'cash' ? 'white' : '#64748b'} />
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.typeBtn, paymentType === 'credit' && styles.typeActiveCredit]}
             onPress={() => setPaymentType('credit')}
           >
             <CreditCard size={16} color={paymentType === 'credit' ? 'white' : '#64748b'} />
           </TouchableOpacity>
         </View>
      </View>

      <View style={styles.categoryRow}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.catChip, selectedCategory === item && styles.catChipActive]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[styles.catChipText, selectedCategory === item && styles.catChipActiveText]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.stockSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="gray" />
          <TextInput 
            placeholder="Search products..." 
            style={styles.searchInput} 
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredStock}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.productItem, item.quantity <= 0 && styles.outOfStock]} 
              onPress={() => addToCart(item)}
            >
              <View style={styles.pInfo}>
                <Text style={styles.pName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.pCat}>{item.category || 'General'}</Text>
              </View>
              <View style={styles.pPriceRow}>
                <Text style={styles.pPrice}>Rs {item.salePrice}</Text>
                <Text style={[styles.pStock, item.quantity < 5 && {color: '#ef4444'}]}>Qty: {item.quantity}</Text>
              </View>
              <View style={styles.addIcon}><Plus size={14} color="white" /></View>
            </TouchableOpacity>
          )}
          numColumns={2}
          contentContainerStyle={{ padding: 8 }}
          ListEmptyComponent={<Text style={styles.empty}>No products in this category.</Text>}
        />
      </View>

      <View style={styles.cartContainer}>
        <View style={styles.cartHeader}>
          <Text style={styles.cartTitle}>Cart ({Object.keys(cart).length})</Text>
          <TouchableOpacity onPress={() => setCart({})}><Text style={styles.clearBtn}>Clear</Text></TouchableOpacity>
        </View>

        <View style={styles.cartList}>
          {Object.values(cart).length === 0 ? (
            <Text style={styles.emptyCart}>Cart is empty.</Text>
          ) : (
            <FlatList
              horizontal
              data={Object.values(cart)}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.cartItem}>
                  <Text style={styles.cartPName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.qtyBtn}><Minus size={12} color="#7e22ce" /></TouchableOpacity>
                    <Text style={styles.qtyVal}>{item.cartQty}</Text>
                    <TouchableOpacity onPress={() => addToCart(item)} style={styles.qtyBtn}><Plus size={12} color="#7e22ce" /></TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.totalAmt}>Rs {calculateTotal().toLocaleString()}</Text>
            <Text style={styles.totalLabel}>Total Payable</Text>
          </View>
          <TouchableOpacity 
            style={[styles.checkoutBtn, calculateTotal() === 0 && styles.disabledBtn]} 
            onPress={handleCheckout}
            disabled={calculateTotal() === 0}
          >
            <Text style={styles.checkoutText}>CONFIRM</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={customerModalVisible} animationType="slide">
        <View style={styles.modalFull}>
           <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Customer</Text>
              <TouchableOpacity onPress={() => setCustomerModalVisible(false)}><X color="#1e293b" /></TouchableOpacity>
           </View>
           <View style={styles.custSearchBox}>
              <Search size={18} color="gray" /><TextInput placeholder="Search..." style={styles.searchInput} value={custSearch} onChangeText={setCustSearch} />
           </View>
           <FlatList
             data={filteredCustomers}
             keyExtractor={item => item.id}
             renderItem={({ item }) => (
               <TouchableOpacity style={styles.custRow} onPress={() => { setSelectedCustomer(item); setCustomerModalVisible(false); }}>
                 <View style={styles.custIcon}><User color="#7c3aed" size={20} /></View>
                 <View><Text style={styles.custName}>{item.name}</Text><Text style={styles.custPhone}>{item.phone || 'No phone'}</Text></View>
               </TouchableOpacity>
             )}
             ListHeaderComponent={<TouchableOpacity style={styles.custRow} onPress={() => { setSelectedCustomer(null); setCustomerModalVisible(false); }}><View style={[styles.custIcon, {backgroundColor: '#f1f5f9'}]}><User color="#64748b" size={20} /></View><Text style={styles.custName}>Walk-in Customer</Text></TouchableOpacity>}
           />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  posHeader: { flexDirection: 'row', padding: 12, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#f1f5f9', alignItems: 'center' },
  customerSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f3ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flex: 1, marginRight: 10 },
  selectedCustText: { marginLeft: 10, fontWeight: 'bold', color: '#7e22ce', fontSize: 13, flex: 1 },
  typeSelector: { flexDirection: 'row', gap: 5 },
  typeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  typeActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  typeActiveCredit: { backgroundColor: '#7e22ce', borderColor: '#7e22ce' },
  categoryRow: { paddingVertical: 10, paddingHorizontal: 15, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  catChip: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 15, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  catChipActive: { backgroundColor: '#7e22ce', borderColor: '#7e22ce' },
  catChipText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  catChipActiveText: { color: 'white' },
  stockSection: { flex: 1, backgroundColor: '#f8fafc' },
  searchBar: { flexDirection: 'row', padding: 10, margin: 12, backgroundColor: 'white', borderRadius: 10, alignItems: 'center', elevation: 1 },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 14 },
  productItem: { flex: 1, backgroundColor: 'white', margin: 5, padding: 12, borderRadius: 15, elevation: 1 },
  outOfStock: { opacity: 0.5 },
  pInfo: { marginBottom: 5 },
  pName: { fontSize: 12, fontWeight: 'bold', color: '#1e293b' },
  pCat: { fontSize: 9, color: '#94a3b8' },
  pPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  pPrice: { fontSize: 13, fontWeight: 'bold', color: '#7e22ce' },
  pStock: { fontSize: 9, color: '#94a3b8' },
  addIcon: { position: 'absolute', top: 12, right: 12, backgroundColor: '#7e22ce', borderRadius: 8, padding: 2 },
  empty: { textAlign: 'center', marginTop: 30, color: '#94a3b8', fontSize: 12 },
  cartContainer: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 15, elevation: 20 },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cartTitle: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  clearBtn: { color: '#ef4444', fontSize: 11, fontWeight: 'bold' },
  cartList: { height: 50, marginBottom: 10 },
  emptyCart: { color: '#94a3b8', fontSize: 11, textAlign: 'center', marginTop: 15 },
  cartItem: { width: 100, backgroundColor: '#f1f5f9', borderRadius: 10, padding: 6, marginRight: 8, justifyContent: 'center' },
  cartPName: { fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyBtn: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  qtyVal: { fontSize: 11, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#f1f5f9', paddingTop: 10 },
  totalLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
  totalAmt: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  checkoutBtn: { backgroundColor: '#7e22ce', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12 },
  disabledBtn: { backgroundColor: '#cbd5e1' },
  checkoutText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  modalFull: { flex: 1, backgroundColor: 'white', padding: 20, paddingTop: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  custSearchBox: { flexDirection: 'row', padding: 12, backgroundColor: '#f1f5f9', borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  custRow: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderColor: '#f1f5f9', alignItems: 'center' },
  custIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  custName: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  custPhone: { fontSize: 12, color: '#64748b', marginTop: 2 }
});
