import { useState, useEffect, useCallback } from "react";
import type { User } from "firebase/auth";
import type { AppState } from "../types/TodoItem";
import {
  loadAppStateFromFirebase,
  saveAppStateToFirebase,
  updateAppStateInFirebase,
} from "../utils/firebaseUtils";
import { loadAppState, saveAppState } from "../utils/todoUtils";

export type SaveMethod = "localStorage" | "firebase";

interface UseDataSyncReturn {
  appState: AppState | null;
  saveMethod: SaveMethod;
  isLoading: boolean;
  error: string | null;
  updateAppState: (newState: AppState) => Promise<void>;
  clearError: () => void;
}

export const useDataSync = (user: User | null): UseDataSyncReturn => {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [saveMethod, setSaveMethod] = useState<SaveMethod>("localStorage");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateAppState = useCallback(
    async (newState: AppState) => {
      try {
        setAppState(newState);

        if (saveMethod === "firebase" && user) {
          await updateAppStateInFirebase(user.uid, newState);
        } else {
          saveAppState(newState);
        }
      } catch (err) {
        console.error("Error updating app state:", err);
        setError("Failed to save data. Please check your connection.");
      }
    },
    [saveMethod, user]
  );

  // Initialize data based on auth state
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (user) {
          // User is signed in - try to load from Firebase
          const firebaseData = await loadAppStateFromFirebase(user.uid);

          if (firebaseData) {
            // Scenario 2: User signed in with existing Firebase data
            setAppState(firebaseData);
            setSaveMethod("firebase");
            // Clear localStorage since we're now using Firebase
            localStorage.removeItem("life-coach-app-state");
          } else {
            // Scenario 3: User signed in but no Firebase data - migrate from localStorage
            const localData = loadAppState();

            if (localData) {
              // Migrate localStorage data to Firebase
              await saveAppStateToFirebase(user.uid, localData);
              setAppState(localData);
              setSaveMethod("firebase");
              // Clear localStorage after successful migration
              localStorage.removeItem("life-coach-app-state");
            } else {
              // No data anywhere - will be initialized by parent component
              setAppState(null);
              setSaveMethod("firebase");
            }
          }
        } else {
          // Scenario 1: User not signed in - use localStorage
          const localData = loadAppState();
          setAppState(localData);
          setSaveMethod("localStorage");
        }
      } catch (err) {
        console.error("Error initializing data:", err);
        setError("Failed to load data. Please check your connection.");

        // Fallback to localStorage if Firebase fails
        if (user) {
          const localData = loadAppState();
          setAppState(localData);
          setSaveMethod("localStorage");
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [user]);

  return {
    appState,
    saveMethod,
    isLoading,
    error,
    updateAppState,
    clearError,
  };
};
