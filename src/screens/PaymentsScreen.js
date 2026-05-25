import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Share } from 'react-native';
import { Share2, Download, QrCode } from 'lucide-react-native';
import { db } from '../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function PaymentsScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'business_profile'), (doc) => {
      if (doc.exists()) {
        setProfile(doc.data());
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const qrData = profile 
    ? `Business: ${profile.businessName}\nPhone: ${profile.phone}\nAccount: MyKhataPay`
    : 'MyKhataPaymentGateway';

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;

  const onShare = async () => {
    try {
      await Share.share({
        message: `Pay to ${profile?.businessName || 'My Business'} using MyKhata App.\nScan QR Code: ${qrUrl}`,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#7e22ce" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Business QR</Text>
      
      <View style={styles.qrCard}>
        <View style={styles.qrWrapper}>
           <Image 
             source={{ uri: qrUrl }} 
             style={styles.qrImage}
             loadingIndicatorSource={<ActivityIndicator color="#7e22ce" />}
           />
        </View>
        <Text style={styles.businessName}>{profile?.businessName || 'Set Business Name in More'}</Text>
        <Text style={styles.qrText}>Scan & Pay: Fast payments, one scan away</Text>
      </View>
      
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
           <Share2 color="white" size={20} />
           <Text style={styles.shareBtnText}>SHARE QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
           <Download color="#7e22ce" size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.tipBox}>
         <QrCode size={18} color="#64748b" />
         <Text style={styles.tipText}>Tip: Print this QR and place it on your shop counter for easy payments.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 30, color: '#1f2937' },
  qrCard: { width: '100%', backgroundColor: '#f8fafc', borderRadius: 30, padding: 30, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  qrWrapper: { padding: 15, backgroundColor: 'white', borderRadius: 20, elevation: 2 },
  qrImage: { width: 220, height: 220 },
  businessName: { marginTop: 20, fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  qrText: { marginTop: 10, fontSize: 13, color: '#64748b', textAlign: 'center' },
  actionRow: { flexDirection: 'row', marginTop: 40, alignItems: 'center' },
  shareBtn: { backgroundColor: '#ef4444', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30, flexDirection: 'row', alignItems: 'center', elevation: 5 },
  shareBtnText: { color: 'white', marginLeft: 10, fontWeight: 'bold', fontSize: 14 },
  iconBtn: { marginLeft: 20, width: 54, height: 54, borderRadius: 27, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  tipBox: { flexDirection: 'row', marginTop: 40, padding: 15, backgroundColor: '#f8fafc', borderRadius: 12, alignItems: 'center', marginHorizontal: 10 },
  tipText: { marginLeft: 10, fontSize: 11, color: '#64748b', flex: 1, lineHeight: 16 }
});
