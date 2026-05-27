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

    const hasGst = (bill.items || []).some((i) => Number(i.gstPercent) > 0);

    const itemRows = bill.items
      .map(
        (item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${item.productName}</td>
          <td class="right">₹${Number(item.price).toFixed(2)}</td>
          <td class="center">${item.quantity}</td>
          ${hasGst ? `<td class="right">${Number(item.gstPercent || 0).toFixed(2)}%</td>` : ''}
          ${hasGst ? `<td class="right">₹${Number(item.gstAmount || 0).toFixed(2)}</td>` : ''}
          <td class="right"><strong>₹${(Number(item.subtotal) + Number(item.gstAmount || 0)).toFixed(2)}</strong></td>
        </tr>`
      )
      .join('');

    const subtotal = Number(bill.subtotal ?? bill.items.reduce((s, i) => s + Number(i.subtotal), 0));
    const gstTotal = Number(bill.gstTotal ?? bill.items.reduce((s, i) => s + Number(i.gstAmount || 0), 0));
    const grand    = Number(bill.total);

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice — ${bill.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; padding: 36px; color: #1e293b; }
    .header { display: flex; align-items: center; gap: 18px; padding-bottom: 18px; border-bottom: 2px solid #1e293b; }
    .logo { width: 64px; height: 64px; object-fit: contain; border-radius: 6px; }
    .store-name { font-size: 22px; font-weight: 800; margin-bottom: 4px; letter-spacing: -0.3px; }
    .store-meta { font-size: 11.5px; color: #475569; line-height: 1.55; }
    .invoice-label { margin-left: auto; text-align: right; }
    .invoice-label .tag { font-size: 22px; font-weight: 800; color: #6366f1; letter-spacing: 1px; }
    .invoice-label .num { font-size: 11px; color: #475569; margin-top: 2px; font-family: monospace; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 22px 0; }
    .meta-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }
    .meta-block .label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .meta-block .value { font-size: 14px; font-weight: 700; color: #0f172a; }
    .meta-block .sub { font-size: 12px; color: #475569; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
    thead tr { background: #1e293b; color: white; }
    th, td { padding: 9px 10px; font-size: 12px; }
    th { text-align: left; font-weight: 700; text-transform: uppercase; font-size: 10.5px; letter-spacing: 0.4px; }
    td { border-bottom: 1px solid #e2e8f0; }
    .right { text-align: right; }
    .center { text-align: center; }
    .summary { margin-top: 14px; margin-left: auto; width: 280px; }
    .summary .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #475569; }
    .summary .grand { border-top: 2px solid #1e293b; margin-top: 6px; padding-top: 10px; font-size: 16px; font-weight: 800; color: #0f172a; }
    .summary .grand span:last-child { color: #6366f1; font-size: 18px; }
    .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #64748b; font-style: italic; padding-top: 14px; border-top: 1px dashed #cbd5e1; }
    @media print { body { padding: 18px; } }
  </style>
</head>
<body>
  <div class="header">
    ${logoHtml}
    <div>
      <div class="store-name">${bill.storeName}</div>
      <div class="store-meta">
        ${bill.storeAddress}<br/>
        GST: ${bill.storeGst}${bill.storePhone ? ` &nbsp;|&nbsp; ${bill.storePhone}` : ''}
      </div>
    </div>
    <div class="invoice-label">
      <div class="tag">INVOICE</div>
      <div class="num">#${bill.id}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-block">
      <div class="label">Bill To</div>
      <div class="value">${bill.customerName}</div>
    </div>
    <div class="meta-block">
      <div class="label">Invoice Date</div>
      <div class="value">${new Date(bill.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</div>
      <div class="sub">${new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:30px">#</th>
        <th>Product</th>
        <th class="right" style="width:80px">Unit ₹</th>
        <th class="center" style="width:50px">Qty</th>
        ${hasGst ? '<th class="right" style="width:60px">GST %</th>' : ''}
        ${hasGst ? '<th class="right" style="width:80px">GST ₹</th>' : ''}
        <th class="right" style="width:90px">Total ₹</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="summary">
    <div class="row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
    <div class="row"><span>Total GST</span><span>₹${gstTotal.toFixed(2)}</span></div>
    <div class="row grand"><span>Grand Total</span><span>₹${grand.toFixed(2)}</span></div>
  </div>

  ${bill.storeFooterNote ? `<div class="footer">${bill.storeFooterNote}</div>` : '<div class="footer">Thank you for your purchase!</div>'}
  <script>window.onload = function(){ window.print(); window.onafterprint = function(){ window.close(); }; }<\/script>
</body>
</html>`);
    printWindow.document.close();
  };

  const dateStr = new Date(bill.createdAt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const hasGst = (bill.items || []).some((i) => Number(i.gstPercent) > 0);
  const subtotal = Number(bill.subtotal ?? (bill.items || []).reduce((s, i) => s + Number(i.subtotal), 0));
  const gstTotal = Number(bill.gstTotal ?? (bill.items || []).reduce((s, i) => s + Number(i.gstAmount || 0), 0));
  const itemCount = (bill.items || []).reduce((s, i) => s + Number(i.quantity || 0), 0);

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
          <div className={styles.invoiceHeader}>
            <div className={styles.invoiceHeaderLeft}>
              {bill.storeLogo && (
                <img src={bill.storeLogo} alt={bill.storeName} className={styles.storeLogoSmall} />
              )}
              <div>
                <h2 className={styles.storeNameLeft}>{bill.storeName}</h2>
                <p className={styles.storeMetaLeft}>{bill.storeAddress}</p>
                <p className={styles.storeMetaLeft}>
                  GST: {bill.storeGst}{bill.storePhone ? ` · ${bill.storePhone}` : ''}
                </p>
              </div>
            </div>
            <div className={styles.invoiceTag}>
              <div className={styles.invoiceTagLabel}>INVOICE</div>
              <div className={styles.invoiceTagNum}>#{bill.id}</div>
            </div>
          </div>

          {/* Bill meta cards */}
          <div className={styles.metaGrid}>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>Bill To</span>
              <span className={styles.metaValue}>{bill.customerName}</span>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>Invoice Date</span>
              <span className={styles.metaValue}>{dateStr}</span>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>Items</span>
              <span className={styles.metaValue}>{bill.items.length} ({itemCount} units)</span>
            </div>
          </div>

          {/* Items table */}
          <table className={styles.itemTable}>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th style={{ textAlign: 'right' }}>Unit ₹</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                {hasGst && <th style={{ textAlign: 'right' }}>GST %</th>}
                {hasGst && <th style={{ textAlign: 'right' }}>GST ₹</th>}
                <th style={{ textAlign: 'right' }}>Total ₹</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, i) => {
                const gstAmt = Number(item.gstAmount || 0);
                const lineTotal = Number(item.subtotal) + gstAmt;
                return (
                  <tr key={i}>
                    <td data-label="#">{i + 1}</td>
                    <td data-label="Product">{item.productName}</td>
                    <td data-label="Unit ₹" style={{ textAlign: 'right' }}>₹{Number(item.price).toFixed(2)}</td>
                    <td data-label="Qty" style={{ textAlign: 'center' }}>{item.quantity}</td>
                    {hasGst && <td data-label="GST %" style={{ textAlign: 'right' }}>{Number(item.gstPercent || 0).toFixed(2)}%</td>}
                    {hasGst && <td data-label="GST ₹" style={{ textAlign: 'right' }}>₹{gstAmt.toFixed(2)}</td>}
                    <td data-label="Total ₹" style={{ textAlign: 'right' }}><strong>₹{lineTotal.toFixed(2)}</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals breakdown */}
          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Total GST</span>
              <span>₹{gstTotal.toFixed(2)}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.summaryGrand}`}>
              <span>Grand Total</span>
              <span>₹{Number(bill.total).toFixed(2)}</span>
            </div>
          </div>

          {/* Footer note */}
          {bill.storeFooterNote
            ? <p className={styles.footerNote}>{bill.storeFooterNote}</p>
            : <p className={styles.footerNote}>Thank you for your purchase!</p>}
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
