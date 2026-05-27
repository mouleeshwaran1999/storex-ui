import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ================================================================
// REPORT PDF GENERATOR
// ================================================================
// Renders the same data shown on the Report page (store header,
// KPI tiles, top products, low stock, bills in range, current
// stock) into a multi-page A4 PDF.
//
// Uses "Rs." prefix instead of ₹ because the default jsPDF
// Helvetica font cannot render the rupee glyph.
// ================================================================

const money = (n) =>
  `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d) =>
  new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export const generateReportPdf = (report, rangeLabel) => {
  const { store, summary, stock, lowStock, topProducts, recentBills, generatedAt } = report;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 16;

  // ── Title ──────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(31, 41, 55);
  doc.text('Store Report', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated: ${fmtDate(generatedAt)}`, pageW - margin, y, { align: 'right' });
  y += 8;

  // ── Store info card ───────────────────────────────────
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, y, pageW - margin * 2, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  doc.text(store.name, margin + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  const metaLine = `${store.address}   |   GST: ${store.gstNumber}${store.phone ? `   |   ${store.phone}` : ''}`;
  doc.text(metaLine, margin + 4, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(99, 102, 241);
  doc.text(`Range: ${rangeLabel}`, margin + 4, y + 19);
  y += 28;

  // ── KPI tiles (3 x 2 grid) ────────────────────────────
  const kpis = [
    { label: 'Revenue',       value: money(summary.totalRevenue) },
    { label: 'Bills',         value: String(summary.totalBills) },
    { label: 'GST Collected', value: money(summary.totalGst) },
    { label: 'Items Sold',    value: String(summary.totalItemsSold) },
    { label: 'Products',      value: `${summary.productCount}  (${money(summary.stockValue)})` },
    { label: 'Low Stock',     value: String(summary.lowStockCount) },
  ];

  const cols = 3;
  const gap = 4;
  const tileW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
  const tileH = 18;

  kpis.forEach((k, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = margin + col * (tileW + gap);
    const ty = y + row * (tileH + gap);

    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, ty, tileW, tileH, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(k.label.toUpperCase(), x + 3, ty + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text(k.value, x + 3, ty + 13);
  });
  y += Math.ceil(kpis.length / cols) * (tileH + gap) + 4;

  // ── Helper to render a section table ──────────────────
  const section = (title, head, body, emptyMsg) => {
    // Page break if not enough room
    if (y > 250) { doc.addPage(); y = 16; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text(title, margin, y);
    y += 4;

    if (!body || body.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.text(emptyMsg, margin, y + 5);
      y += 10;
      return;
    }

    autoTable(doc, {
      head: [head],
      body,
      startY: y + 2,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2.5, textColor: [55, 65, 81] },
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });
    y = doc.lastAutoTable.finalY + 8;
  };

  // ── Top Selling Products ─────────────────────────────
  section(
    'Top Selling Products',
    ['Product', 'Qty Sold', 'Revenue'],
    topProducts.map(p => [p.name, String(p.qty), money(p.revenue)]),
    'No sales in selected range.'
  );

  // ── Low Stock Alerts ─────────────────────────────────
  section(
    'Low Stock Alerts',
    ['Product', 'Remaining'],
    lowStock.map(p => [p.name, `${p.stock} ${p.unit || ''}`.trim()]),
    'All stock levels healthy.'
  );

  // ── Bills in Range ───────────────────────────────────
  section(
    'Bills in Range',
    ['Bill #', 'Customer', 'Items', 'Total', 'Date'],
    recentBills.map(b => [
      `#${b.id}`,
      b.customerName,
      String(b.items),
      money(b.total),
      fmtDate(b.createdAt),
    ]),
    'No bills in selected range.'
  );

  // ── Current Stock ────────────────────────────────────
  section(
    'Current Stock',
    ['Product', 'Price', 'GST %', 'Stock'],
    stock.map(p => [
      p.name,
      money(p.price),
      `${Number(p.gstPercent).toFixed(2)}%`,
      `${p.stock} ${p.unit || ''}`.trim(),
    ]),
    'No products in this store.'
  );

  // ── Page numbers footer ──────────────────────────────
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `${store.name}  |  Page ${i} of ${pages}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  const fileSafeRange = (rangeLabel || 'all-time').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  const fileSafeStore = (store.name || 'store').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  doc.save(`report-${fileSafeStore}-${fileSafeRange}.pdf`);
};
