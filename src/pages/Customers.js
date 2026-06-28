import React, { useEffect, useState } from 'react';
import SideDrawer from '../components/SideDrawer';
import ConfirmDialog from '../components/ConfirmDialog';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../services/employeeService';
import styles from './Page.module.css';

const EMPTY = { name: '', mobile: '' };
const FORM_ID = 'customer-form';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    getCustomers()
      .then(setCustomers)
      .catch(() => setError('Failed to load customers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY);
    setError('');
    setDrawerOpen(true);
  };

  const openEdit = (c) => {
    setEditingId(c.id);
    setForm({ name: c.name, mobile: c.mobile || '' });
    setError('');
    setDrawerOpen(true);
  };

  const closeDrawer = () => { setDrawerOpen(false); setError(''); };

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editingId) {
        await updateCustomer(editingId, { name: form.name, mobile: form.mobile });
      } else {
        await createCustomer({ name: form.name, mobile: form.mobile });
      }
      closeDrawer();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    setError('');
    setConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await deleteCustomer(confirmId);
      setConfirmId(null);
      load();
    } catch {
      setError('Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  const customerToDelete = customers.find((c) => c.id === confirmId);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Customers</h1>
          <p className={styles.pageSubtitle}>Manage saved customers for quick billing</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>+ New Customer</button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{customers.length}</span>
          <span className={styles.statLabel}>Customers</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>
            {customers.filter((c) => c.mobile).length}
          </span>
          <span className={styles.statLabel}>With Mobile</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>
            {customers.filter((c) => c.outstandingAmount > 0).length}
          </span>
          <span className={styles.statLabel}>Have Outstanding</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber} style={{ fontSize: 20 }}>
            ₹{customers.reduce((s, c) => s + (c.outstandingAmount || 0), 0).toFixed(2)}
          </span>
          <span className={styles.statLabel}>Total Outstanding</span>
        </div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Mobile</th>
              <th>Outstanding</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  Loading…
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr className={styles.emptyRow}>
                <td colSpan={4}>No customers yet. Click "New Customer" to add one.</td>
              </tr>
            ) : (
              customers.map((c, i) => (
                <tr key={c.id}>
                  <td data-label="#">{i + 1}</td>
                  <td data-label="Name"><strong>{c.name}</strong></td>
                  <td data-label="Mobile">{c.mobile || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                  <td data-label="Outstanding">
                    {c.outstandingAmount > 0 ? (
                      <span style={{ color: '#d97706', fontWeight: 700 }}>
                        ₹{Number(c.outstandingAmount).toFixed(2)}
                        <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 4 }}>({c.unpaidBillsCount} bill{c.unpaidBillsCount !== 1 ? 's' : ''})</span>
                      </span>
                    ) : (
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>Nil</span>
                    )}
                  </td>
                  <td data-label="Actions">
                    <div className={styles.tdActions}>
                      <button className={styles.editBtn} onClick={() => openEdit(c)}>Edit</button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(c.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Side Drawer */}
      <SideDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        title={editingId ? 'Edit Customer' : 'New Customer'}
        formId={FORM_ID}
        saving={saving}
      >
        <form id={FORM_ID} className={styles.drawerForm} onSubmit={handleSubmit}>
          {error && <div className={styles.alertError}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Customer Name *</label>
            <input
              name="name"
              className={styles.fieldInput}
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Ravi Kumar"
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Mobile (optional)</label>
            <input
              name="mobile"
              className={styles.fieldInput}
              value={form.mobile}
              onChange={handleChange}
              placeholder="e.g. 9876543210"
              maxLength={15}
            />
          </div>
        </form>
      </SideDrawer>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!confirmId}
        title="Delete Customer"
        message={`Delete "${customerToDelete?.name}"? This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmId(null)}
        loading={deleting}
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
