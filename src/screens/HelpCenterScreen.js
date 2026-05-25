import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Accordion } from 'react-native';
import { ChevronLeft, MessageSquare, Phone, Mail, ChevronDown, ChevronUp } from 'lucide-react-native';

const FAQItem = ({ question, answer }) => {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <TouchableOpacity style={styles.faqItem} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
      <View style={styles.faqHeader}>
        <Text style={styles.question}>{question}</Text>
        {expanded ? <ChevronUp size={18} color="#7e22ce" /> : <ChevronDown size={18} color="#94a3b8" />}
      </View>
      {expanded && <Text style={styles.answer}>{answer}</Text>}
    </TouchableOpacity>
  );
};

export default function HelpCenterScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactCard}>
              <View style={[styles.contactIcon, { backgroundColor: '#dcfce7' }]}><Phone size={22} color="#166534" /></View>
              <Text style={styles.contactText}>Call Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactCard}>
              <View style={[styles.contactIcon, { backgroundColor: '#fef3c7' }]}><MessageSquare size={22} color="#92400e" /></View>
              <Text style={styles.contactText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactCard}>
              <View style={[styles.contactIcon, { backgroundColor: '#e0f2fe' }]}><Mail size={22} color="#075985" /></View>
              <Text style={styles.contactText}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <FAQItem 
            question="How to add a new customer?" 
            answer="Go to 'Party' from the home screen and click the 'ADD CUSTOMER' button at the bottom right. Fill in the name and phone number and save." 
          />
          <FAQItem 
            question="Is my data safe on the cloud?" 
            answer="Yes, easyBussiness uses industry-standard cloud encryption to sync your data securely across all your devices." 
          />
          <FAQItem 
            question="How to generate a PDF report?" 
            answer="Go to the 'Reports' tab and click on 'Export Data to CSV'. Detailed PDF reports are coming in the next update!" 
          />
          <FAQItem 
            question="Can I use the app offline?" 
            answer="Yes, you can record transactions offline. They will automatically sync to the cloud once you are back online." 
          />
        </View>

        <View style={styles.aboutBox}>
           <Text style={styles.aboutText}>easyBussiness App v1.0.0 (Stable)</Text>
           <Text style={styles.copyText}>© 2026 easyBussiness Business Solutions</Text>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#7e22ce', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 0.5 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  contactCard: { flex: 1, backgroundColor: 'white', marginHorizontal: 5, padding: 15, borderRadius: 15, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  contactIcon: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  contactText: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
  faqSection: { marginBottom: 30 },
  faqItem: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  question: { fontSize: 14, fontWeight: '600', color: '#334155', flex: 1, marginRight: 10 },
  answer: { fontSize: 13, color: '#64748b', marginTop: 12, lineHeight: 20 },
  aboutBox: { alignItems: 'center', marginTop: 10 },
  aboutText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  copyText: { fontSize: 10, color: '#cbd5e1', marginTop: 4 }
});
