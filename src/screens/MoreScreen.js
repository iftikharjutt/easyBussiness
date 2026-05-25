import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db, auth } from '../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  User, 
  Settings, 
  ShieldCheck, 
  Bell, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  Store
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const MenuItem = ({ icon: Icon, title, subtitle, onPress, showSwitch, color }) => {
  const { colors } = useTheme();
  const iconColor = color || colors.primary;
  return (
    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.background }]} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '10' }]}>
        <Icon color={iconColor} size={22} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {showSwitch ? (
        <Switch trackColor={{ false: "#767577", true: colors.primary + '50' }} thumbColor={ colors.primary } />
      ) : (
        <ChevronRight color={colors.border} size={20} />
      )}
    </TouchableOpacity>
  );
};

export default function MoreScreen() {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const [profile, setProfile] = useState({ businessName: 'Your Business', ownerName: 'User' });
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid, 'settings', 'business_profile'), (doc) => {
      if (doc.exists()) {
        setProfile(doc.data());
      }
    });
    return unsubscribe;
  }, [user?.uid]);

  const handleLogout = () => {
    Alert.alert(t('settings.logout'), "Are you sure you want to sign out?", [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.logout'), style: 'destructive', onPress: () => signOut(auth) }
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <User color="white" size={30} />
          </View>
          <View>
            <Text style={[styles.userName, { color: colors.text }]}>{profile.businessName}</Text>
            <Text style={[styles.userPhone, { color: colors.textSecondary }]}>{user?.email}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.editBtn, { borderColor: colors.border }]} 
          onPress={() => navigation.navigate('BusinessProfile')}
        >
          <Text style={[styles.editBtnText, { color: colors.primary }]}>Manage</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Business Settings</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <MenuItem 
            icon={Store} 
            title={t('settings.business_profile')} 
            subtitle="Change name, address, category" 
            onPress={() => navigation.navigate('BusinessProfile')}
          />
          <MenuItem 
            icon={Settings} 
            title={t('settings.general')} 
            subtitle="Currency, Language, Notifications" 
            onPress={() => navigation.navigate('GeneralSettings')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Support & Safety</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <MenuItem 
            icon={ShieldCheck} 
            title={t('settings.backup')} 
            subtitle="App lock, Backup history" 
            onPress={() => navigation.navigate('Backup')}
          />
          <MenuItem 
            icon={HelpCircle} 
            title={t('settings.help')} 
            subtitle="FAQs, Contact Support" 
            onPress={() => navigation.navigate('HelpCenter')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <MenuItem 
            icon={LogOut} 
            title={t('settings.logout')} 
            color="#ef4444" 
            onPress={handleLogout}
          />
        </View>
      </View>

      <Text style={[styles.version, { color: colors.textSecondary }]}>Version 1.0.0 (Stable)</Text>
      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 25, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  profileSection: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  userName: { fontSize: 18, fontWeight: 'bold' },
  userPhone: { fontSize: 12, marginTop: 2 },
  editBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  editBtnText: { fontSize: 12, fontWeight: '600' },
  section: { paddingHorizontal: 20, marginTop: 25 },
  sectionHeader: { fontSize: 11, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  card: { borderRadius: 20, overflow: 'hidden', elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  textContainer: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '600' },
  menuSubtitle: { fontSize: 11, marginTop: 2 },
  version: { textAlign: 'center', fontSize: 11, marginTop: 30 }
});
