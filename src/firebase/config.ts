import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Firebase config object from the Firebase Console
// Replace this with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyBmhtKcRpinXCHhhGSFnLrQ4DfhDvcZVBo",
  authDomain: "life-coach-x.firebaseapp.com",
  projectId: "life-coach-x",
  storageBucket: "life-coach-x.firebasestorage.app",
  messagingSenderId: "283512578635",
  appId: "1:283512578635:web:8ebfe0dca49aa8edf563ce",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
