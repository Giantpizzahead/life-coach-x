import React from "react";

interface StatusIndicatorProps {
  isFirebaseAvailable: boolean;
  isSignedIn: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  isFirebaseAvailable,
  isSignedIn,
}) => {
  if (!isFirebaseAvailable) {
    return (
      <div className="status-indicator offline">
        <span className="status-icon">⚠️</span>
        <span className="status-text">Offline Mode - Data saved locally</span>
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="status-indicator online">
        <span className="status-icon">☁️</span>
        <span className="status-text">Synced to cloud</span>
      </div>
    );
  }

  return (
    <div className="status-indicator local">
      <span className="status-icon">💾</span>
      <span className="status-text">Local storage only</span>
    </div>
  );
};

export default StatusIndicator;
