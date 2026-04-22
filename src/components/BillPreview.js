import React, { useEffect, useRef } from 'react';
import { generateBillPDF } from '../utils/pdfGenerator';
import styles from './BillPreview.module.css';

/**
 * BillPreview — full-screen modal showing bill details.
 *
 * Props:
 *   bill       — full bill object from the API (enriched with storeLogo etc.)
 *   onClose()  — called when user closes the preview
 */
export default function BillPreview({ bill, onClose }) {
  const overlayRef = useRef(null);

  // Lock body scroll while open; restore on unmount
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Close when clicking the dark backdrop (not the card itself)
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleDownloadPDF = () => generateBillPDF(bill);

  const handlePrint = () => {
    // Open a small print-only window so we don't disturb the main app UI
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const logoHtml = bill.storeLogo
      ? `<img src="${bill.storeLogo}" alt="logo" class="logo" />`
      : '';

    const itemRows = bill.items
      .map(
        (item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${item.productName}</td>
          <td>₹${Number(item.price).toFixed(2)}</td>
          <td>${item.quantity}</td>
          <td>₹${Number(item.subtotal).toFixed(2)}</td>
        </tr>`
      )
      .join('');

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice — ${bill.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { width: 64px; height: 64px; object-fit: contain; display: block; margin: 0 auto 10px; }
    .store-name { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    .store-meta { font-size: 12px; color: #64748b; line-height: 1.6; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; }
    .meta-row strong { display: block; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #6366f1; color: white; }
    th, td { padding: 10px 12px; text-align: left; font-size: 13px; }
    td { border-bottom: 1px solid #f1f5f9; }
    .total { text-align: right; font-size: 18px; font-weight: 700; color: #1e293b; }
    .footer { margin-top: 24px; text-align: center; font-size: 12px; color: #94a3b8; font-style: italic; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    ${logoHtml}
    <div class="store-name">${bill.storeName}</div>
    <div class="store-meta">
      ${bill.storeAddress}<br/>
      GST: ${bill.storeGst}
      ${bill.storePhone ? ` &nbsp;|&nbsp; ${bill.storePhone}` : ''}
    </div>
  </div>
  <hr />
  <div class="meta-row">
    <div>
      <strong>Invoice</strong>${bill.id}<br/>
      Customer: ${bill.customerName}
    </div>
    <div style="text-align:right">
      <strong>Date</strong>${new Date(bill.createdAt).toLocaleString('en-IN')}
    </div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Product</th><th>Unit Price</th><th>Qty</th><th>Subtotal</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="total">Grand Total: ₹${Number(bill.total).toFixed(2)}</div>
  ${bill.storeFooterNote ? `<div class="footer">${bill.storeFooterNote}</div>` : ''}
  <script>window.onload = function(){ window.print(); window.onafterprint = function(){ window.close(); }; }<\/script>
</body>
</html>`);
    printWindow.document.close();
  };

  const dateStr = new Date(bill.createdAt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Bill Preview">
        {/* ── Header bar ──────────────────────────── */}
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Bill Preview</span>
          <button className={styles.closeBtn} onClick={onClose} title="Close (Esc)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Scrollable bill body ─────────────────── */}
        <div className={styles.modalBody}>
          {/* Store header */}
          <div className={styles.storeHeader}>
            {bill.storeLogo && (
              <img src={bill.storeLogo} alt={bill.storeName} className={styles.storeLogo} />
            )}
            <h2 className={styles.storeName}>{bill.storeName}</h2>
            <p className={styles.storeMeta}>{bill.storeAddress}</p>
            <p className={styles.storeMeta}>GST: {bill.storeGst}{bill.storePhone ? ` · ${bill.storePhone}` : ''}</p>
          </div>

          <div className={styles.divider} />

          {/* Bill meta */}
          <div className={styles.metaRow}>
            <div>
              <span className={styles.metaLabel}>Invoice</span>
              <span className={styles.metaValue}>{bill.id}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={styles.metaLabel}>Date</span>
              <span className={styles.metaValue}>{dateStr}</span>
            </div>
          </div>
          <div className={styles.metaRow} style={{ marginTop: 8 }}>
            <div>
              <span className={styles.metaLabel}>Customer</span>
              <span className={styles.metaValue}>{bill.customerName}</span>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Items table */}
          <table className={styles.itemTable}>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Unit Price</th>
                <th>Qty</th>
                <th style={{ textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{item.productName}</td>
                  <td>₹{Number(item.price).toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>₹{Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Grand total */}
          <div className={styles.totalRow}>
            Grand Total: <strong>₹{Number(bill.total).toFixed(2)}</strong>
          </div>

          {/* Footer note */}
          {bill.storeFooterNote && (
            <p className={styles.footerNote}>{bill.storeFooterNote}</p>
          )}
        </div>

        {/* ── Action footer ───────────────────────── */}
        <div className={styles.modalFooter}>
          <button className={styles.closeAction} onClick={onClose}>Close</button>
          <div className={styles.footerActions}>
            <button className={styles.printBtn} onClick={handlePrint}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print Bill
            </button>
            <button className={styles.downloadBtn} onClick={handleDownloadPDF}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
