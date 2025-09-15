import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase config - only API key is secret
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "life-coach-x.firebaseapp.com",
  projectId: "life-coach-x",
  storageBucket: "life-coach-x.firebasestorage.app",
  messagingSenderId: "283512578635",
  appId: "1:283512578635:web:f9d922e5725c2b61f563ce",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
