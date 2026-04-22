import React, { useEffect, useState } from 'react';
import SideDrawer from '../components/SideDrawer';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/employeeService';
import styles from './Page.module.css';

const EMPTY = { name: '', price: '', stock: '' };
const FORM_ID = 'product-form';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getProducts()
      .then(setProducts)
      .catch(() => setError('Failed to load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY);
    setError('');
    setDrawerOpen(true);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({ name: p.name, price: p.price, stock: p.stock });
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
      const payload = { name: form.name, price: Number(form.price), stock: Number(form.stock) };
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
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
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
      await deleteProduct(id);
      load();
    } catch {
      setError('Failed to delete product');
    }
  };

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 5).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Products</h1>
          <p className={styles.pageSubtitle}>Manage products in your store</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>+ New Product</button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{products.length}</span>
          <span className={styles.statLabel}>Products</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{totalStock}</span>
          <span className={styles.statLabel}>Total Stock</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber} style={{ color: '#f59e0b' }}>{lowStock}</span>
          <span className={styles.statLabel}>Low Stock</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber} style={{ color: '#ef4444' }}>{outOfStock}</span>
          <span className={styles.statLabel}>Out of Stock</span>
        </div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Price (₹)</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading…</td></tr>
            ) : products.length === 0 ? (
              <tr className={styles.emptyRow}><td colSpan={5}>No products yet. Click "New Product" to add one.</td></tr>
            ) : products.map((p) => (
              <tr key={p.id}>
                <td data-label="Product Name"><strong>{p.name}</strong></td>
                <td data-label="Price (₹)">₹{Number(p.price).toFixed(2)}</td>
                <td data-label="Stock">{p.stock}</td>
                <td data-label="Status">
                  <span className={
                    p.stock === 0 ? styles.stockZero :
                    p.stock < 5  ? styles.stockLow  :
                                   styles.stockOk
                  }>
                    {p.stock === 0 ? 'Out of stock' : p.stock < 5 ? 'Low stock' : 'In stock'}
                  </span>
                </td>
                <td data-label="Actions">
                  <div className={styles.tdActions}>
                    <button className={styles.editBtn} onClick={() => openEdit(p)}>Edit</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(p.id)}>Delete</button>
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
        title={editingId ? 'Edit Product' : 'New Product'}
        formId={FORM_ID}
        saving={saving}
      >
        <form id={FORM_ID} className={styles.drawerForm} onSubmit={handleSubmit}>
          {error && <div className={styles.alertError}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Product Name</label>
            <input name="name" className={styles.fieldInput} value={form.name}
              onChange={handleChange} placeholder="e.g. Basmati Rice 1kg" required />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Selling Price (₹)</label>
            <input name="price" type="number" min="0" step="0.01" className={styles.fieldInput}
              value={form.price} onChange={handleChange} placeholder="0.00" required />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Initial Stock Quantity</label>
            <input name="stock" type="number" min="0" className={styles.fieldInput}
              value={form.stock} onChange={handleChange} placeholder="0" />
          </div>
        </form>
      </SideDrawer>
    </div>
  );
}
