import { doc, getDoc, setDoc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "./config";
import type { AppState } from "../types/TodoItem";

const COLLECTION_NAME = "users";

// Extend Window interface to include userId
declare global {
  interface Window {
    userId?: string;
  }
}

// Get user document ID (use actual user ID or fallback)
const getUserDocumentId = (): string => {
  // This will be set by the auth service
  return window.userId || "default-user";
};

// Convert Firestore data to AppState
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertFirestoreToAppState = (data: any): AppState => {
  return {
    hp: data.hp || 1000,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    todos: (data.todos || []).map((todo: any) => ({
      ...todo,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      history: (todo.history || []).map((entry: any) => ({
        ...entry,
        date: entry.date?.toDate ? entry.date.toDate() : new Date(entry.date),
      })),
    })),
    sections: data.sections || [],
    lastResetDate: data.lastResetDate?.toDate
      ? data.lastResetDate.toDate()
      : new Date(data.lastResetDate),
  };
};

// Convert AppState to Firestore data
const convertAppStateToFirestore = (state: AppState) => {
  return {
    hp: state.hp,
    todos: state.todos.map((todo) => ({
      ...todo,
      history: todo.history.map((entry) => ({
        ...entry,
        date: Timestamp.fromDate(new Date(entry.date)),
      })),
    })),
    sections: state.sections,
    lastResetDate: Timestamp.fromDate(new Date(state.lastResetDate)),
  };
};

// Load app state from Firestore
export const loadAppStateFromFirestore = async (): Promise<AppState | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, getUserDocumentId());
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return convertFirestoreToAppState(docSnap.data());
    }
    return null;
  } catch (error) {
    console.error("Error loading from Firestore:", error);

    // Check if it's an authentication/API key error
    if (
      error instanceof Error &&
      (error.message.includes("API key") ||
        error.message.includes("permission") ||
        error.message.includes("unauthorized") ||
        error.message.includes("invalid"))
    ) {
      console.warn(
        "Firebase API key appears to be invalid, falling back to localStorage"
      );
    }

    return null;
  }
};

// Save app state to Firestore
export const saveAppStateToFirestore = async (
  state: AppState
): Promise<void> => {
  try {
    const userId = getUserDocumentId();
    const docRef = doc(db, COLLECTION_NAME, userId);
    const firestoreData = convertAppStateToFirestore(state);
    await setDoc(docRef, firestoreData);
    console.log("✅ Saved to Firestore");

    // Clear localStorage since we're now using Firestore
    localStorage.removeItem("life-coach-app-state");
  } catch (error) {
    console.error("❌ Error saving to Firestore:", error);

    // Check if it's an authentication/API key error
    if (
      error instanceof Error &&
      (error.message.includes("API key") ||
        error.message.includes("permission") ||
        error.message.includes("unauthorized") ||
        error.message.includes("invalid"))
    ) {
      console.warn(
        "Firebase API key appears to be invalid, data will be saved locally only"
      );
    }

    throw error;
  }
};

// Listen to real-time changes
export const subscribeToAppState = (
  onStateChange: (state: AppState | null) => void
) => {
  const docRef = doc(db, COLLECTION_NAME, getUserDocumentId());

  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      const state = convertFirestoreToAppState(doc.data());
      onStateChange(state);
    } else {
      onStateChange(null);
    }
  });
};
