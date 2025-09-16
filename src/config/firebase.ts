import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
// API key is a secret just so Github doesn't complain
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

// Check if API key is provided
if (!apiKey) {
  console.error(
    "❌ Firebase API key is missing! Please add VITE_FIREBASE_API_KEY to your .env file.\n" +
      "Create a .env file in the project root with:\n" +
      "VITE_FIREBASE_API_KEY=your-actual-api-key"
  );
}

const firebaseConfig = {
  apiKey: apiKey || "",
  authDomain: "life-coach-x-firebase.firebaseapp.com",
  projectId: "life-coach-x-firebase",
  storageBucket: "life-coach-x-firebase.firebasestorage.app",
  messagingSenderId: "539026470504",
  appId: "1:539026470504:web:ea16736cc76a39027feddd",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
