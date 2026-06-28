import React, { useCallback, useEffect, useState } from 'react';
import { getProducts, getProductsPaged, adjustStock } from '../services/employeeService';
import Pagination from '../components/Pagination';
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
  const [stockList, setStockList] = useState([]);
  const [stockPage, setStockPage] = useState(1);
  const [stockPagination, setStockPagination] = useState({ total: 0, pages: 0 });
  const [stockListLoading, setStockListLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getProducts()
      .then(setProducts)
      .catch(() => setError('Failed to load products'))
      .finally(() => setLoading(false));
  };

  const loadStockList = useCallback(() => {
    setStockListLoading(true);
    getProductsPaged(stockPage)
      .then((r) => { setStockList(r.data); setStockPagination({ total: r.total, pages: r.pages }); })
      .catch(() => {})
      .finally(() => setStockListLoading(false));
  }, [stockPage]);

  useEffect(() => { load(); }, []);
  useEffect(() => { loadStockList(); }, [loadStockList]);

  const selectedProduct = products.find((p) => String(p.id) === String(productId));
  const previewQty = Number(quantity || 0);
  const afterStock = selectedProduct
    ? type === 'increase'
      ? selectedProduct.stock + previewQty
      : selectedProduct.stock - previewQty
    : null;

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
      loadStockList();
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
        <div className={styles.adjustCardHeader}>
          <div>
            <h3 className={styles.adjustCardTitle}>Make an Adjustment</h3>
            <p className={styles.adjustCardSubtitle}>Update inventory levels manually — changes are logged for audit</p>
          </div>
        </div>

        {error   && <div className={styles.alertError}>{error}</div>}
        {success && <div className={styles.alertSuccess}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.adjustGrid}>
            {/* ── Left: controls ── */}
            <div className={styles.adjustControls}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Product</label>
                <select
                  className={styles.fieldSelect}
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  required
                >
                  <option value="">— Select a product —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} • Stock: {p.stock}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Adjustment Type</label>
                <div className={styles.typeToggle}>
                  <button
                    type="button"
                    className={`${styles.typeBtn} ${type === 'increase' ? styles.typeBtnIncrease : ''}`}
                    onClick={() => setType('increase')}
                  >
                    ↑ Increase
                  </button>
                  <button
                    type="button"
                    className={`${styles.typeBtn} ${type === 'decrease' ? styles.typeBtnDecrease : ''}`}
                    onClick={() => setType('decrease')}
                  >
                    ↓ Decrease
                  </button>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Quantity</label>
                <input
                  type="number"
                  min="1"
                  className={styles.fieldInput}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  required
                />
                <div className={styles.qtyPresets}>
                  {[1, 5, 10, 25, 50, 100].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={styles.qtyPresetBtn}
                      onClick={() => setQuantity(String(n))}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className={`${styles.adjustSubmitBtn} ${type === 'decrease' ? styles.adjustSubmitBtnDecrease : ''}`}
                disabled={submitting}
              >
                {submitting ? 'Saving…' : type === 'increase' ? '↑ Add Stock' : '↓ Remove Stock'}
              </button>
            </div>

            {/* ── Right: product preview ── */}
            {selectedProduct ? (
              <div className={styles.adjustPreview}>
                <span className={styles.adjustPreviewLabel}>Selected Product</span>
                <div className={styles.adjustPreviewName}>{selectedProduct.name}</div>

                <div className={styles.adjustPreviewRow}>
                  <span>Current Stock</span>
                  <strong className={
                    selectedProduct.stock === 0 ? styles.stockZero :
                    selectedProduct.stock < 5  ? styles.stockLow  : styles.stockOk
                  }>{selectedProduct.stock}</strong>
                </div>

                {previewQty > 0 && (
                  <div className={styles.adjustPreviewRow}>
                    <span>After Adjustment</span>
                    <strong className={
                      afterStock <= 0 ? styles.stockZero :
                      afterStock < 5  ? styles.stockLow  : styles.stockOk
                    }>
                      {afterStock < 0 ? '⚠ Insufficient' : afterStock}
                    </strong>
                  </div>
                )}

                <div className={styles.adjustPreviewRow}>
                  <span>Price</span>
                  <span>₹{Number(selectedProduct.price).toFixed(2)}</span>
                </div>

                {Number(selectedProduct.gstPercent) > 0 && (
                  <div className={styles.adjustPreviewRow}>
                    <span>GST</span>
                    <span>{Number(selectedProduct.gstPercent).toFixed(2)}%</span>
                  </div>
                )}

                <div className={`${styles.adjustPreviewStatus} ${
                  selectedProduct.stock === 0 ? styles.adjustPreviewStatusDanger :
                  selectedProduct.stock < 5  ? styles.adjustPreviewStatusWarn   :
                                               styles.adjustPreviewStatusOk
                }`}>
                  {selectedProduct.stock === 0 ? 'Out of Stock' :
                   selectedProduct.stock < 5  ? 'Low Stock'    : 'In Stock'}
                </div>
              </div>
            ) : (
              <div className={styles.adjustPreviewEmpty}>
                Select a product to preview stock details
              </div>
            )}
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
            {stockListLoading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading…</td></tr>
            ) : stockList.length === 0 ? (
              <tr className={styles.emptyRow}><td colSpan={4}>No products found. Add products first.</td></tr>
            ) : stockList.map((p) => (
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
        <Pagination page={stockPage} pages={stockPagination.pages} total={stockPagination.total} limit={25} onPageChange={setStockPage} />
      </div>
    </div>
  );
}
