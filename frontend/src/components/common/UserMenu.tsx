import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../../store/authSlice";

const UserMenu = () => {
  const { userEmail, logout, getUserInitial } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
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

  const userInitial = getUserInitial();
  const userName = userEmail?.split("@")[0] || "User";

  return (
    <div className="user-menu" ref={menuRef}>
      <button 
        className="user-button" 
        onClick={() => setIsOpen(!isOpen)}
        title={userEmail}
      >
        {userInitial}
      </button>

      {isOpen && (
        <div className="user-dropdown">
          <div className="user-dropdown-header">
            <div className="user-dropdown-name">
              {userName.charAt(0).toUpperCase() + userName.slice(1)}
            </div>
            <div className="user-dropdown-email">{userEmail}</div>
          </div>
          
          <button className="user-dropdown-item" onClick={() => setIsOpen(false)}>
            <span>👤</span>
            <span>Profile</span>
          </button>
          
          <button className="user-dropdown-item" onClick={() => setIsOpen(false)}>
            <span>⚙️</span>
            <span>Settings</span>
          </button>
          
          <button className="user-dropdown-item danger" onClick={handleLogout}>
            <span>🚪</span>
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;