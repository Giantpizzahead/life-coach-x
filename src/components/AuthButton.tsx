import React, { useState } from "react";
import { signInWithGoogle, signOutUser } from "../firebase/authService";

interface AuthButtonProps {
  user: any;
  onUserChange: (user: any) => void;
}

const AuthButton: React.FC<AuthButtonProps> = ({ user, onUserChange }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const user = await signInWithGoogle();
      onUserChange(user);
      // Set global userId for Firestore service
      (window as any).userId = user.uid;
    } catch (error) {
      console.error("Sign in failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOutUser();
      onUserChange(null);
      // Clear global userId
      (window as any).userId = null;
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <div className="auth-section">
        <div className="user-info">
          <img src={user.photoURL || ""} alt="User" className="user-avatar" />
          <span className="user-name">{user.displayName || "User"}</span>
        </div>
        <button
          className="auth-button sign-out"
          onClick={handleSignOut}
          disabled={isLoading}>
          {isLoading ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    );
  }

  return (
    <div className="auth-section">
      <button
        className="auth-button sign-in"
        onClick={handleSignIn}
        disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign in with Google"}
      </button>
    </div>
  );
};

export default AuthButton;
