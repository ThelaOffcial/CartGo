/**
 * CartGo - Firebase Configuration & Initialization
 * Modular Firebase SDK v11+
 * Handles all Firebase services initialization
 */

// Firebase Configuration - PRODUCTION
const firebaseConfig = {
  apiKey: "AIzaSyCD7k04EWS3hRbAt9MoPvl72CA3r7j5IPE",
  authDomain: "machines-89d16.firebaseapp.com",
  databaseURL: "https://machines-89d16-default-rtdb.firebaseio.com",
  projectId: "machines-89d16",
  storageBucket: "machines-89d16.firebasestorage.app",
  messagingSenderId: "918445502868",
  appId: "1:918445502868:web:de44606a03dcadf65a1f81",
  measurementId: "G-Q528V795YE"
};

// Import Firebase Modules (v11+)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js';
import { 
  getDatabase,
  ref,
  get,
  set,
  update,
  remove,
  query,
  orderByChild,
  limitToLast,
  onValue,
  off
} from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js';
import { 
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js';
import { 
  getAnalytics,
  logEvent
} from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-analytics.js';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Configure Auth Persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('✓ Firebase Auth Persistence Enabled');
  })
  .catch((error) => {
    console.error('✗ Persistence Error:', error);
  });

/**
 * Listen to Auth State Changes
 */
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('✓ User Logged In:', user.email);
    localStorage.setItem('cartgo_user_id', user.uid);
    localStorage.setItem('cartgo_user_email', user.email);
    
    // Log analytics event
    logEvent(analytics, 'user_login', {
      user_id: user.uid,
      timestamp: new Date().toISOString()
    });
  } else {
    console.log('✗ User Not Logged In');
    localStorage.removeItem('cartgo_user_id');
    localStorage.removeItem('cartgo_user_email');
  }
});

/**
 * Firebase Utility Functions
 */

// Get current user
export const getCurrentUser = () => auth.currentUser;

// Get user ID
export const getUserId = () => auth.currentUser?.uid || null;

// Check if user is authenticated
export const isUserAuthenticated = () => !!auth.currentUser;

// Get user role from database
export const getUserRole = async (userId) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    return snapshot.val()?.role || 'customer';
  } catch (error) {
    console.error('Error fetching user role:', error);
    return 'customer';
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    localStorage.clear();
    console.log('✓ User Logged Out');
  } catch (error) {
    console.error('✗ Logout Error:', error);
  }
};

/**
 * Realtime Database Functions
 */

// Read data once
export const readData = async (path) => {
  try {
    const dataRef = ref(database, path);
    const snapshot = await get(dataRef);
    return snapshot.val();
  } catch (error) {
    console.error('Database Read Error:', error);
    return null;
  }
};

// Write/Set data
export const writeData = async (path, data) => {
  try {
    const dataRef = ref(database, path);
    await set(dataRef, data);
    console.log('✓ Data Written:', path);
    return true;
  } catch (error) {
    console.error('Database Write Error:', error);
    return false;
  }
};

// Update data
export const updateData = async (path, updates) => {
  try {
    const dataRef = ref(database, path);
    await update(dataRef, updates);
    console.log('✓ Data Updated:', path);
    return true;
  } catch (error) {
    console.error('Database Update Error:', error);
    return false;
  }
};

// Delete data
export const deleteData = async (path) => {
  try {
    const dataRef = ref(database, path);
    await remove(dataRef);
    console.log('✓ Data Deleted:', path);
    return true;
  } catch (error) {
    console.error('Database Delete Error:', error);
    return false;
  }
};

// Real-time listener
export const listenToData = (path, callback) => {
  const dataRef = ref(database, path);
  const unsubscribe = onValue(dataRef, (snapshot) => {
    callback(snapshot.val());
  }, (error) => {
    console.error('Listener Error:', error);
  });
  return unsubscribe;
};

// Stop listening to data
export const stopListening = (unsubscribe) => {
  if (unsubscribe) unsubscribe();
};

/**
 * Firebase Storage Functions
 */

// Upload file to storage
export const uploadFile = async (path, file) => {
  try {
    const fileRef = storageRef(storage, path);
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✓ File Uploaded:', path);
    return downloadURL;
  } catch (error) {
    console.error('Upload Error:', error);
    return null;
  }
};

// Get file download URL
export const getFileURL = async (path) => {
  try {
    const fileRef = storageRef(storage, path);
    const url = await getDownloadURL(fileRef);
    return url;
  } catch (error) {
    console.error('Get URL Error:', error);
    return null;
  }
};

// Delete file from storage
export const deleteFile = async (path) => {
  try {
    const fileRef = storageRef(storage, path);
    await deleteObject(fileRef);
    console.log('✓ File Deleted:', path);
    return true;
  } catch (error) {
    console.error('Delete Error:', error);
    return false;
  }
};

/**
 * Analytics Functions
 */

export const logAnalyticsEvent = (eventName, eventData = {}) => {
  try {
    logEvent(analytics, eventName, {
      ...eventData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analytics Error:', error);
  }
};

// Export Firebase instances
export { app, auth, database, storage, analytics };