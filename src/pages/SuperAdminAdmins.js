import React, { useEffect, useState } from 'react';
import SideDrawer from '../components/SideDrawer';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from '../services/superAdminService';
import styles from './Page.module.css';

const EMPTY = { name: '', username: '', mobile: '', password: '' };
const FORM_ID = 'admin-form';

export default function SuperAdminAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getAdmins()
      .then(setAdmins)
      .catch(() => setError('Failed to load admins'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY);
    setError('');
    setDrawerOpen(true);
  };

  const openEdit = (admin) => {
    setEditingId(admin.id);
    setForm({ name: admin.name, username: admin.username, mobile: admin.mobile, password: '' });
    setError('');
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setError('');
  };

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editingId) {
        const payload = { name: form.name, username: form.username, mobile: form.mobile };
        if (form.password) payload.password = form.password;
        await updateAdmin(editingId, payload);
      } else {
        await createAdmin(form);
      }
      closeDrawer();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this admin? This cannot be undone.')) return;
    try {
      await deleteAdmin(id);
      load();
    } catch {
      setError('Failed to delete admin');
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admins</h1>
          <p className={styles.pageSubtitle}>Manage administrator accounts</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>+ New Admin</button>
      </div>

      {/* Stat */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{admins.length}</span>
          <span className={styles.statLabel}>Total Admins</span>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Mobile</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading…</td></tr>
            ) : admins.length === 0 ? (
              <tr className={styles.emptyRow}><td colSpan={4}>No admins yet. Click "New Admin" to add one.</td></tr>
            ) : admins.map((a) => (
              <tr key={a.id}>
                <td data-label="Name"><strong>{a.name}</strong></td>
                <td data-label="Username">{a.username}</td>
                <td data-label="Mobile">{a.mobile}</td>
                <td data-label="Actions">
                  <div className={styles.tdActions}>
                    <button className={styles.editBtn} onClick={() => openEdit(a)}>Edit</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(a.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Side Drawer */}
      <SideDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        title={editingId ? 'Edit Admin' : 'New Admin'}
        formId={FORM_ID}
        saving={saving}
      >
        <form id={FORM_ID} className={styles.drawerForm} onSubmit={handleSubmit}>
          {error && <div className={styles.alertError}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Full Name</label>
            <input name="name" className={styles.fieldInput} value={form.name}
              onChange={handleChange} placeholder="Jane Smith" required />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Username</label>
            <input name="username" type="text" className={styles.fieldInput} value={form.username}
              onChange={handleChange} placeholder="e.g. adminone" required />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Mobile Number</label>
            <input name="mobile" type="tel" className={styles.fieldInput} value={form.mobile}
              onChange={handleChange} placeholder="10-digit mobile number" required />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              {editingId ? 'New Password (leave blank to keep current)' : 'Password'}
            </label>
            <input name="password" type="password" className={styles.fieldInput} value={form.password}
              onChange={handleChange} placeholder="••••••••" required={!editingId} />
          </div>
        </form>
      </SideDrawer>
    </div>
  );
}
