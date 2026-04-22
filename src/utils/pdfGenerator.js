import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate a PDF invoice and trigger browser download.
 *
 * @param {object} bill — Full bill object (includes storeLogo, storePhone, etc.)
 *
 * NOTE: jsPDF supports PNG and JPEG in addImage, but NOT SVG data-URLs.
 *       For SVG logos (data:image/svg+xml) we skip the image and rely on the
 *       text store-name header instead.
 */
export const generateBillPDF = (bill) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  let cursorY = 14;

  // ── Store logo (PNG / JPEG only) ─────────────────────────────
  if (bill.storeLogo) {
    const isSvg = bill.storeLogo.startsWith('data:image/svg+xml');
    if (!isSvg) {
      try {
        const format = bill.storeLogo.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(bill.storeLogo, format, 14, cursorY, 22, 22);
      } catch (_) {
        // Logo failed — continue without it
      }
    }
    // SVG: skip image but show store name prominently (below)
  }

  // ── Store header (centred) ───────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(bill.storeName, pageW / 2, cursorY + 5, { align: 'center' });
  cursorY += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(bill.storeAddress, pageW / 2, cursorY + 4, { align: 'center' });
  cursorY += 8;

  if (bill.storeGst) {
    doc.text(`GST No: ${bill.storeGst}`, pageW / 2, cursorY + 1, { align: 'center' });
    cursorY += 6;
  }

  if (bill.storePhone) {
    doc.text(`Phone: ${bill.storePhone}`, pageW / 2, cursorY + 1, { align: 'center' });
    cursorY += 6;
  }

  // ── Divider ──────────────────────────────────────────────────
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.line(14, cursorY + 2, pageW - 14, cursorY + 2);
  cursorY += 8;

  // ── Bill meta ────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 14, cursorY);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bill ID: ${bill.id}`, pageW - 14, cursorY, { align: 'right' });
  cursorY += 6;

  doc.text(`Customer: ${bill.customerName}`, 14, cursorY);
  doc.text(
    `Date: ${new Date(bill.createdAt).toLocaleString('en-IN')}`,
    pageW - 14,
    cursorY,
    { align: 'right' }
  );
  cursorY += 8;

  // ── Items table ──────────────────────────────────────────────
  autoTable(doc, {
    startY: cursorY,
    head: [['#', 'Product', 'Unit Price (₹)', 'Qty', 'Subtotal (₹)']],
    body: bill.items.map((item, i) => [
      i + 1,
      item.productName,
      Number(item.price).toFixed(2),
      item.quantity,
      Number(item.subtotal).toFixed(2),
    ]),
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      2: { halign: 'right' },
      4: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  const tableEndY = doc.lastAutoTable.finalY + 6;

  // ── Total ────────────────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(`Grand Total: ₹${Number(bill.total).toFixed(2)}`, pageW - 14, tableEndY, { align: 'right' });

  // ── Footer note ──────────────────────────────────────────────
  const footerText = bill.storeFooterNote || 'Thank you for your purchase!';
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 120, 120);
  doc.text(footerText, pageW / 2, tableEndY + 14, { align: 'center' });

  doc.save(`Storex_Bill_${bill.id}.pdf`);
};
