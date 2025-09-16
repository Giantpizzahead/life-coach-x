import React from "react";
import { useAuth } from "../contexts/AuthContext";
import type { SaveMethod } from "../hooks/useDataSync";

interface StatusIndicatorProps {
  saveMethod: SaveMethod;
  isLoading?: boolean;
  error?: string | null;
  isSaving?: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  saveMethod,
  isLoading = false,
  error = null,
  isSaving = false,
}) => {
  const {
    user,
    signInWithGoogle,
    signOutUser,
    loading: authLoading,
  } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Sign in failed:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const getStatusColor = () => {
    if (error) return "#ff4444";
    if (isSaving) return "#ffaa00";
    if (isLoading || authLoading) return "#ffaa00";
    if (saveMethod === "firebase") return "#44ff44";
    return "#888888";
  };

  const getStatusText = () => {
    if (error) return "Error";
    if (isSaving) return "Saving...";
    if (isLoading || authLoading) return "Loading...";
    if (saveMethod === "firebase") return "Cloud Sync";
    return "Local Only";
  };

  return (
    <div className="status-indicator">
      <div className="status-row">
        <div className="status-left">
          <div
            className="status-dot"
            style={{ backgroundColor: getStatusColor() }}
          />
          <span className="status-text">{getStatusText()}</span>
          {error && (
            <span className="error-text" title={error}>
              ⚠️
            </span>
          )}
        </div>

        <div className="status-right">
          {user ? (
            <div className="user-info">
              <div className="user-profile">
                <img
                  src={user.photoURL || ""}
                  alt="Profile"
                  className="profile-image"
                  onError={(e) => {
                    // Hide image if it fails to load
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className="user-name">
                  {user.displayName || user.email}
                </span>
              </div>
              <button
                className="sign-out-btn"
                onClick={handleSignOut}
                disabled={authLoading}>
                Sign Out
              </button>
            </div>
          ) : (
            <button
              className="sign-in-btn"
              onClick={handleSignIn}
              disabled={authLoading}>
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusIndicator;
