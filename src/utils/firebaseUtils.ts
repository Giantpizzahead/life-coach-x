import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { AppState } from "../types/TodoItem";

// Convert AppState to Firestore-compatible format
export const serializeAppState = (state: AppState) => {
  return {
    ...state,
    lastResetDate: state.lastResetDate.toISOString(),
    todos: state.todos.map((todo) => ({
      ...todo,
      history: todo.history.map((entry) => ({
        ...entry,
        date: entry.date.toISOString(),
      })),
    })),
    updatedAt: serverTimestamp(),
  };
};

// Convert Firestore data back to AppState
export const deserializeAppState = (data: any): AppState => {
  return {
    ...data,
    lastResetDate: new Date(data.lastResetDate),
    todos: data.todos.map((todo: any) => ({
      ...todo,
      history: todo.history.map((entry: any) => ({
        ...entry,
        date: new Date(entry.date),
      })),
    })),
  };
};

// Load app state from Firebase
export const loadAppStateFromFirebase = async (
  userId: string
): Promise<AppState | null> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      return deserializeAppState(data);
    }

    return null;
  } catch (error) {
    console.error("Error loading app state from Firebase:", error);
    throw error;
  }
};

// Save app state to Firebase
export const saveAppStateToFirebase = async (
  userId: string,
  state: AppState
): Promise<void> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const serializedState = serializeAppState(state);

    await setDoc(userDocRef, serializedState, { merge: true });
  } catch (error) {
    console.error("Error saving app state to Firebase:", error);
    throw error;
  }
};

// Update app state in Firebase (for real-time updates)
export const updateAppStateInFirebase = async (
  userId: string,
  state: AppState
): Promise<void> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const serializedState = serializeAppState(state);

    await updateDoc(userDocRef, {
      ...serializedState,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating app state in Firebase:", error);
    throw error;
  }
};
