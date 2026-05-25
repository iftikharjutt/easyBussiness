import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, Modal, FlatList } from 'react-native';
import { db, auth } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ChevronLeft, Globe, DollarSign, Bell, Moon, Shield, Palette, FileText, Check, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function GeneralSettingsScreen({ navigation }) {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const user = auth.currentUser || { uid: 'guest_user' };
  
  const [settings, setSettings] = useState({
    currency: 'PKR (Rs)',
    language: i18n.language === 'ur' ? 'اردو' : 'English',
    notifications: true,
    darkMode: isDarkMode,
    appLock: false,
    invoiceTheme: 'Modern',
    reportTheme: 'Default'
  });

  const [langModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (user) fetchSettings();
  }, [user?.uid]);

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, 'users', user.uid, 'settings', 'app_preferences');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({ ...settings, ...data, darkMode: isDarkMode });
      }
    } catch (e) {
      console.error("Fetch Settings Error:", e);
      Alert.alert("Error", "Failed to load preferences.");
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'app_preferences'), newSettings);
    } catch (e) {
      console.error("Update Setting Error:", e);
      Alert.alert("Error", "Failed to update preference: " + e.message);
    }
  };

  const changeLanguage = (langCode, label) => {
    try {
      i18n.changeLanguage(langCode);
      updateSetting('language', label);
      setModalVisible(false);
    } catch (e) {
      console.error("Change Language Error:", e);
      Alert.alert("Error", "Failed to change language.");
    }
  };

  const ThemeOption = ({ label, current, onSelect }) => (
    <TouchableOpacity 
      style={[styles.themeBtn, { backgroundColor: current === label ? colors.primary : colors.input }]} 
      onPress={() => onSelect(label)}
    >
      <Text style={[styles.themeBtnText, { color: current === label ? 'white' : colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.general')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.theme')}</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.themeRow}>
              <View style={styles.iconLabelRow}>
                <FileText size={18} color={colors.primary} />
                <Text style={[styles.rowLabel, { color: colors.text }]}>Invoice Template</Text>
              </View>
              <View style={[styles.themeToggle, { backgroundColor: colors.input }]}>
                {['Modern', 'Classic', 'Compact'].map(t => (
                  <ThemeOption key={t} label={t} current={settings.invoiceTheme} onSelect={(val) => updateSetting('invoiceTheme', val)} />
                ))}
              </View>
            </View>

            <View style={styles.themeRow}>
              <View style={styles.iconLabelRow}>
                <Palette size={18} color={colors.primary} />
                <Text style={[styles.rowLabel, { color: colors.text }]}>Report Colors</Text>
              </View>
              <View style={[styles.themeToggle, { backgroundColor: colors.input }]}>
                {['Default', 'Professional', 'Contrast'].map(t => (
                  <ThemeOption key={t} label={t} current={settings.reportTheme} onSelect={(val) => updateSetting('reportTheme', val)} />
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.language')}</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <TouchableOpacity style={styles.row} onPress={() => setModalVisible(true)}>
              <View style={styles.iconRow}>
                <Globe size={20} color={colors.primary} />
                <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settings.language')}</Text>
              </View>
              <Text style={styles.rowVal}>{settings.language}</Text>
            </TouchableOpacity>
            
            <View style={styles.row}>
              <View style={styles.iconRow}>
                <Moon size={20} color={colors.primary} />
                <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settings.dark_mode')}</Text>
              </View>
              <Switch 
                value={isDarkMode} 
                onValueChange={toggleTheme}
                trackColor={{ false: "#cbd5e1", true: colors.primary + '80' }}
                thumbColor={isDarkMode ? colors.primary : "#f4f3f4"}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.general')}</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.row}>
              <View style={styles.iconRow}>
                <Bell size={20} color={colors.primary} />
                <Text style={[styles.rowLabel, { color: colors.text }]}>Push Notifications</Text>
              </View>
              <Switch 
                value={settings.notifications} 
                onValueChange={(v) => updateSetting('notifications', v)}
                trackColor={{ false: "#cbd5e1", true: colors.primary + '80' }}
                thumbColor={settings.notifications ? colors.primary : "#f4f3f4"}
              />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
           <Text style={[styles.footerText, { color: colors.textSecondary }]}>easyBussiness App - v1.0.0</Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={langModalVisible} animationType="slide" transparent={true}>
         <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
               <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Select Language</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}><X color={colors.text} /></TouchableOpacity>
               </View>
               <TouchableOpacity 
                 style={styles.langRow} 
                 onPress={() => changeLanguage('en', 'English')}
               >
                  <Text style={[styles.langText, { color: colors.text }]}>English</Text>
                  {i18n.language === 'en' && <Check size={20} color={colors.primary} />}
               </TouchableOpacity>
               <TouchableOpacity 
                 style={styles.langRow} 
                 onPress={() => changeLanguage('ur', 'اردو')}
               >
                  <Text style={[styles.langText, { color: colors.text, textAlign: 'right', flex: 1 }]}>اردو</Text>
                  {i18n.language === 'ur' && <Check size={20} color={colors.primary} />}
               </TouchableOpacity>
            </View>
         </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },
  card: { borderRadius: 15, overflow: 'hidden', elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  iconRow: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { marginLeft: 12, fontSize: 14, fontWeight: '500' },
  rowVal: { fontSize: 13, color: '#94a3b8' },
  themeRow: { padding: 16, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  iconLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  themeToggle: { flexDirection: 'row', borderRadius: 10, padding: 4 },
  themeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  themeBtnText: { fontSize: 11, fontWeight: 'bold' },
  footer: { marginTop: 10, alignItems: 'center' },
  footerText: { fontSize: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  langRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  langText: { fontSize: 16, fontWeight: '500' }
});
