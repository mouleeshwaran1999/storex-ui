import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyReport, getStoreReport } from '../services/reportService';
import { generateReportPdf } from '../utils/reportPdfGenerator';
import pageStyles from './Page.module.css';
import styles from './Report.module.css';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d) =>
  new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const fmtDay = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// "YYYY-MM-DD" for <input type="date"> and for the API
const toIsoDay = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

// ─── Preset range helpers ───────────────────────────────────────
const presetRange = (preset) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (preset === 'today') {
    return { start: toIsoDay(today), end: toIsoDay(today) };
  }
  if (preset === 'week') {
    // Week starts Monday
    const day = today.getDay();              // 0=Sun ... 6=Sat
    const offset = (day + 6) % 7;            // Mon -> 0, Sun -> 6
    const start = new Date(today);
    start.setDate(today.getDate() - offset);
    return { start: toIsoDay(start), end: toIsoDay(today) };
  }
  if (preset === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: toIsoDay(start), end: toIsoDay(today) };
  }
  if (preset === 'all') {
    return { start: '', end: '' };
  }
  return { start: '', end: '' };
};

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all',   label: 'All Time' },
  { key: 'custom', label: 'Custom' },
];

// ================================================================
// REPORT PAGE
// ================================================================
// Used by BOTH:
//   - Employee at /app/report          (own store, via JWT)
//   - Admin    at /admin/stores/:storeId/report
// ================================================================

export default function Report() {
  const { user } = useAuth();
  const { storeId } = useParams();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date range state
  const [preset, setPreset] = useState('month');               // default: this month
  const [range, setRange] = useState(() => presetRange('month'));
  const [customStart, setCustomStart] = useState(range.start);
  const [customEnd, setCustomEnd]     = useState(range.end);

  const activeRange = useMemo(() => ({
    start: range.start || undefined,
    end: range.end || undefined,
  }), [range]);

  const load = (r) => {
    setLoading(true);
    setError('');
    const promise = isAdmin ? getStoreReport(storeId, r) : getMyReport(r);
    promise
      .then(setData)
      .catch((err) => setError(err.response?.data?.message || 'Failed to load report'))
      .finally(() => setLoading(false));
  };

  // Initial + refetch whenever the active range changes
  useEffect(() => { load(activeRange); /* eslint-disable-next-line */ }, [activeRange, storeId, isAdmin]);

  const choosePreset = (key) => {
    setPreset(key);
    if (key === 'custom') {
      // Don't refetch yet — wait for the user to click Apply
      return;
    }
    const r = presetRange(key);
    setRange(r);
    setCustomStart(r.start);
    setCustomEnd(r.end);
  };

  const applyCustom = () => {
    if (!customStart || !customEnd) return;
    if (customStart > customEnd) {
      setError('Start date must be on or before end date');
      return;
    }
    setRange({ start: customStart, end: customEnd });
  };

  const rangeLabel = (() => {
    if (!range.start && !range.end) return 'All time';
    if (range.start && range.end && range.start === range.end) return fmtDay(range.start);
    if (range.start && range.end) return `${fmtDay(range.start)} → ${fmtDay(range.end)}`;
    if (range.start) return `From ${fmtDay(range.start)}`;
    return `Until ${fmtDay(range.end)}`;
  })();

  return (
    <div>
      <div className={pageStyles.pageHeader}>
        <div>
          <h1 className={pageStyles.pageTitle}>Store Report</h1>
          <p className={pageStyles.pageSubtitle}>Sales performance & stock overview</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={styles.downloadBtn}
            onClick={() => data && generateReportPdf(data, rangeLabel)}
            disabled={!data || loading}
            title="Download report as PDF"
          >
            ⬇ Download PDF
          </button>
          {isAdmin && (
            <button className={styles.backBtn} onClick={() => navigate('/admin/stores')}>
              ← Back to Stores
            </button>
          )}
        </div>
      </div>

      {/* Date range selector */}
      <div className={styles.rangeBar}>
        <span className={styles.rangeLabel}>Range</span>
        <div className={styles.rangePresets}>
          {PRESETS.map(p => (
            <button
              key={p.key}
              type="button"
              className={`${styles.presetBtn} ${preset === p.key ? styles.presetActive : ''}`}
              onClick={() => choosePreset(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className={styles.rangeCustom}>
            <input
              type="date"
              value={customStart}
              max={customEnd || undefined}
              onChange={(e) => setCustomStart(e.target.value)}
            />
            <span className={styles.rangeSep}>to</span>
            <input
              type="date"
              value={customEnd}
              min={customStart || undefined}
              max={toIsoDay(new Date())}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
            <button
              type="button"
              className={styles.rangeApply}
              onClick={applyCustom}
              disabled={!customStart || !customEnd}
            >
              Apply
            </button>
          </div>
        )}

        {preset !== 'custom' && (
          <span className={styles.rangeNote} style={{ marginLeft: 'auto' }}>
            Showing: <strong>{rangeLabel}</strong>
          </span>
        )}
      </div>

      {loading ? (
        <div className={pageStyles.tableCard} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading report…</div>
      ) : error ? (
        <div className={pageStyles.tableCard} style={{ padding: 40, textAlign: 'center', color: '#b91c1c' }}>{error}</div>
      ) : data && (
        <ReportBody data={data} rangeLabel={rangeLabel} />
      )}
    </div>
  );
}

// ─── Presentational body ────────────────────────────────────────
function ReportBody({ data, rangeLabel }) {
  const { store, summary, stock, lowStock, topProducts, recentBills, generatedAt } = data;

  return (
    <>
      {/* Store header card */}
      <div className={pageStyles.tableCard} style={{ padding: 20, marginBottom: 18 }}>
        <div className={styles.storeHeader}>
          <div>
            <h2 className={styles.storeName}>{store.name}</h2>
            <div className={styles.storeMeta}>
              {store.address} · GST: {store.gstNumber}
              {store.phone ? ` · ${store.phone}` : ''}
            </div>
          </div>
          <div className={styles.generatedAt}>Generated: {fmtDate(generatedAt)}</div>
        </div>

        {/* KPI tiles */}
        <div className={styles.kpiGrid}>
          <div className={`${styles.kpiCard} ${styles.kpiAccentPrimary}`}>
            <span className={styles.kpiLabel}>Revenue</span>
            <span className={styles.kpiValue}>{inr(summary.totalRevenue)}</span>
            <span className={styles.kpiSub}>{rangeLabel}</span>
          </div>
          <div className={`${styles.kpiCard} ${styles.kpiAccentSuccess}`}>
            <span className={styles.kpiLabel}>Bills</span>
            <span className={styles.kpiValue}>{summary.totalBills}</span>
            <span className={styles.kpiSub}>{rangeLabel}</span>
          </div>
          <div className={`${styles.kpiCard} ${styles.kpiAccentInfo}`}>
            <span className={styles.kpiLabel}>GST Collected</span>
            <span className={styles.kpiValue}>{inr(summary.totalGst)}</span>
            <span className={styles.kpiSub}>{rangeLabel}</span>
          </div>
          <div className={`${styles.kpiCard} ${styles.kpiAccentWarning}`}>
            <span className={styles.kpiLabel}>Items Sold</span>
            <span className={styles.kpiValue}>{Number(summary.totalItemsSold).toLocaleString('en-IN')}</span>
            <span className={styles.kpiSub}>{rangeLabel}</span>
          </div>
          <div className={`${styles.kpiCard} ${styles.kpiAccentPrimary}`}>
            <span className={styles.kpiLabel}>Products</span>
            <span className={styles.kpiValue}>{summary.productCount}</span>
            <span className={styles.kpiSub}>Stock value {inr(summary.stockValue)}</span>
          </div>
          <div className={`${styles.kpiCard} ${styles.kpiAccentDanger}`}>
            <span className={styles.kpiLabel}>Low Stock</span>
            <span className={styles.kpiValue}>{summary.lowStockCount}</span>
            <span className={styles.kpiSub}>Items at or below 5 units</span>
          </div>
        </div>
      </div>

      {/* Two-column sections */}
      <div className={styles.sectionGrid}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Top Selling Products</h3>
            <span className={styles.sectionCount}>{topProducts.length}</span>
          </div>
          {topProducts.length === 0 ? (
            <div className={styles.empty}>No sales in selected range</div>
          ) : (
            <table className={styles.miniTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th className={styles.right}>Qty Sold</th>
                  <th className={styles.right}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className={styles.right}>{p.qty}</td>
                    <td className={styles.right}>{inr(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Low Stock Alerts</h3>
            <span className={styles.sectionCount}>{lowStock.length}</span>
          </div>
          {lowStock.length === 0 ? (
            <div className={styles.empty}>All stock levels healthy</div>
          ) : (
            <table className={styles.miniTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th className={styles.right}>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className={`${styles.right} ${p.stock === 0 ? styles.danger : styles.warn}`}>
                      {p.stock} {p.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={`${styles.section} ${styles.fullSection}`}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Bills in Range</h3>
            <span className={styles.sectionCount}>{recentBills.length}</span>
          </div>
          {recentBills.length === 0 ? (
            <div className={styles.empty}>No bills in selected range</div>
          ) : (
            <table className={styles.miniTable}>
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Customer</th>
                  <th className={styles.center}>Items</th>
                  <th className={styles.right}>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentBills.map((b) => (
                  <tr key={b.id}>
                    <td>#{b.id}</td>
                    <td>{b.customerName}</td>
                    <td className={styles.center}>{b.items}</td>
                    <td className={styles.right}><strong>{inr(b.total)}</strong></td>
                    <td>{fmtDate(b.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={`${styles.section} ${styles.fullSection}`}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Current Stock</h3>
            <span className={styles.sectionCount}>{stock.length}</span>
          </div>
          {stock.length === 0 ? (
            <div className={styles.empty}>No products in this store</div>
          ) : (
            <table className={styles.miniTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th className={styles.right}>Price</th>
                  <th className={styles.right}>GST %</th>
                  <th className={styles.right}>Stock</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((p) => {
                  const cls = p.stock === 0 ? styles.danger : p.stock <= 5 ? styles.warn : styles.ok;
                  return (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td className={styles.right}>{inr(p.price)}</td>
                      <td className={styles.right}>{Number(p.gstPercent).toFixed(2)}%</td>
                      <td className={`${styles.right} ${cls}`}>{p.stock} {p.unit}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
