import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import styles from './Navbar.module.css';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  employee: 'Employee',
};

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const { shop } = useShop();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
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

      {/* ── Store banner (employee only) ───────────── */}
      {user?.role === 'employee' && shop && (
        <div className={styles.storeBanner}>
          {shop.logo ? (
            <img src={shop.logo} alt={shop.name} className={styles.storeLogo} />
          ) : (
            <div className={styles.storeLogoPlaceholder}>
              {shop.name?.[0]?.toUpperCase() ?? 'S'}
            </div>
          )}
          <div className={styles.storeText}>
            <span className={styles.storeName}>{shop.name}</span>
            <span className={styles.storeAddr}>{shop.address}</span>
          </div>
        </div>
      )}

      <div className={styles.spacer} />

      {/* ── User section ───────────────────────────── */}
      <div className={styles.userSection}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>{initials}</div>
        </div>
        <div className={styles.userMeta}>
          <span className={styles.userName}>{user?.name}</span>
          <span className={styles.roleBadge} data-role={user?.role}>
            {ROLE_LABELS[user?.role] ?? user?.role}
          </span>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout} title="Sign out">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className={styles.logoutText}>Logout</span>
        </button>
      </div>
    </header>
  );
}
