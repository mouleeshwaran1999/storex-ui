import React, { useCallback, useEffect, useState } from 'react';
import SideDrawer from '../components/SideDrawer';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import {
  getEmployeesPaged, createEmployee, updateEmployee, deleteEmployee,
  getStores,
} from '../services/adminService';
import styles from './Page.module.css';

const EMPTY = {
  name: '', username: '', mobile: '', password: '', storeId: '',
  permissions: { products: true, stock: true, billing: true, report: true, customers: true },
};
const PERM_LABELS = [
  { key: 'products',  label: 'Products'  },
  { key: 'stock',     label: 'Stock'     },
  { key: 'billing',   label: 'Billing'   },
  { key: 'report',    label: 'Report'    },
  { key: 'customers', label: 'Customers' },
];
const FORM_ID = 'employee-form';

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getEmployeesPaged(page)
      .then((r) => { setEmployees(r.data); setPagination({ total: r.total, pages: r.pages }); })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  // Load stores once for the drawer dropdown
  useEffect(() => {
    getStores().then(setStores).catch(() => {});
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY);
    setError('');
    setDrawerOpen(true);
  };

  const openEdit = (emp) => {
    setEditingId(emp.id);
    setForm({
      name: emp.name, username: emp.username, mobile: emp.mobile,
      password: '', storeId: emp.storeId || '',
      permissions: {
        products:  emp.permissions?.products  !== false,
        stock:     emp.permissions?.stock     !== false,
        billing:   emp.permissions?.billing   !== false,
        report:    emp.permissions?.report    !== false,
        customers: emp.permissions?.customers !== false,
      },
    });
    setError('');
    setDrawerOpen(true);
  };

  const openCopy = (emp) => {
    // Duplicate row as a new employee — keep name + store, clear unique fields.
    setEditingId(null);
    setForm({
      name: `${emp.name} (copy)`,
      username: '', mobile: '', password: '',
      storeId: emp.storeId || '',
      permissions: {
        products:  emp.permissions?.products  !== false,
        stock:     emp.permissions?.stock     !== false,
        billing:   emp.permissions?.billing   !== false,
        report:    emp.permissions?.report    !== false,
        customers: emp.permissions?.customers !== false,
      },
    });
    setError('');
    setDrawerOpen(true);
  };

  const closeDrawer = () => { setDrawerOpen(false); setError(''); };

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handlePermissionToggle = (key) =>
    setForm((f) => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editingId) {
        const payload = {
          name: form.name, username: form.username, mobile: form.mobile,
          storeId: form.storeId || null,
          permissions: form.permissions,
        };
        if (form.password) payload.password = form.password;
        await updateEmployee(editingId, payload);
      } else {
        await createEmployee({ ...form, storeId: form.storeId || null });
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
      await deleteEmployee(confirmId);
      setConfirmId(null);
      load();
    } catch {
      setError('Failed to delete employee');
    } finally {
      setDeleting(false);
    }
  };

  const employeeToDelete = employees.find((e) => e.id === confirmId);

  const getStoreName = (id) => stores.find((s) => s.id === id)?.name || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Employees</h1>
          <p className={styles.pageSubtitle}>Manage employee accounts and store assignments</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>+ New Employee</button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{pagination.total}</span>
          <span className={styles.statLabel}>Total Employees</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{employees.filter((e) => e.storeId).length}</span>
          <span className={styles.statLabel}>Assigned</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{employees.filter((e) => !e.storeId).length}</span>
          <span className={styles.statLabel}>Unassigned</span>
        </div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Mobile</th>
              <th>Assigned Store</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading…</td></tr>
            ) : employees.length === 0 ? (
              <tr className={styles.emptyRow}><td colSpan={5}>No employees yet. Click "New Employee" to add one.</td></tr>
            ) : employees.map((emp) => (
              <tr key={emp.id}>
                <td data-label="Name"><strong>{emp.name}</strong></td>
                <td data-label="Username">{emp.username}</td>
                <td data-label="Mobile">{emp.mobile}</td>
                <td data-label="Assigned Store">{getStoreName(emp.storeId)}</td>
                <td data-label="Permissions">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {PERM_LABELS.map(({ key, label }) => {
                      const enabled = emp.permissions?.[key] !== false;
                      return (
                        <span key={key} style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 7px',
                          borderRadius: 4,
                          background: enabled ? 'rgba(13,148,136,0.12)' : 'rgba(239,68,68,0.1)',
                          color: enabled ? '#0f766e' : '#b91c1c',
                        }}>{label}</span>
                      );
                    })}
                  </div>
                </td>
                <td data-label="Actions">
                  <div className={styles.tdActions}>
                    <button className={styles.editBtn} onClick={() => openEdit(emp)}>Edit</button>
                    <button className={styles.copyBtn} onClick={() => openCopy(emp)}>Copy</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(emp.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} pages={pagination.pages} total={pagination.total} limit={25} onPageChange={setPage} />
      </div>

      {/* Side Drawer */}
      <SideDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        title={editingId ? 'Edit Employee' : 'New Employee'}
        formId={FORM_ID}
        saving={saving}
      >
        <form id={FORM_ID} className={styles.drawerForm} onSubmit={handleSubmit}>
          {error && <div className={styles.alertError}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Full Name</label>
            <input name="name" className={styles.fieldInput} value={form.name}
              onChange={handleChange} placeholder="John Doe" required />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Username</label>
            <input name="username" type="text" className={styles.fieldInput} value={form.username}
              onChange={handleChange} placeholder="e.g. emp1" required />
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

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Assign to Store</label>
            <select name="storeId" className={styles.fieldSelect} value={form.storeId} onChange={handleChange}>
              <option value="">— No Store (unassigned) —</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.checkGroup}>
            <span className={styles.checkGroupLabel}>Tab Permissions</span>
            <div className={styles.checkList}>
              {PERM_LABELS.map(({ key, label }) => (
                <label key={key} className={styles.checkItem}>
                  <input
                    type="checkbox"
                    checked={!!form.permissions[key]}
                    onChange={() => handlePermissionToggle(key)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </form>
      </SideDrawer>

      <ConfirmDialog
        isOpen={confirmId !== null}
        title="Delete employee?"
        message={
          employeeToDelete
            ? <>This will permanently delete <strong>{employeeToDelete.name}</strong>. This action cannot be undone.</>
            : 'This action cannot be undone.'
        }
        confirmLabel="Delete"
        tone="danger"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setConfirmId(null)}
      />
    </div>
  );
}
