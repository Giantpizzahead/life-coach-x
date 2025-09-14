import { doc, getDoc, setDoc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "./config";
import type { AppState } from "../types/TodoItem";

const COLLECTION_NAME = "users";
const DOCUMENT_ID = "default-user"; // For now, using a single user

// Convert Firestore data to AppState
const convertFirestoreToAppState = (data: any): AppState => {
  return {
    hp: data.hp || 1000,
    todos: data.todos || [],
    sections: data.sections || [],
    lastResetDate: data.lastResetDate?.toDate() || new Date(),
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
        date: Timestamp.fromDate(entry.date),
      })),
    })),
    sections: state.sections,
    lastResetDate: Timestamp.fromDate(state.lastResetDate),
  };
};

// Load app state from Firestore
export const loadAppStateFromFirestore = async (): Promise<AppState | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return convertFirestoreToAppState(docSnap.data());
    }
    return null;
  } catch (error) {
    console.error("Error loading from Firestore:", error);
    return null;
  }
};

// Save app state to Firestore
export const saveAppStateToFirestore = async (
  state: AppState
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    const firestoreData = convertAppStateToFirestore(state);
    await setDoc(docRef, firestoreData);
  } catch (error) {
    console.error("Error saving to Firestore:", error);
    throw error;
  }
};

// Listen to real-time changes
export const subscribeToAppState = (
  onStateChange: (state: AppState | null) => void
) => {
  const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);

  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      const state = convertFirestoreToAppState(doc.data());
      onStateChange(state);
    } else {
      onStateChange(null);
    }
  });
};
