import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { db, auth } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Store, Phone, MapPin, Mail, Save, ChevronLeft } from 'lucide-react-native';

export default function BusinessProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const user = auth.currentUser;

  const [profile, setProfile] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    category: ''
  });

  useEffect(() => {
    if (user) fetchProfile();
  }, [user?.uid]);

  const fetchProfile = async () => {
    try {
      const docRef = doc(db, 'users', user.uid, 'settings', 'business_profile');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile.businessName) {
      Alert.alert("Error", "Business name is required.");
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'business_profile'), {
        ...profile,
        updatedAt: new Date()
      });
      Alert.alert("Success", "Business profile updated!");
    } catch (e) {
      Alert.alert("Error", "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7e22ce" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Business Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Business Name *</Text>
          <View style={styles.inputWrapper}>
            <Store size={20} color="#94a3b8" />
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Al-Madina Traders" 
              value={profile.businessName}
              onChangeText={(t) => setProfile({...profile, businessName: t})}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Owner Name</Text>
          <View style={styles.inputWrapper}>
            <TextInput 
              style={[styles.input, { marginLeft: 0 }]} 
              placeholder="Full Name" 
              value={profile.ownerName}
              onChangeText={(t) => setProfile({...profile, ownerName: t})}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputWrapper}>
            <Phone size={20} color="#94a3b8" />
            <TextInput 
              style={styles.input} 
              placeholder="+92 3xx xxxxxxx" 
              keyboardType="phone-pad"
              value={profile.phone}
              onChangeText={(t) => setProfile({...profile, phone: t})}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <Mail size={20} color="#94a3b8" />
            <TextInput 
              style={styles.input} 
              placeholder="info@business.com" 
              keyboardType="email-address"
              value={profile.email}
              onChangeText={(t) => setProfile({...profile, email: t})}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Shop Address</Text>
          <View style={styles.inputWrapper}>
            <MapPin size={20} color="#94a3b8" />
            <TextInput 
              style={[styles.input, { height: 60 }]} 
              placeholder="Street, City, Area" 
              multiline
              value={profile.address}
              onChangeText={(t) => setProfile({...profile, address: t})}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, saving && styles.disabledBtn]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="white" /> : (
            <>
              <Save color="white" size={20} />
              <Text style={styles.saveText}>Save Business Info</Text>
            </>
          )}
        </TouchableOpacity>
        
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#7e22ce', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  form: { flex: 1, padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#64748b', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  input: { flex: 1, paddingVertical: 12, marginLeft: 10, fontSize: 15, color: '#1e293b' },
  saveBtn: { backgroundColor: '#7e22ce', padding: 18, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, elevation: 3 },
  disabledBtn: { opacity: 0.7 },
  saveText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 10 }
});
