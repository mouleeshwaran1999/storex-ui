import React, { useEffect, useRef, useState } from 'react';
import SideDrawer from '../components/SideDrawer';
import {
  getStores, createStore, updateStore, deleteStore,
  getEmployees,
} from '../services/adminService';
import styles from './Page.module.css';

const EMPTY = { name: '', address: '', gst: '', phone: '', footerNote: '', logo: null, employeeIds: [] };
const FORM_ID = 'store-form';
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB

export default function AdminStores() {
  const [stores, setStores] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const load = () => {
    setLoading(true);
    Promise.all([getStores(), getEmployees()])
      .then(([s, e]) => { setStores(s); setEmployees(e); })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY);
    setError('');
    setDrawerOpen(true);
  };

  const openEdit = (store) => {
    setEditingId(store.id);
    setForm({
      name: store.name,
      address: store.address,
      gst: store.gst,
      phone: store.phone || '',
      footerNote: store.footerNote || '',
      logo: store.logo || null,
      employeeIds: store.employeeIds || [],
    });
    setError('');
    setDrawerOpen(true);
  };

  const closeDrawer = () => { setDrawerOpen(false); setError(''); };

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please upload a valid image file.'); return; }
    if (file.size > MAX_LOGO_BYTES) { setError('Logo must be under 2 MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, logo: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleEmployeeToggle = (id) => {
    setForm((f) => ({
      ...f,
      employeeIds: f.employeeIds.includes(id)
        ? f.employeeIds.filter((eid) => eid !== id)
        : [...f.employeeIds, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editingId) {
        await updateStore(editingId, form);
      } else {
        await createStore(form);
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
    if (!window.confirm('Delete this store? This cannot be undone.')) return;
    try {
      await deleteStore(id);
      load();
    } catch {
      setError('Failed to delete store');
    }
  };

  const getEmpNames = (ids) =>
    employees.filter((e) => ids?.includes(e.id)).map((e) => e.name).join(', ') || '—';

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Stores</h1>
          <p className={styles.pageSubtitle}>Manage store locations and assign employees</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>+ New Store</button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{stores.length}</span>
          <span className={styles.statLabel}>Total Stores</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{employees.length}</span>
          <span className={styles.statLabel}>Employees</span>
        </div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Logo</th>
              <th>Store Name</th>
              <th>Address</th>
              <th>GST</th>
              <th>Employees</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading…</td></tr>
            ) : stores.length === 0 ? (
              <tr className={styles.emptyRow}><td colSpan={6}>No stores yet. Click "New Store" to add one.</td></tr>
            ) : stores.map((s) => (
              <tr key={s.id}>
                <td>
                  {s.logo
                    ? <img src={s.logo} alt={s.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                    : <div style={{ width: 36, height: 36, borderRadius: 8, background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#6366f1' }}>{s.name[0]}</div>
                  }
                </td>
                <td><strong>{s.name}</strong></td>
                <td>{s.address}</td>
                <td><span className={styles.badge}>{s.gst}</span></td>
                <td>{getEmpNames(s.employeeIds)}</td>
                <td>
                  <div className={styles.tdActions}>
                    <button className={styles.editBtn} onClick={() => openEdit(s)}>Edit</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(s.id)}>Delete</button>
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
        title={editingId ? 'Edit Store' : 'New Store'}
        formId={FORM_ID}
        saving={saving}
      >
        <form id={FORM_ID} className={styles.drawerForm} onSubmit={handleSubmit}>
          {error && <div className={styles.alertError}>{error}</div>}

          {/* Logo upload */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Store Logo</label>
            <div
              className={styles.logoUploadArea}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              {form.logo
                ? <img src={form.logo} alt="Logo preview" className={styles.logoPreview} />
                : <div className={styles.logoPlaceholder}>🏪</div>
              }
              <p className={styles.logoUploadLabel}>
                <strong>Click to {form.logo ? 'change' : 'upload'}</strong> logo (JPG/PNG, max 2 MB)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.logoFileInput}
              onChange={handleLogoChange}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Store Name *</label>
            <input name="name" className={styles.fieldInput} value={form.name}
              onChange={handleChange} placeholder="Main Street Shop" required />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Address *</label>
            <input name="address" className={styles.fieldInput} value={form.address}
              onChange={handleChange} placeholder="123 Main St, City" required />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>GST Number *</label>
            <input name="gst" className={styles.fieldInput} value={form.gst}
              onChange={handleChange} placeholder="33AABCS1429B1Z5" required />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Phone</label>
            <input name="phone" className={styles.fieldInput} value={form.phone}
              onChange={handleChange} placeholder="9876543210" />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Invoice Footer Note</label>
            <textarea name="footerNote" className={styles.fieldTextarea} value={form.footerNote}
              onChange={handleChange} placeholder="Thank you for shopping with us!" />
          </div>

          {/* Employee assignment */}
          <div className={styles.checkGroup}>
            <span className={styles.checkGroupLabel}>Assign Employees</span>
            <div className={styles.checkList}>
              {employees.length === 0
                ? <span className={styles.checkEmpty}>No employees available. Add employees first.</span>
                : employees.map((emp) => (
                  <label key={emp.id} className={styles.checkItem}>
                    <input
                      type="checkbox"
                      checked={form.employeeIds.includes(emp.id)}
                      onChange={() => handleEmployeeToggle(emp.id)}
                    />
                    {emp.name} — {emp.email}
                  </label>
                ))
              }
            </div>
          </div>
        </form>
      </SideDrawer>
    </div>
  );
}
