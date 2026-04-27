import React, { useEffect, useState } from 'react';
import { getProducts, adjustStock } from '../services/employeeService';
import ProductDropdown from '../components/ProductDropdown';
import CustomSelect from '../components/CustomSelect';
import styles from './Page.module.css';

export default function Stock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState('');
  const [type, setType] = useState('increase');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    getProducts()
      .then(setProducts)
      .catch(() => setError('Failed to load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const qty = Number(quantity);
    if (!productId) return setError('Please select a product.');
    if (!qty || qty <= 0) return setError('Quantity must be a positive number.');

    setSubmitting(true);
    try {
      const result = await adjustStock({ productId, type, quantity: qty });
      const productName = products.find((p) => p.id === productId)?.name ?? 'Product';
      setSuccess(`${productName} stock ${type}d by ${qty}. New stock: ${result.product.stock}`);
      setQuantity('');
      setProductId('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Adjustment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Stock Adjustment</h1>
          <p className={styles.pageSubtitle}>Manually increase or decrease product stock levels</p>
        </div>
      </div>

      {/* Adjust panel */}
      <div className={styles.adjustCard}>
        <h3 className={styles.adjustCardTitle}>Make an Adjustment</h3>

        {error   && <div className={styles.alertError}>{error}</div>}
        {success && <div className={styles.alertSuccess}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.adjustRow}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Product</label>
              <ProductDropdown
                value={productId}
                options={products}
                onChange={setProductId}
                placeholder="— Select a product —"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Type</label>
              <CustomSelect
                value={type}
                onChange={setType}
                options={[
                  { value: 'increase', label: '➕ Increase' },
                  { value: 'decrease', label: '➖ Decrease' }
                ]}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Quantity</label>
              <input
                type="number"
                min="1"
                className={styles.fieldInput}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 10"
                required
              />
            </div>

            <button type="submit" className={styles.adjustSubmitBtn} disabled={submitting}>
              {submitting ? 'Saving…' : 'Adjust Stock'}
            </button>
          </div>
        </form>
      </div>

      {/* Current inventory */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Price (₹)</th>
              <th>Current Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading…</td></tr>
            ) : products.length === 0 ? (
              <tr className={styles.emptyRow}><td colSpan={4}>No products found. Add products first.</td></tr>
            ) : products.map((p) => (
              <tr key={p.id}>
                <td data-label="Product"><strong>{p.name}</strong></td>
                <td data-label="Price (₹)">₹{Number(p.price).toFixed(2)}</td>
                <td data-label="Current Stock">
                  <span className={
                    p.stock === 0 ? styles.stockZero :
                    p.stock < 5  ? styles.stockLow  :
                                   styles.stockOk
                  }>
                    {p.stock}
                  </span>
                </td>
                <td data-label="Status">
                  {p.stock === 0
                    ? <span className={styles.stockZero}>Out of stock</span>
                    : p.stock < 5
                    ? <span className={styles.stockLow}>Low stock</span>
                    : <span className={styles.stockOk}>In stock</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
