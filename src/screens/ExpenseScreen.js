import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, Image, ActivityIndicator } from 'react-native';
import { useFirestore, addDocToDb, db, auth } from '../config/firebase';
import { uploadImage } from '../config/storage';
import { doc, deleteDoc } from 'firebase/firestore';
import { TrendingDown, Plus, Search, X, Camera, ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

export default function ExpenseScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const expenses = useFirestore('expenses');
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Preview State
  const [previewImage, setPreviewImage] = useState(null);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => 
      e.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [expenses, searchQuery]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.5,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleAddExpense = async () => {
    if (!amount) { Alert.alert("Input Error", "Please enter an amount."); return; }
    setUploading(true);
    try {
      let imageUrl = null;
      if (image) {
        const path = `users/${auth.currentUser.uid}/receipts/${Date.now()}.jpg`;
        imageUrl = await uploadImage(image, path);
      }
      await addDocToDb('expenses', {
        amount: parseFloat(amount),
        category: category || 'General',
        description: desc,
        imageUrl,
        date: new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }),
        timestamp: new Date()
      });
      setAmount(''); setCategory(''); setDesc(''); setImage(null);
      setModalVisible(false);
    } catch (e) { Alert.alert("Error", "Failed to save."); }
    finally { setUploading(false); }
  };

  const handleDeleteExpense = (id) => {
    Alert.alert("Delete Expense", "Remove this record?", [
      { text: "Cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'expenses', id));
      }}
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topSummary, { backgroundColor: colors.card }]}>
        <TrendingDown color="#ec4899" size={40} />
        <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total Expenses</Text>
        <Text style={[styles.totalAmt, { color: '#ec4899' }]}>Rs {expenses.reduce((acc, e) => acc + e.amount, 0).toLocaleString()}</Text>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
        <Search size={18} color={colors.textSecondary} />
        <TextInput 
          placeholder="Search..." placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.text }]} 
          value={searchQuery} onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredExpenses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.row, { borderBottomColor: colors.border, backgroundColor: colors.card }]}
            onLongPress={() => handleDeleteExpense(item.id)}
            onPress={() => item.imageUrl && setPreviewImage(item.imageUrl)}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#fce7f3' }]}>
               <Text style={styles.catInitial}>{item.category?.[0] || 'E'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={[styles.catText, { color: colors.text }]}>{item.category}</Text>
              <Text style={[styles.descText, { color: colors.textSecondary }]}>{item.description}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.amtText}>Rs {item.amount.toLocaleString()}</Text>
              {item.imageUrl && <ImageIcon size={14} color="#ec4899" style={{ marginTop: 4 }} />}
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity style={[styles.fab, { backgroundColor: '#ec4899' }]} onPress={() => setModalVisible(true)}>
        <Plus color="white" size={24} />
        <Text style={styles.fabText}>ADD EXPENSE</Text>
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: '#ec4899' }]}>New Expense</Text>
            <TextInput placeholder="Amount" style={[styles.mInput, { color: colors.text, borderColor: colors.border }]} keyboardType="numeric" value={amount} onChangeText={setAmount} />
            <TextInput placeholder="Category" style={[styles.mInput, { color: colors.text, borderColor: colors.border }]} value={category} onChangeText={setCategory} />
            
            <View style={styles.imageRow}>
              <TouchableOpacity style={styles.imgBtn} onPress={pickImage}><ImageIcon size={20} color={colors.primary} /><Text style={{color: colors.primary, marginLeft: 5}}>Gallery</Text></TouchableOpacity>
              <TouchableOpacity style={styles.imgBtn} onPress={takePhoto}><Camera size={20} color={colors.primary} /><Text style={{color: colors.primary, marginLeft: 5}}>Camera</Text></TouchableOpacity>
            </View>
            {image && <Image source={{ uri: image }} style={styles.preview} />}

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}><Text style={{ color: colors.textSecondary }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleAddExpense} style={[styles.saveBtn, { backgroundColor: '#ec4899' }]} disabled={uploading}>
                {uploading ? <ActivityIndicator color="white" /> : <Text style={{color: 'white', fontWeight: 'bold'}}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Preview Modal */}
      <Modal visible={!!previewImage} transparent={true}>
         <View style={styles.previewOverlay}>
            <TouchableOpacity style={styles.closePreview} onPress={() => setPreviewImage(null)}><X size={30} color="white" /></TouchableOpacity>
            <Image source={{ uri: previewImage }} style={styles.fullImage} resizeMode="contain" />
         </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topSummary: { padding: 40, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 3 },
  totalLabel: { fontSize: 14, marginTop: 10 },
  totalAmt: { fontSize: 32, fontWeight: 'bold', marginTop: 5 },
  searchBar: { flexDirection: 'row', padding: 12, marginHorizontal: 20, marginVertical: 15, borderRadius: 12, alignItems: 'center', elevation: 1 },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 14 },
  row: { flexDirection: 'row', padding: 20, borderBottomWidth: 1, alignItems: 'center' },
  iconCircle: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  catInitial: { color: '#ec4899', fontWeight: 'bold', fontSize: 18 },
  catText: { fontSize: 16, fontWeight: 'bold' },
  descText: { fontSize: 12 },
  amtText: { fontSize: 16, fontWeight: 'bold', color: '#ef4444' },
  fab: { position: 'absolute', bottom: 30, right: 20, paddingHorizontal: 20, height: 52, borderRadius: 26, flexDirection: 'row', alignItems: 'center', elevation: 5 },
  fabText: { color: 'white', fontWeight: 'bold', marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  mInput: { borderBottomWidth: 1, padding: 12, marginBottom: 15, fontSize: 16 },
  imageRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
  imgBtn: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, backgroundColor: '#f5f3ff' },
  preview: { width: '100%', height: 100, borderRadius: 10, marginBottom: 15 },
  modalActions: { flexDirection: 'row', marginTop: 10 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center' },
  saveBtn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  previewOverlay: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  closePreview: { position: 'absolute', top: 50, right: 20, zIndex: 1 },
  fullImage: { width: '100%', height: '80%' }
});
