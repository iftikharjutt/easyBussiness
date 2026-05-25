import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { UserPlus, ChevronLeft, ChevronRight, Check, X, CreditCard } from 'lucide-react-native';
import { useFirestore, addDocToDb, db, auth } from '../config/firebase';
import { collection, query, where, onSnapshot, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

export default function StaffScreen() {
  const staff = useFirestore('staff');
  const [tab, setTab] = useState('attendance');
  const [modalVisible, setModalVisible] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyAttendance, setDailyAttendance] = useState({});
  const [payrollData, setPayrollData] = useState({});
  const user = auth.currentUser;

  const [name, setName] = useState('');
  const [salary, setSalary] = useState('');

  // 1. Fetch attendance for selected date
  useEffect(() => {
    if (!user) return;
    const dateStr = currentDate.toLocaleDateString('en-CA');
    const q = query(
      collection(db, 'users', user.uid, 'attendance'), 
      where('date', '==', dateStr)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const attendanceMap = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        attendanceMap[data.staffId] = data.status;
      });
      setDailyAttendance(attendanceMap);
    }, (error) => {
      console.error("Attendance Sync Error:", error);
    });
    return unsubscribe;
  }, [currentDate, user?.uid]);

  // 2. Fetch monthly stats for Payroll
  useEffect(() => {
    if (tab !== 'payroll' || !user) return;
    const fetchMonthlyStats = async () => {
      try {
        const stats = {};
        const date = new Date();
        const monthStr = date.toLocaleDateString('en-CA').slice(0, 7);
        const q = query(
          collection(db, 'users', user.uid, 'attendance'), 
          where('date', '>=', `${monthStr}-01`)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (!stats[data.staffId]) stats[data.staffId] = { present: 0, absent: 0 };
          if (data.status === 'P') stats[data.staffId].present += 1;
          else stats[data.staffId].absent += 1;
        });
        setPayrollData(stats);
      } catch (e) {
        console.error("fetchMonthlyStats Error:", e);
        Alert.alert('Error', 'Failed to fetch monthly payroll stats.');
      }
    };
    fetchMonthlyStats();
  }, [tab, staff, user?.uid]);

  const handleMarkAttendance = async (staffId, status) => {
    try {
      if (!user) return;
      const dateStr = currentDate.toLocaleDateString('en-CA');
      const attendanceId = `${staffId}_${dateStr}`;
      await setDoc(doc(db, 'users', user.uid, 'attendance', attendanceId), {
        staffId,
        date: dateStr,
        status,
        timestamp: new Date()
      });
    } catch (e) {
      console.error("handleMarkAttendance Error:", e);
      Alert.alert('Error', 'Failed to mark attendance.');
    }
  };

  const calculateSalary = (staffItem) => {
    const stats = payrollData[staffItem.id] || { present: 0 };
    const perDaySalary = staffItem.salary / 30;
    return Math.round(stats.present * perDaySalary);
  };

  const handlePaySalary = async (staffItem) => {
    try {
      const amount = calculateSalary(staffItem);
      if (amount <= 0) {
        Alert.alert("Invalid Amount", "Salary amount must be greater than 0.");
        return;
      }

      Alert.alert("Confirm Payment", `Pay Rs ${amount.toLocaleString()} to ${staffItem.name}?`, [
        { text: "Cancel" },
        { text: "Pay Now", onPress: async () => {
          try {
            await addDocToDb('expenses', {
              amount: amount,
              category: 'Staff Salary',
              description: `Salary for ${staffItem.name} (${new Date().toLocaleDateString('en-PK', { month: 'long' })})`,
              date: new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }),
              timestamp: new Date()
            });
            Alert.alert("Success", "Salary paid and recorded in Expenses!");
          } catch (e) {
            console.error("Payment Recording Error:", e);
            Alert.alert("Error", "Failed to record payment.");
          }
        }}
      ]);
    } catch (e) {
      console.error("handlePaySalary Error:", e);
    }
  };

  const handleAddStaff = async () => {
    try {
      if (!name || !salary) return;
      await addDocToDb('staff', {
        name,
        salary: parseFloat(salary),
        joinedDate: new Date().toLocaleDateString('en-PK')
      });
      setName(''); setSalary('');
      setModalVisible(false);
    } catch (e) {
      console.error("handleAddStaff Error:", e);
      Alert.alert("Error", "Failed to add staff member.");
    }
  };

  const handleDeleteStaff = (id) => {
    Alert.alert("Delete Staff", "Are you sure? This will remove all records for this staff member.", [
      { text: "Cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'staff', id));
        } catch (e) {
          console.error("handleDeleteStaff Error:", e);
          Alert.alert("Error", "Failed to delete staff member.");
        }
      }}
    ]);
  };

  const { total, present, absent } = {
    total: staff.length,
    present: Object.values(dailyAttendance).filter(s => s === 'P').length,
    absent: Object.values(dailyAttendance).filter(s => s === 'A').length
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabHeader}>
        <TouchableOpacity onPress={() => setTab('attendance')} style={[styles.tab, tab === 'attendance' && styles.activeTab]}>
          <Text style={[styles.tabText, tab === 'attendance' && styles.activeTabText]}>Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('payroll')} style={[styles.tab, tab === 'payroll' && styles.activeTab]}>
          <Text style={[styles.tabText, tab === 'payroll' && styles.activeTabText]}>Payroll</Text>
        </TouchableOpacity>
      </View>

      {tab === 'attendance' ? (
        <View style={{flex: 1}}>
          <View style={styles.dateSelector}>
             <TouchableOpacity onPress={() => { const d = new Date(currentDate); d.setDate(d.getDate()-1); setCurrentDate(d); }}><ChevronLeft size={24} color="#7c3aed" /></TouchableOpacity>
             <Text style={styles.dateText}>{currentDate.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
             <TouchableOpacity onPress={() => { const d = new Date(currentDate); d.setDate(d.getDate()+1); setCurrentDate(d); }}><ChevronRight size={24} color="#7c3aed" /></TouchableOpacity>
          </View>
          <View style={styles.attendanceSummary}>
             <View style={styles.summaryItem}><Text style={styles.sumLabel}>Total</Text><Text style={styles.sumVal}>{total}</Text></View>
             <View style={styles.summaryItem}><Text style={[styles.sumLabel, {color: '#22c55e'}]}>Present</Text><Text style={[styles.sumVal, {color: '#22c55e'}]}>{present}</Text></View>
             <View style={styles.summaryItem}><Text style={[styles.sumLabel, {color: '#ef4444'}]}>Absent</Text><Text style={[styles.sumVal, {color: '#ef4444'}]}>{absent}</Text></View>
          </View>
          <FlatList
            data={staff}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
              <View style={styles.staffRow}>
                <TouchableOpacity 
                  style={styles.staffInfo}
                  onLongPress={() => handleDeleteStaff(item.id)}
                >
                   <View style={styles.avatar}><Text style={styles.avatarText}>{item.name[0]}</Text></View>
                   <Text style={styles.staffName}>{item.name}</Text>
                </TouchableOpacity>
                <View style={styles.btnGroup}>
                  <TouchableOpacity 
                    style={[styles.pBtn, dailyAttendance[item.id] === 'P' && styles.pActive]}
                    onPress={() => handleMarkAttendance(item.id, 'P')}
                  >
                    <Check size={16} color={dailyAttendance[item.id] === 'P' ? 'white' : '#22c55e'} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.aBtn, dailyAttendance[item.id] === 'A' && styles.aActive]}
                    onPress={() => handleMarkAttendance(item.id, 'A')}
                  >
                    <X size={16} color={dailyAttendance[item.id] === 'A' ? 'white' : '#ef4444'} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No staff members added.</Text>}
          />
          <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
             <UserPlus color="white" size={20} />
             <Text style={styles.fabText}>ADD STAFF</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{flex: 1, padding: 20}}>
          <Text style={styles.payrollTitle}>Payroll Summary ({new Date().toLocaleDateString('en-PK', { month: 'long' })})</Text>
          <FlatList
            data={staff}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
              <View style={styles.payrollCard}>
                <View style={styles.payrollHeader}>
                   <View>
                      <Text style={styles.pName}>{item.name}</Text>
                      <Text style={styles.pSub}>Base: Rs {item.salary.toLocaleString()}</Text>
                   </View>
                   <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.pSalary}>Rs {calculateSalary(item).toLocaleString()}</Text>
                      <Text style={styles.pStatus}>Payable</Text>
                   </View>
                </View>
                <View style={styles.pStatsRow}>
                   <View style={styles.pStatItem}><Text style={styles.pStatVal}>{payrollData[item.id]?.present || 0}</Text><Text style={styles.pStatLab}>Present</Text></View>
                   <View style={styles.pStatItem}><Text style={styles.pStatVal}>{payrollData[item.id]?.absent || 0}</Text><Text style={styles.pStatLab}>Absent</Text></View>
                   <View style={styles.pStatItem}><Text style={styles.pStatVal}>30</Text><Text style={styles.pStatLab}>Month Days</Text></View>
                </View>
                <TouchableOpacity style={styles.payBtn} onPress={() => handlePaySalary(item)}>
                   <CreditCard size={18} color="#7c3aed" />
                   <Text style={styles.payBtnText}>Pay Salary</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Add staff to calculate payroll.</Text>}
          />
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Staff</Text>
              <TextInput placeholder="Staff Name" style={styles.mInput} value={name} onChangeText={setName} />
              <TextInput placeholder="Monthly Base Salary" style={styles.mInput} keyboardType="numeric" value={salary} onChangeText={setSalary} />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}><Text>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleAddStaff}><Text style={{color: 'white', fontWeight: 'bold'}}>Save Staff</Text></TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  tabHeader: { flexDirection: 'row', backgroundColor: 'white', padding: 8, borderBottomWidth: 1, borderColor: '#eee' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#8b5cf6' },
  tabText: { fontWeight: '600', color: '#6b7280' },
  activeTabText: { color: 'white' },
  dateSelector: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, backgroundColor: 'white' },
  dateText: { marginHorizontal: 30, fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  attendanceSummary: { flexDirection: 'row', backgroundColor: 'white', paddingBottom: 15, borderBottomWidth: 1, borderColor: '#eee' },
  summaryItem: { flex: 1, alignItems: 'center' },
  sumLabel: { fontSize: 12, color: 'gray' },
  sumVal: { fontSize: 18, fontWeight: 'bold' },
  staffRow: { flexDirection: 'row', padding: 15, alignItems: 'center', backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#f1f5f9', justifyContent: 'space-between' },
  staffInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#7c3aed', fontWeight: 'bold' },
  staffName: { fontSize: 16, fontWeight: '500' },
  btnGroup: { flexDirection: 'row' },
  pBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#22c55e', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  aBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
  pActive: { backgroundColor: '#22c55e' },
  aActive: { backgroundColor: '#ef4444' },
  empty: { textAlign: 'center', marginTop: 40, color: '#94a3b8' },
  fab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#8b5cf6', paddingHorizontal: 20, height: 50, borderRadius: 25, flexDirection: 'row', alignItems: 'center', elevation: 4 },
  fabText: { color: 'white', fontWeight: 'bold', marginLeft: 10 },
  payrollTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#1f2937' },
  payrollCard: { backgroundColor: 'white', padding: 20, marginBottom: 15, borderRadius: 15, elevation: 2 },
  payrollHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  pName: { fontSize: 16, fontWeight: 'bold' },
  pSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  pSalary: { fontSize: 20, fontWeight: 'bold', color: '#7c3aed' },
  pStatus: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },
  pStatsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9', marginBottom: 15 },
  pStatItem: { alignItems: 'center', flex: 1 },
  pStatVal: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  pStatLab: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  payBtn: { backgroundColor: '#f5f3ff', padding: 12, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  payBtnText: { color: '#7c3aed', fontWeight: 'bold', marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  mInput: { borderBottomWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 15 },
  modalActions: { flexDirection: 'row', marginTop: 10 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center' },
  saveBtn: { flex: 1, backgroundColor: '#8b5cf6', padding: 15, borderRadius: 10, alignItems: 'center' }
});
