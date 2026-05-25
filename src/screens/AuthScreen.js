import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, Store } from 'lucide-react-native';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Input Error", "Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (e) {
      console.error("Auth Error:", e);
      let errorMsg = "An unexpected error occurred. Please try again.";
      if (e.code === 'auth/user-not-found') errorMsg = "No account found with this email.";
      else if (e.code === 'auth/wrong-password') errorMsg = "Incorrect password.";
      else if (e.code === 'auth/email-already-in-use') errorMsg = "This email is already registered.";
      else if (e.code === 'auth/invalid-email') errorMsg = "Please enter a valid email address.";
      
      Alert.alert("Login Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#7e22ce', '#ef4444']} style={styles.header}>
         <View style={styles.logoCircle}>
            <Store color="white" size={40} />
         </View>
         <Text style={styles.appName}>easyBussiness</Text>
         <Text style={styles.appSub}>Secure Business Management</Text>
      </LinearGradient>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
        
        <View style={styles.inputGroup}>
          <Mail size={18} color="#94a3b8" />
          <TextInput 
            placeholder="Email Address" 
            style={styles.input} 
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputGroup}>
          <Lock size={18} color="#94a3b8" />
          <TextInput 
            placeholder="Password" 
            style={styles.input} 
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={[styles.authBtn, loading && styles.disabledBtn]} 
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : (
            <Text style={styles.authBtnText}>{isLogin ? 'LOGIN' : 'SIGN UP'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchBtn}>
           <Text style={styles.switchText}>
             {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
           </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { height: '35%', justifyContent: 'center', alignItems: 'center', borderBottomLeftRadius: 50, borderBottomRightRadius: 50 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  appName: { color: 'white', fontSize: 28, fontWeight: 'bold', letterSpacing: 1 },
  appSub: { color: 'white', opacity: 0.8, fontSize: 13, marginTop: 5 },
  formCard: { backgroundColor: 'white', marginHorizontal: 30, marginTop: -40, borderRadius: 25, padding: 25, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10 },
  formTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 25, textAlign: 'center' },
  inputGroup: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#e2e8f0', marginBottom: 20, paddingBottom: 5 },
  input: { flex: 1, marginLeft: 10, fontSize: 15, color: '#334155', height: 40 },
  authBtn: { backgroundColor: '#7e22ce', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  disabledBtn: { opacity: 0.7 },
  authBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  switchBtn: { marginTop: 20, alignItems: 'center' },
  switchText: { color: '#64748b', fontSize: 13 }
});
