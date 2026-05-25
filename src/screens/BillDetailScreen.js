import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, Alert, ActivityIndicator } from 'react-native';
import { ChevronLeft, Share2, Download, Printer, FileText, User, Calendar, Tag } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { db, auth } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function BillDetailScreen({ route, navigation }) {
  const { bill } = route.params;
  const [business, setBusiness] = useState(null);
  const [preferences, setPreferences] = useState({ invoiceTheme: 'Modern' });
  const user = auth.currentUser;

  useEffect(() => {
    if (user) fetchData();
  }, [user?.uid]);

  const fetchData = async () => {
    try {
      // Fetch Business Profile
      const bizSnap = await getDoc(doc(db, 'users', user.uid, 'settings', 'business_profile'));
      if (bizSnap.exists()) setBusiness(bizSnap.data());

      // Fetch User Preferences (Theme)
      const prefSnap = await getDoc(doc(db, 'users', user.uid, 'settings', 'app_preferences'));
      if (prefSnap.exists()) setPreferences(prefSnap.data());
    } catch (e) { console.error(e); }
  };

  const generatePDF = async () => {
    const theme = preferences.invoiceTheme || 'Modern';
    
    let styles = '';
    let layout = '';

    if (theme === 'Classic') {
      styles = `
        body { font-family: 'Times New Roman', serif; padding: 30px; color: #000; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 30px; }
        .biz-name { font-size: 28px; font-weight: bold; text-transform: uppercase; }
        .section-title { font-weight: bold; text-decoration: underline; margin-bottom: 10px; }
        .items-table { width: 100%; border: 1px solid #000; border-collapse: collapse; }
        .items-table th, .items-table td { border: 1px solid #000; padding: 10px; text-align: left; }
        .total-row { margin-top: 20px; text-align: right; font-size: 18px; font-weight: bold; }
      `;
      layout = `
        <div class="header">
          <div class="biz-name">${business?.businessName || 'INVOICE'}</div>
          <div>${business?.address || ''} | ${business?.phone || ''}</div>
        </div>
        <div class="section-title">BILL TO: ${bill.customerName}</div>
        <table class="items-table">
          <thead><tr><th>Description</th><th>Amount</th></tr></thead>
          <tbody><tr><td>${bill.itemsSummary || 'General Sale'}</td><td>Rs ${bill.total}</td></tr></tbody>
        </table>
        <div class="total-row">GRAND TOTAL: Rs ${bill.total.toLocaleString()}</div>
      `;
    } else if (theme === 'Compact') {
      styles = `
        body { font-family: 'Courier', monospace; padding: 10px; color: #000; font-size: 12px; }
        .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
        .biz-name { font-size: 16px; font-weight: bold; }
        .items-table { width: 100%; margin-top: 10px; }
        .items-table td { padding: 5px 0; }
        .total-row { border-top: 1px dashed #000; margin-top: 10px; padding-top: 5px; font-weight: bold; text-align: right; }
      `;
      layout = `
        <div class="header">
          <div class="biz-name">${business?.businessName || 'My Business'}</div>
          <div>${bill.date}</div>
          <div>Bill No: ${bill.billNo}</div>
        </div>
        <div>Cust: ${bill.customerName}</div>
        <table class="items-table">
          <tr><td>${bill.itemsSummary || 'Sale'}</td><td style="text-align:right">Rs ${bill.total}</td></tr>
        </table>
        <div class="total-row">TOTAL: Rs ${bill.total.toLocaleString()}</div>
        <div style="text-align:center; margin-top: 20px;">* Thank You *</div>
      `;
    } else {
      // Modern (Default)
      styles = `
        body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #333; }
        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #7e22ce; padding-bottom: 20px; }
        .biz-name { font-size: 26px; font-weight: bold; color: #7e22ce; }
        .items-table { width: 100%; border-collapse: collapse; margin-top: 30px; }
        .items-table th { text-align: left; padding: 12px; background: #f8fafc; color: #64748b; }
        .items-table td { padding: 15px 12px; border-bottom: 1px solid #f1f5f9; }
        .total-row { margin-top: 40px; text-align: right; font-size: 22px; font-weight: bold; padding: 20px; background: #f5f3ff; border-radius: 12px; color: #7e22ce; }
      `;
      layout = `
        <div class="header">
          <div>
            <div class="biz-name">${business?.businessName || 'My Business'}</div>
            <div style="color: #64748b; margin-top: 5px;">${business?.address || ''}</div>
          </div>
          <div style="text-align: right">
            <div style="font-size: 20px; font-weight: bold;">INVOICE</div>
            <div style="color: #64748b">#${bill.billNo}</div>
          </div>
        </div>
        <div style="margin-top: 30px;">
          <div style="color: #94a3b8; font-weight: bold; font-size: 12px;">BILL TO</div>
          <div style="font-size: 16px; font-weight: bold; margin-top: 5px;">${bill.customerName}</div>
        </div>
        <table class="items-table">
          <thead><tr><th>Description</th><th style="text-align: right">Amount</th></tr></thead>
          <tbody><tr><td>${bill.itemsSummary || 'General Sale'}</td><td style="text-align: right">Rs ${bill.total}</td></tr></tbody>
        </table>
        <div class="total-row">Total: Rs ${bill.total.toLocaleString()}</div>
      `;
    }

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>${styles}</style>
        </head>
        <body>
          ${layout}
          <div style="margin-top: 50px; text-align: center; color: #94a3b8; font-size: 12px;">
            Thank you for your business!<br/>
            Generated via easyBussiness App
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) { Alert.alert("Error", "Failed to generate PDF."); }
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `Invoice ${bill.billNo}\nCustomer: ${bill.customerName}\nTotal: Rs ${bill.total}\nItems: ${bill.itemsSummary}`,
      });
    } catch (error) { alert(error.message); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice Detail</Text>
        <TouchableOpacity onPress={onShare}><Share2 color="white" size={20} /></TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.billSheet}>
          <View style={styles.sheetHeader}>
            <FileText size={40} color="#7e22ce" />
            <View style={{ alignItems: 'flex-end' }}>
               <Text style={styles.billNo}>{bill.billNo}</Text>
               <Text style={styles.dateText}>{bill.date}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <User size={16} color="#64748b" />
              <Text style={styles.infoLabel}>Customer</Text>
              <Text style={styles.infoVal}>{bill.customerName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Tag size={16} color="#64748b" />
              <Text style={styles.infoLabel}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: bill.status === 'paid' ? '#dcfce7' : '#fef3c7' }]}>
                <Text style={[styles.statusText, { color: bill.status === 'paid' ? '#166534' : '#92400e' }]}>{bill.status.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Items / Summary</Text>
            <View style={styles.itemsBox}>
               <Text style={styles.itemsText}>{bill.itemsSummary || 'No item details provided.'}</Text>
            </View>
          </View>

          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalVal}>Rs {bill.total.toLocaleString()}</Text>
          </View>

          <View style={styles.footerNote}>
            <Text style={styles.noteTitle}>Theme Applied:</Text>
            <Text style={styles.noteText}>{preferences.invoiceTheme || 'Modern'}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={generatePDF}>
             <Download color="#7e22ce" size={20} />
             <Text style={[styles.actionBtnText, { color: '#7e22ce' }]}>Generate PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onShare}>
             <Share2 color="#475569" size={20} />
             <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { backgroundColor: '#7e22ce', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  billSheet: { backgroundColor: 'white', borderRadius: 20, padding: 25, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  billNo: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  dateText: { fontSize: 12, color: '#64748b', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 20 },
  infoSection: { gap: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { width: 80, fontSize: 14, color: '#64748b', marginLeft: 10 },
  infoVal: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', flex: 1, textAlign: 'right' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  itemsSection: { marginTop: 10 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 15 },
  itemsBox: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, minHeight: 80 },
  itemsText: { fontSize: 15, lineHeight: 22, color: '#334155' },
  totalSection: { marginTop: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f5f3ff', padding: 20, borderRadius: 15 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#7e22ce' },
  totalVal: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  footerNote: { marginTop: 30 },
  noteTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  noteText: { fontSize: 11, color: '#94a3b8', marginTop: 5, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', marginTop: 30, marginBottom: 50 },
  actionBtn: { flex: 1, backgroundColor: 'white', marginHorizontal: 10, padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  actionBtnText: { marginLeft: 10, fontWeight: '600', color: '#475569' }
});
