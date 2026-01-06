// frontend/src/components/auth/UserProfileModal.tsx
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/Modal.css";
import "../../styles/LoginForm.css";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal = ({ isOpen, onClose }: UserProfileModalProps) => {
  const { user, updateProfile, changePassword, isLoading, error, clearError } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  
  // Profile form state
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [profileSuccess, setProfileSuccess] = useState(false);
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  if (!isOpen || !user) return null;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setProfileSuccess(false);
    
    try {
      await updateProfile({ full_name: fullName, avatar_url: avatarUrl || null });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {
      // Error handled by hook
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch {
      // Error handled by hook
    }
  };

  const isOAuthUser = !!user.oauth_provider && !user.oauth_provider;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-profile" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Account Settings</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          <button
            className={`profile-tab ${activeTab === "password" ? "active" : ""}`}
            onClick={() => setActiveTab("password")}
            disabled={isOAuthUser}
            title={isOAuthUser ? "Password managed by OAuth provider" : ""}
          >
            Password
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="auth-error">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
              <button className="error-dismiss" onClick={clearError}>×</button>
            </div>
          )}

          {activeTab === "profile" && (
            <form onSubmit={handleProfileSubmit} className="profile-form">
              {profileSuccess && (
                <div className="success-banner">
                  ✓ Profile updated successfully
                </div>
              )}

              {/* Avatar Preview */}
              <div className="avatar-section">
                <div className="avatar-preview">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" />
                  ) : (
                    <span>{user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="avatar-info">
                  <h4>{user.full_name || user.email.split("@")[0]}</h4>
                  <p>{user.email}</p>
                  {user.oauth_provider && (
                    <span className="oauth-badge">
                      {user.oauth_provider === "google" ? "🔵" : "⚫"} 
                      Connected via {user.oauth_provider}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Avatar URL</label>
                <input
                  className="form-input"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  disabled={isLoading}
                />
                <span className="form-hint">Enter a URL to an image for your profile picture</span>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={user.email}
                  disabled
                />
                <span className="form-hint">Email cannot be changed</span>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "password" && (
            <form onSubmit={handlePasswordSubmit} className="profile-form">
              {passwordSuccess && (
                <div className="success-banner">
                  ✓ Password changed successfully
                </div>
              )}

              {isOAuthUser ? (
                <div className="oauth-password-notice">
                  <span className="notice-icon">ℹ️</span>
                  <p>
                    Your account is connected via {user.oauth_provider}. 
                    Password management is handled by your OAuth provider.
                  </p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input
                      className="form-input"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input
                      className="form-input"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      className={`form-input ${confirmPassword && newPassword !== confirmPassword ? 'error' : ''}`}
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      disabled={isLoading}
                      required
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <span className="field-error">Passwords do not match</span>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={onClose}>
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      disabled={isLoading || !currentPassword || !newPassword || newPassword !== confirmPassword}
                    >
                      {isLoading ? "Changing..." : "Change Password"}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;