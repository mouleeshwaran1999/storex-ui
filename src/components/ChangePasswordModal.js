import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../services/axios';
import styles from './ChangePasswordModal.module.css';

/**
 * ChangePasswordModal — Modal for changing user password
 * 
 * UX Flow:
 * 1. User enters current password, new password, and confirmation
 * 2. Validates that new passwords match
 * 3. On success: shows success message, logs out user, redirects to login
 * 
 * Available for ALL roles: Super Admin, Admin, Employee
 */
export default function ChangePasswordModal({ isOpen, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.currentPassword) {
      setError('Current password is required');
      return;
    }

    if (!formData.newPassword) {
      setError('New password is required');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirm password must match');
      return;
    }

    if (formData.newPassword.length < 4) {
      setError('New password must be at least 4 characters');
      return;
    }

    setLoading(true);

    try {
      // Call backend API to change password
      await axiosInstance.put('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      // Show success message
      setSuccess(true);
      
      // Wait 1.5 seconds, then logout and redirect
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !success) {
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className={styles.overlay} onClick={handleClose} />

      {/* Modal */}
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        {/* Header */}
        <div className={styles.header}>
          <h2 id="modal-title" className={styles.title}>Change Password</h2>
          <button 
            className={styles.closeBtn} 
            onClick={handleClose}
            aria-label="Close"
            disabled={loading || success}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {success ? (
            <div className={styles.successMessage}>
              <svg className={styles.successIcon} width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p className={styles.successText}>Password changed successfully!</p>
              <p className={styles.successSubtext}>Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              {error && (
                <div className={styles.errorAlert}>{error}</div>
              )}

              {/* Current Password */}
              <div className={styles.field}>
                <label htmlFor="currentPassword" className={styles.label}>
                  Current Password *
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Enter current password"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              {/* New Password */}
              <div className={styles.field}>
                <label htmlFor="newPassword" className={styles.label}>
                  New Password *
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Enter new password"
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              {/* Confirm Password */}
              <div className={styles.field}>
                <label htmlFor="confirmPassword" className={styles.label}>
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Re-enter new password"
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              {/* Footer Actions */}
              <div className={styles.footer}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
