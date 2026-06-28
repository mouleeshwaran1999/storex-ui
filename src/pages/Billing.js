import React, { useEffect, useState, useCallback } from 'react';
import { getProducts, createBill, getBillsPaged, getCustomers, payBill } from '../services/employeeService';
import { useShop } from '../context/ShopContext';
import BillPreview from '../components/BillPreview';
import Pagination from '../components/Pagination';
import styles from './Page.module.css';

export default function Billing() {
  const { shop } = useShop();

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cartItems, setCartItems] = useState([{ productId: '', quantity: 1 }]);
  const [walkIn, setWalkIn] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paidNow, setPaidNow] = useState(true);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [cartError, setCartError] = useState('');
  const [previewBill, setPreviewBill] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState({ total: 0, pages: 0 });
  const [historySearch, setHistorySearch] = useState('');
  const [payingBillId, setPayingBillId] = useState(null);

  const loadProducts = useCallback(() => {
    getProducts().then(setProducts).catch(() => {});
  }, []);

  const loadCustomers = useCallback(() => {
    getCustomers().then(setCustomers).catch(() => {});
  }, []);

  const loadHistory = useCallback(() => {
    setLoadingHistory(true);
    getBillsPaged(historyPage)
      .then((r) => { setHistory(r.data); setHistoryPagination({ total: r.total, pages: r.pages }); })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [historyPage]);

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, [loadProducts, loadCustomers]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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

  // Product IDs from the API are numbers, but <select> option values are
  // always strings — use loose equality so the row product is found.
  const findProduct = (id) => products.find((x) => String(x.id) === String(id));

  // If the bill snapshot doesn't have a logo (older bills or stores without
  // an uploaded logo), fall back to the current store's logo from context.
  const withLogoFallback = (bill) => ({
    ...bill,
    storeLogo: bill.storeLogo || shop?.logo || null,
  });

  const getRowSubtotal = (item) => {
    const p = findProduct(item.productId);
    return p ? p.price * Number(item.quantity || 0) : 0;
  };

  const getRowGst = (item) => {
    const p = findProduct(item.productId);
    if (!p) return 0;
    const gp = Number(p.gstPercent || 0);
    return (p.price * Number(item.quantity || 0)) * gp / 100;
  };

  const getSubtotal = () => cartItems.reduce((s, i) => s + getRowSubtotal(i), 0);
  const getGstTotal = () => cartItems.reduce((s, i) => s + getRowGst(i), 0);
  const getTotal = () => getSubtotal() + getGstTotal();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCartError('');
    const validItems = cartItems.filter((i) => i.productId && Number(i.quantity) > 0);
    if (!validItems.length) return setCartError('Add at least one item to the bill.');
    if (!walkIn && !selectedCustomerId) return setCartError('Please select a customer.');
    setSubmitting(true);
    try {
      const bill = await createBill({
        customerName: walkIn ? (customerName.trim() || 'Walk-in Customer') : customerName,
        customerId: walkIn ? null : (selectedCustomerId || null),
        paid: walkIn ? true : paidNow,
        paymentMode: (!walkIn && !paidNow) ? 'credit' : paymentMode,
        items: validItems.map((i) => ({ productId: i.productId, quantity: Number(i.quantity) })),
      });
      setPreviewBill(withLogoFallback(bill));
      setCartItems([{ productId: '', quantity: 1 }]);
      setCustomerName('');
      setSelectedCustomerId('');
      setWalkIn(true);
      setPaidNow(true);
      setPaymentMode('cash');
      loadProducts();
      loadHistory();
    } catch (err) {
      setCartError(err.response?.data?.message || 'Failed to create bill');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayBill = async (bill) => {
    setPayingBillId(bill.id);
    try {
      await payBill(bill.id, { paymentMode: 'cash' });
      loadHistory();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark as paid');
    } finally {
      setPayingBillId(null);
    }
  };

  const fmtDate = (iso) =>
    new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const filteredHistory = history.filter((b) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      String(b.id).includes(q) ||
      (b.customerName || '').toLowerCase().includes(q) ||
      String(b.total).includes(q)
    );
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
        <div className={styles.cartHeader}>
          <div>
            <h3 className={styles.cartSectionTitle}>New Bill</h3>
            <p className={styles.cartSectionSubtitle}>Add items, choose a customer &amp; payment, then submit</p>
          </div>
        </div>

        {cartError && <div className={styles.alertError}>{cartError}</div>}

        <form onSubmit={handleSubmit}>
          {/* ── Customer block ── */}
          <div className={styles.billCustomerSection}>
            <span className={styles.billSectionLabel}>Customer</span>
            <div className={styles.typeToggle} style={{ maxWidth: 280 }}>
              <button type="button"
                className={`${styles.typeBtn} ${walkIn ? styles.typeBtnActive : ''}`}
                onClick={() => { setWalkIn(true); setCustomerName(''); setSelectedCustomerId(''); setPaidNow(true); }}>
                Walk-in
              </button>
              <button type="button"
                className={`${styles.typeBtn} ${!walkIn ? styles.typeBtnActive : ''}`}
                onClick={() => setWalkIn(false)}>
                Registered
              </button>
            </div>
            {walkIn ? (
              <input type="text" className={styles.fieldInput} style={{ maxWidth: 320 }}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name (optional)" />
            ) : (
              <select className={styles.fieldInput} style={{ maxWidth: 320 }}
                value={selectedCustomerId}
                onChange={(e) => {
                  const cust = customers.find((c) => String(c.id) === e.target.value);
                  setSelectedCustomerId(e.target.value);
                  setCustomerName(cust?.name || '');
                }}
                required
              >
                <option value="">— Select customer —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.mobile ? ` — ${c.mobile}` : ''}
                    {c.outstandingAmount > 0 ? ` | ₹${Number(c.outstandingAmount).toFixed(2)} outstanding` : ''}
                  </option>
                ))}
              </select>
            )}
            {!walkIn && (
              <div className={styles.billPaymentOptions}>
                <label className={styles.billPayLabel}>
                  <input type="checkbox" checked={paidNow}
                    onChange={(e) => setPaidNow(e.target.checked)}
                    style={{ width: 15, height: 15, accentColor: 'var(--primary)', cursor: 'pointer' }} />
                  Paid now
                </label>
                {paidNow ? (
                  <div className={styles.billPayModes}>
                    {['cash', 'card', 'upi', 'other'].map((m) => (
                      <label key={m} className={`${styles.payModeBtn} ${paymentMode === m ? styles.payModeBtnActive : ''}`}>
                        <input type="radio" name="paymentMode" value={m}
                          checked={paymentMode === m} onChange={() => setPaymentMode(m)}
                          style={{ display: 'none' }} />
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </label>
                    ))}
                  </div>
                ) : (
                  <span className={styles.billCreditWarning}>⚠ Bill will be saved as outstanding (unpaid credit)</span>
                )}
              </div>
            )}
          </div>

          {/* ── Items section ── */}
          <div className={styles.cartItemsSection}>
            <div className={styles.cartItemsHeader}>
              <span className={styles.billSectionLabel}>Items</span>
              <button type="button" className={styles.addItemBtn} onClick={addRow}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Item
              </button>
            </div>
            <div className={styles.cartColLabels}>
              <span className={styles.cartColProduct}>Product</span>
              <span className={styles.cartColQty}>Qty</span>
              <span className={styles.cartColSubtotal}>Amount</span>
              <span className={styles.cartColAction} />
            </div>

          {cartItems.map((item, idx) => {
            const product = findProduct(item.productId);
            const gp = Number(product?.gstPercent || 0);
            return (
              <div key={idx} className={styles.cartRow}>
                <select className={styles.cartSelect} value={item.productId}
                  onChange={(e) => updateRow(idx, 'productId', e.target.value)} required>
                  <option value="">Select product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{Number(p.price).toFixed(2)}
                      {Number(p.gstPercent) > 0 ? ` (+${Number(p.gstPercent).toFixed(2)}% GST)` : ''}
                      {' '}(Stock: {p.stock})
                    </option>
                  ))}
                </select>
                <input className={styles.cartQtyInput}
                  type="number" min="1" max={product ? product.stock : 9999}
                  value={item.quantity} onChange={(e) => updateRow(idx, 'quantity', e.target.value)}
                  placeholder="Qty" required />
                <span className={styles.cartSubtotal}>
                  ₹{getRowSubtotal(item).toFixed(2)}
                  {gp > 0 && (
                    <small style={{ display: 'block', fontSize: 11, color: 'var(--gray-400)', fontWeight: 500 }}>
                      +₹{getRowGst(item).toFixed(2)} GST
                    </small>
                  )}
                </span>
                <button type="button" className={styles.removeRowBtn}
                  onClick={() => removeRow(idx)} title="Remove row"
                  disabled={cartItems.length === 1}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                  </svg>
                </button>
              </div>
            );
          })}

          </div>{/* end cartItemsSection */}

          {/* ── Summary + Submit ── */}
          <div className={styles.billFooter}>
            <div className={styles.billSummary}>
              <div className={styles.billSummaryRow}>
                <span>Subtotal</span>
                <span>₹{getSubtotal().toFixed(2)}</span>
              </div>
              {getGstTotal() > 0 && (
                <div className={styles.billSummaryRow}>
                  <span>GST</span>
                  <span>₹{getGstTotal().toFixed(2)}</span>
                </div>
              )}
              <div className={`${styles.billSummaryRow} ${styles.billSummaryGrand}`}>
                <span>Grand Total</span>
                <span>₹{getTotal().toFixed(2)}</span>
              </div>
            </div>
            <button type="submit" className={styles.billSubmitBtn} disabled={submitting}>
              {submitting ? 'Creating…' : (!walkIn && !paidNow) ? '💾 Save as Credit' : '✓ Submit Bill'}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <input
              type="search"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search by bill ID, customer, amount…"
              style={{
                padding: '6px 12px', border: '1.5px solid var(--gray-200)', borderRadius: 8,
                fontSize: 13, outline: 'none', width: 260,
              }}
            />
            <span className={styles.historyCount}>
              {filteredHistory.length} transaction{filteredHistory.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Bill ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingHistory ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading...</td></tr>
            ) : filteredHistory.length === 0 ? (
              <tr className={styles.emptyRow}>
                <td colSpan={7}>{historySearch ? 'No bills match your search.' : 'No bills yet. Create your first bill above.'}</td>
              </tr>
            ) : (
              filteredHistory.map((bill) => (
                <tr key={bill.id}>
                  <td data-label="Bill ID"><code className={styles.billIdBadge}>{bill.id}</code></td>
                  <td data-label="Customer">{bill.customerName}</td>
                  <td data-label="Items"><span className={styles.badge}>{bill.items.length}</span></td>
                  <td data-label="Total"><strong>Rs.{Number(bill.total).toFixed(2)}</strong></td>
                  <td data-label="Status">
                    {bill.paid === false ? (
                      <span style={{
                        display: 'inline-block', padding: '3px 10px',
                        borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d',
                      }}>UNPAID</span>
                    ) : (
                      <span style={{
                        display: 'inline-block', padding: '3px 10px',
                        borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7',
                      }}>PAID</span>
                    )}
                  </td>
                  <td data-label="Date" style={{ color: 'var(--gray-500)', fontSize: 13 }}>{fmtDate(bill.createdAt)}</td>
                  <td data-label="Actions">
                    <div className={styles.tdActions}>
                      <button className={styles.editBtn} onClick={() => setPreviewBill(withLogoFallback(bill))}>
                        View
                      </button>
                      {bill.paid === false && (
                        <button
                          className={styles.copyBtn}
                          onClick={() => handlePayBill(bill)}
                          disabled={payingBillId === bill.id}
                        >
                          {payingBillId === bill.id ? '…' : 'Mark Paid'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination page={historyPage} pages={historyPagination.pages} total={historyPagination.total} limit={25} onPageChange={setHistoryPage} />
      </div>
    </div>
  );
}
