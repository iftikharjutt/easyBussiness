import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';

// NOTE: Replace these with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase Initialization Error:", error);
  Alert.alert("System Error", "Failed to initialize business database. Please check your internet connection.");
}

// Initialize Auth with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);
export const storage = getStorage(app);

// --- User-Scoped Firestore Hook ---
export const useFirestore = (collectionName) => {
  const [data, setData] = useState([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setData([]);
      return;
    }

    let unsubscribe;
    try {
      const q = query(
        collection(db, 'users', user.uid, collectionName), 
        orderBy('timestamp', 'desc')
      );
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        console.error(`Firestore Snapshot Error (${collectionName}):`, error);
        Alert.alert("Data Error", `Failed to load ${collectionName}. Please refresh or check connection.`);
      });
    } catch (e) {
      console.error(`Firestore Hook Setup Error (${collectionName}):`, e);
    }
    return () => unsubscribe && unsubscribe();
  }, [collectionName, user?.uid]);

  return data;
};

// --- User-Scoped Add Document Helper ---
export const addDocToDb = async (collectionName, payload) => {
  const user = auth.currentUser;
  if (!user) {
    Alert.alert("Auth Error", "You must be logged in to save data.");
    throw new Error("User not authenticated");
  }

  try {
    const docRef = await addDoc(collection(db, 'users', user.uid, collectionName), {
      ...payload,
      timestamp: new Date(),
    });
    return docRef.id;
  } catch (e) {
    console.error(`Error adding to ${collectionName}:`, e);
    Alert.alert("Save Error", `Failed to save ${collectionName}. Details: ${e.message}`);
    throw e;
  }
};
