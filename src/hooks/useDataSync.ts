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
  isSaving: boolean;
  updateAppState: (newState: AppState) => Promise<void>;
  clearError: () => void;
}

export const useDataSync = (
  user: User | null,
  authLoading: boolean
): UseDataSyncReturn => {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [saveMethod, setSaveMethod] = useState<SaveMethod>("localStorage");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaving, setShowSaving] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Show saving indicator only after 1 second delay
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isSaving) {
      timeoutId = setTimeout(() => {
        setShowSaving(true);
      }, 1000);
    } else {
      setShowSaving(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isSaving]);

  const updateAppState = useCallback(
    async (newState: AppState) => {
      try {
        setAppState(newState);
        setError(null); // Clear any previous errors

        if (saveMethod === "firebase" && user) {
          setIsSaving(true);
          try {
            await updateAppStateInFirebase(user.uid, newState);
            setIsSaving(false);
          } catch (err) {
            setIsSaving(false);
            console.error("Error updating app state:", err);

            // Check if it's a network error
            if (
              err instanceof Error &&
              (err.message.includes("ERR_INTERNET_DISCONNECTED") ||
                err.message.includes("Failed to fetch") ||
                err.message.includes("NetworkError") ||
                err.message.includes("offline"))
            ) {
              setError(
                "Offline - changes will sync when connection is restored"
              );
            } else {
              setError("Failed to save data. Please check your connection.");
            }
          }
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
      // Don't start loading data until auth state is determined
      if (authLoading) {
        return;
      }

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
  }, [user, authLoading]);

  return {
    appState,
    saveMethod,
    isLoading,
    error,
    isSaving: showSaving,
    updateAppState,
    clearError,
  };
};
