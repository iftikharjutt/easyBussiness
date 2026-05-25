import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { db, auth } from '../config/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { ChevronLeft, CloudSync, ShieldCheck, RefreshCcw, CheckCircle2, History } from 'lucide-react-native';

export default function BackupScreen({ navigation }) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('Never');
  const user = auth.currentUser || { uid: 'guest_user' };

  useEffect(() => {
    if (user) fetchSyncInfo();
  }, [user?.uid]);

  const fetchSyncInfo = async () => {
    try {
      const docRef = doc(db, 'users', user.uid, 'settings', 'sync_info');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const date = docSnap.data().lastSync.toDate();
        setLastSync(date.toLocaleString());
      }
    } catch (e) {
      console.error("Fetch Sync Info Error:", e);
    }
  };

  const handleManualSync = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const collections = ['customers', 'transactions', 'stock', 'bills', 'expenses', 'staff'];
      let totalRecords = 0;
      
      for (const col of collections) {
        const snap = await getDocs(collection(db, 'users', user.uid, col));
        totalRecords += snap.size;
      }

      await setDoc(doc(db, 'users', user.uid, 'settings', 'sync_info'), {
        lastSync: new Date(),
        totalRecords: totalRecords
      });

      setLastSync(new Date().toLocaleString());
      Alert.alert("Sync Successful", `All ${totalRecords} records are securely backed up to the cloud.`);
    } catch (e) {
      console.error("Manual Sync Error:", e);
      Alert.alert("Sync Failed", "Please check your internet connection and try again.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Cloud Backup</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.heroSection}>
        <View style={styles.iconCircle}>
          <CloudSync size={50} color="#7e22ce" />
        </View>
        <Text style={styles.heroTitle}>Your data is safe!</Text>
        <Text style={styles.heroSub}>easyBussiness automatically syncs your data to our secure servers.</Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Backup</Text>
          <Text style={styles.infoVal}>{lastSync}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Backup Method</Text>
          <Text style={styles.infoVal}>Automatic Cloud Sync</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Data Safety</Text>
          <Text style={[styles.infoVal, { color: '#22c55e' }]}>Encrypted</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.syncBtn, syncing && styles.disabledBtn]} 
        onPress={handleManualSync}
        disabled={syncing}
      >
        {syncing ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <RefreshCcw color="white" size={20} />
            <Text style={styles.syncText}>Sync Now</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <ShieldCheck size={20} color="#7e22ce" />
          <View style={styles.featureText}>
            <Text style={styles.fTitle}>Bank-level Security</Text>
            <Text style={styles.fSub}>Your business data is private and encrypted.</Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <History size={20} color="#7e22ce" />
          <View style={styles.featureText}>
            <Text style={styles.fTitle}>100% Data Recovery</Text>
            <Text style={styles.fSub}>Recover your records instantly on any new device.</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#7e22ce', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  heroSection: { alignItems: 'center', padding: 40, backgroundColor: 'white' },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  heroTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  heroSub: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 10, lineHeight: 18 },
  infoCard: { margin: 20, backgroundColor: 'white', borderRadius: 15, padding: 20, elevation: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  infoLabel: { fontSize: 14, color: '#64748b' },
  infoVal: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  syncBtn: { marginHorizontal: 20, backgroundColor: '#7e22ce', padding: 18, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 3 },
  disabledBtn: { opacity: 0.7 },
  syncText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  featureList: { padding: 25 },
  featureItem: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' },
  featureText: { marginLeft: 15, flex: 1 },
  fTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  fSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 }
});
