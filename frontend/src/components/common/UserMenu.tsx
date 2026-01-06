// frontend/src/components/common/UserMenu.tsx
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import UserProfileModal from "../auth/UserProfileModal";

const UserMenu = () => {
  const { user, logout, getUserInitial } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const handleProfileClick = () => {
    setIsProfileOpen(true);
    setIsOpen(false);
  };

  const userInitial = getUserInitial();
  const userName = user?.full_name || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "";

  return (
    <>
      <div className="user-menu" ref={menuRef}>
        <button
          className="user-button"
          onClick={() => setIsOpen(!isOpen)}
          title={userEmail}
        >
          {user?.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt={userName}
              className="user-avatar-img"
            />
          ) : (
            userInitial
          )}
        </button>

        {isOpen && (
          <div className="user-dropdown">
            <div className="user-dropdown-header">
              <div className="user-dropdown-avatar">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={userName} />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>
              <div className="user-dropdown-info">
                <div className="user-dropdown-name">
                  {userName.charAt(0).toUpperCase() + userName.slice(1)}
                </div>
                <div className="user-dropdown-email">{userEmail}</div>
              </div>
            </div>

            <div className="user-dropdown-divider"></div>

            <button className="user-dropdown-item" onClick={handleProfileClick}>
              <span className="dropdown-icon">👤</span>
              <span>Account Settings</span>
            </button>

            <button className="user-dropdown-item" onClick={() => setIsOpen(false)}>
              <span className="dropdown-icon">⚙️</span>
              <span>Preferences</span>
            </button>

            <button className="user-dropdown-item" onClick={() => setIsOpen(false)}>
              <span className="dropdown-icon">❓</span>
              <span>Help & Support</span>
            </button>

            <div className="user-dropdown-divider"></div>

            <button className="user-dropdown-item danger" onClick={handleLogout}>
              <span className="dropdown-icon">🚪</span>
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>

      <UserProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </>
  );
};

export default UserMenu;