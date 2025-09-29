import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD0Wak6a3UYnYnraM3hw30joora7l1_ABQ",
  authDomain: "tamtamlove-a48bd.firebaseapp.com",
  databaseURL: "https://tamtamlove-a48bd-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tamtamlove-a48bd",
  storageBucket: "tamtamlove-a48bd.firebasestorage.app",
  messagingSenderId: "952622287805",
  appId: "1:952622287805:web:862efa6bd25e96487860d4",
  measurementId: "G-5J0NDHTVWZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the Realtime Database
export const database = getDatabase(app);
export default app;