import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import styles from './Navbar.module.css';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  employee: 'Employee',
};

/**
 * Navbar — Top navigation bar with profile dropdown
 * 
 * Features:
 * - Brand logo
 * - User profile section (avatar + name + role)
 * - Profile dropdown (Change Password, Logout)
 * - Hamburger menu for mobile
 * 
 * Store name has been moved to sidebar (see Layout.js)
 */
export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Profile dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const handleChangePassword = () => {
    setDropdownOpen(false);
    setPasswordModalOpen(true);
  };

  return (
    <>
      <header className={styles.navbar}>
        {/* ── Hamburger Menu (Mobile/Tablet) ─────────── */}
        {onMenuToggle && (
          <button 
            className={styles.hamburger} 
            onClick={onMenuToggle}
            aria-label="Toggle navigation"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        )}

        {/* ── Brand ─────────────────────────────────── */}
        <div className={styles.brand}>
          <div className={styles.logoMark}>S</div>
          <span className={styles.brandName}>Storex</span>
        </div>

        <div className={styles.spacer} />

        {/* ── User Profile Section with Dropdown ───────── */}
        <div className={styles.userSection} ref={dropdownRef}>
          <button 
            className={styles.profileBtn}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className={styles.avatarWrap}>
              <div className={styles.avatar}>{initials}</div>
            </div>
            <div className={styles.userMeta}>
              <span className={styles.userName}>{user?.name}</span>
              <span className={styles.roleBadge} data-role={user?.role}>
                {ROLE_LABELS[user?.role] ?? user?.role}
              </span>
            </div>
            {/* Dropdown chevron */}
            <svg 
              className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`}
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none"
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {/* Profile Dropdown Menu */}
          {dropdownOpen && (
            <div className={styles.dropdown}>
              <button 
                className={styles.dropdownItem}
                onClick={handleChangePassword}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <span>Change Password</span>
              </button>
              <div className={styles.dropdownDivider} />
              <button 
                className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                onClick={handleLogout}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </>
  );
}
