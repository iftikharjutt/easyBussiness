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
    });
    return unsubscribe;
  }, [currentDate, user?.uid]);

  // 2. Fetch monthly stats for Payroll
  useEffect(() => {
    if (tab !== 'payroll' || !user) return;
    const fetchMonthlyStats = async () => {
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
    };
    fetchMonthlyStats();
  }, [tab, staff, user?.uid]);

  const handleMarkAttendance = async (staffId, status) => {
    if (!user) return;
    const dateStr = currentDate.toLocaleDateString('en-CA');
    const attendanceId = `${staffId}_${dateStr}`;
    await setDoc(doc(db, 'users', user.uid, 'attendance', attendanceId), {
      staffId,
      date: dateStr,
      status,
      timestamp: new Date()
    });
  };
...
  const [name, setName] = useState('');
  const [salary, setSalary] = useState('');

  const { total, present, absent } = {
    total: staff.length,
    present: Object.values(dailyAttendance).filter(s => s === 'P').length,
    absent: Object.values(dailyAttendance).filter(s => s === 'A').length
  };
...
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
...
});
