import React, { useEffect, useState, useCallback } from 'react';
import { getProducts, createBill, getBills } from '../services/employeeService';
import { useShop } from '../context/ShopContext';
import BillPreview from '../components/BillPreview';
import styles from './Page.module.css';

export default function Billing() {
  const { shop } = useShop();

  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([{ productId: '', quantity: 1 }]);
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cartError, setCartError] = useState('');
  const [previewBill, setPreviewBill] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadProducts = useCallback(() => {
    getProducts().then(setProducts).catch(() => {});
  }, []);

  const loadHistory = useCallback(() => {
    setLoadingHistory(true);
    getBills().then(setHistory).catch(() => {}).finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    loadProducts();
    loadHistory();
  }, [loadProducts, loadHistory]);

  const addRow = () => setCartItems((p) => [...p, { productId: '', quantity: 1 }]);

  const updateRow = (idx, field, value) =>
    setCartItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });

  const removeRow = (idx) => {
    if (cartItems.length === 1) return;
    setCartItems((p) => p.filter((_, i) => i !== idx));
  };

  const getRowSubtotal = (item) => {
    const p = products.find((x) => x.id === item.productId);
    return p ? p.price * Number(item.quantity || 0) : 0;
  };

  const getTotal = () => cartItems.reduce((s, i) => s + getRowSubtotal(i), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCartError('');
    const validItems = cartItems.filter((i) => i.productId && Number(i.quantity) > 0);
    if (!validItems.length) return setCartError('Add at least one item to the bill.');
    setSubmitting(true);
    try {
      const bill = await createBill({
        customerName: customerName.trim() || 'Walk-in Customer',
        items: validItems.map((i) => ({ productId: i.productId, quantity: Number(i.quantity) })),
      });
      setPreviewBill(bill);
      setCartItems([{ productId: '', quantity: 1 }]);
      setCustomerName('');
      loadProducts();
      loadHistory();
    } catch (err) {
      setCartError(err.response?.data?.message || 'Failed to create bill');
    } finally {
      setSubmitting(false);
    }
  };

  const fmtDate = (iso) =>
    new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Billing</h1>
          <p className={styles.pageSubtitle}>Create bills and view transaction history</p>
        </div>
      </div>

      {shop && (
        <div className={styles.shopBanner}>
          {shop.logo && (
            <img src={shop.logo} alt={shop.name}
              style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
          )}
          <span>
            <strong>{shop.name}</strong> &nbsp;x&nbsp; {shop.address}
            &nbsp;x&nbsp; GST: {shop.gst}
            {shop.phone && (' | ' + shop.phone)}
          </span>
        </div>
      )}

      <div className={styles.cartSection}>
        <h3 className={styles.cartSectionTitle}>New Bill</h3>
        {cartError && <div className={styles.alertError}>{cartError}</div>}
        <form onSubmit={handleSubmit}>
          <div className={styles.field} style={{ marginBottom: 20, maxWidth: 340 }}>
            <label className={styles.fieldLabel}>Customer Name (optional)</label>
            <input type="text" className={styles.fieldInput} value={customerName}
              onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in Customer" />
          </div>

          {cartItems.map((item, idx) => {
            const product = products.find((p) => p.id === item.productId);
            return (
              <div key={idx} className={styles.cartRow}>
                <select className={styles.cartSelect} value={item.productId}
                  onChange={(e) => updateRow(idx, 'productId', e.target.value)} required>
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - Rs.{Number(p.price).toFixed(2)} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
                <input type="number" min="1" max={product ? product.stock : 9999}
                  value={item.quantity} onChange={(e) => updateRow(idx, 'quantity', e.target.value)}
                  placeholder="Qty" required />
                <span className={styles.cartSubtotal}>Rs.{getRowSubtotal(item).toFixed(2)}</span>
                <button type="button" className={styles.removeRowBtn}
                  onClick={() => removeRow(idx)} title="Remove row">x</button>
              </div>
            );
          })}

          <button type="button" className={styles.addItemBtn} onClick={addRow}>+ Add Item</button>
          <div className={styles.totalRow}>Total: Rs.{getTotal().toFixed(2)}</div>
          <div style={{ marginTop: 20 }}>
            <button type="submit" className={styles.addBtn} disabled={submitting}>
              {submitting ? 'Creating...' : 'Submit Bill'}
            </button>
          </div>
        </form>
      </div>

      {previewBill && (
        <BillPreview bill={previewBill} onClose={() => setPreviewBill(null)} />
      )}

      <div className={styles.tableCard} style={{ marginTop: 32 }}>
        <div className={styles.historyHeader}>
          <span className={styles.historyTitle}>Billing History</span>
          <span className={styles.historyCount}>
            {history.length} transaction{history.length !== 1 ? 's' : ''}
          </span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Bill ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingHistory ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading...</td></tr>
            ) : history.length === 0 ? (
              <tr className={styles.emptyRow}>
                <td colSpan={6}>No bills yet. Create your first bill above.</td>
              </tr>
            ) : (
              [...history].reverse().map((bill) => (
                <tr key={bill.id}>
                  <td data-label="Bill ID"><code className={styles.billIdBadge}>{bill.id}</code></td>
                  <td data-label="Customer">{bill.customerName}</td>
                  <td data-label="Items"><span className={styles.badge}>{bill.items.length}</span></td>
                  <td data-label="Total"><strong>Rs.{Number(bill.total).toFixed(2)}</strong></td>
                  <td data-label="Date" style={{ color: 'var(--gray-500)', fontSize: 13 }}>{fmtDate(bill.createdAt)}</td>
                  <td data-label="Actions">
                    <div className={styles.tdActions}>
                      <button className={styles.editBtn} onClick={() => setPreviewBill(bill)}>
                        View Bill
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
