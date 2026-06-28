import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { changePasswordRequest, updateProfile } from '../services/authService';
import styles from './Navbar.module.css';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  employee: 'Employee',
};

// ── Profile modal ────────────────────────────────────────────────────────────
function ProfileModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    mobile: user?.mobile || '',
    profilePhoto: user?.profilePhoto || null,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef(null);

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) { setError('Please upload a valid image file.'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('Photo must be under 2 MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, profilePhoto: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    try {
      const updated = await updateProfile({
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        profilePhoto: form.profilePhoto,
      });
      onSaved(updated);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.profileModal} role="dialog" aria-modal="true">
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Edit Profile</span>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {success ? (
          <div className={styles.modalBody}>
            <div className={styles.successMsg}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
                stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
              </svg>
              <p>Profile updated successfully!</p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnPrimary} onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.modalBody}>
              <div className={styles.photoSection}>
                <div className={styles.photoWrap}
                  onClick={() => fileRef.current?.click()} title="Click to change photo">
                  {form.profilePhoto ? (
                    <img src={form.profilePhoto} alt="Profile" className={styles.profilePhotoImg} />
                  ) : (
                    <div className={styles.photoInitials}>{initials}</div>
                  )}
                  <div className={styles.photoOverlay}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*"
                  style={{ display: 'none' }} onChange={handlePhotoChange} />
                <div className={styles.photoMeta}>
                  <span className={styles.photoName}>{form.name || user?.name}</span>
                  <span className={styles.photoHint}>Click photo to change · Max 2 MB</span>
                  {form.profilePhoto && (
                    <button
                      type="button"
                      className={styles.removePhotoLink}
                      onClick={() => setForm((f) => ({ ...f, profilePhoto: null }))}
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.profileInfo}>
                <span className={styles.profileInfoItem}>
                  <span className={styles.profileInfoLabel}>Username</span>
                  <span className={styles.profileInfoValue}>{user?.username}</span>
                </span>
                <span className={styles.profileInfoItem}>
                  <span className={styles.profileInfoLabel}>Role</span>
                  <span className={styles.profileInfoValue}>{ROLE_LABELS[user?.role] ?? user?.role}</span>
                </span>
              </div>

              {error && <div className={styles.alertError}>{error}</div>}

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Name</label>
                <input type="text" className={styles.fieldInput}
                  value={form.name} required autoFocus
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Mobile</label>
                <input type="text" className={styles.fieldInput}
                  value={form.mobile} placeholder="Phone number"
                  onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancel</button>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Change-password modal ────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.next !== form.confirm) {
      setError('New passwords do not match.');
      return;
    }
    if (form.next.length < 4) {
      setError('New password must be at least 4 characters.');
      return;
    }
    setSaving(true);
    try {
      await changePasswordRequest(form.current, form.next);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Change Password</span>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {success ? (
          <div className={styles.modalBody}>
            <div className={styles.successMsg}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
              </svg>
              <p>Password changed successfully!</p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnPrimary} onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.modalBody}>
              {error && <div className={styles.alertError}>{error}</div>}

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Current Password</label>
                <input
                  type="password"
                  name="current"
                  className={styles.fieldInput}
                  value={form.current}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>New Password</label>
                <input
                  type="password"
                  name="next"
                  className={styles.fieldInput}
                  value={form.next}
                  onChange={handleChange}
                  required
                  minLength={4}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Confirm New Password</label>
                <input
                  type="password"
                  name="confirm"
                  className={styles.fieldInput}
                  value={form.confirm}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondary} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? 'Saving…' : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Main Navbar ──────────────────────────────────────────────────────────────
export default function Navbar({ onMenuToggle }) {
  const { user, logout, updateUser } = useAuth();
  const { shop } = useShop();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openChangePw = () => {
    setMenuOpen(false);
    setShowChangePw(true);
  };

  const openProfile = () => {
    setMenuOpen(false);
    setShowProfile(true);
  };

  const handleProfileSaved = (updated) => {
    updateUser({ ...user, name: updated.name, mobile: updated.mobile, profilePhoto: updated.profilePhoto });
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <header className={styles.navbar}>
        {/* ── Hamburger Menu ──────────────────────────── */}
        {onMenuToggle && (
          <button className={styles.hamburger} onClick={onMenuToggle} aria-label="Toggle navigation">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        )}

        {/* ── Brand ───────────────────────────────────── */}
        <div className={styles.brand}>
          <div className={styles.logoMark}>S</div>
          <span className={styles.brandName}>Storex</span>
        </div>

        {/* ── Store banner (employee only) ─────────────── */}
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

        {/* ── User section + Settings dropdown ─────────── */}
        <div className={styles.userSection}>
          <div className={styles.avatarWrap}>
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt={user.name} className={styles.avatarPhoto} />
            ) : (
              <div className={styles.avatar}>{initials}</div>
            )}
          </div>
          <div className={styles.userMeta}>
            <span className={styles.userName}>{user?.name}</span>
            <span className={styles.roleBadge} data-role={user?.role}>
              {ROLE_LABELS[user?.role] ?? user?.role}
            </span>
          </div>

          {/* Settings gear + dropdown */}
          <div className={styles.settingsWrap} ref={menuRef}>
            <button
              className={styles.settingsBtn}
              onClick={() => setMenuOpen((o) => !o)}
              title="Settings"
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83
                  2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33
                  1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09
                  A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06
                  a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15
                  a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09
                  A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06
                  a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68
                  a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09
                  a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06
                  a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9
                  a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09
                  a1.65 1.65 0 00-1.51 1z"/>
              </svg>
            </button>

            {menuOpen && (
              <div className={styles.dropdownMenu}>
                <button className={styles.dropdownItem} onClick={openProfile}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Edit Profile
                </button>
                <button className={styles.dropdownItem} onClick={openChangePw}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  Change Password
                </button>
                <div className={styles.dropdownDivider} />
                <button className={styles.dropdownItemDanger} onClick={handleLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
      {showProfile && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} onSaved={handleProfileSaved} />
      )}
    </>
  );
}
