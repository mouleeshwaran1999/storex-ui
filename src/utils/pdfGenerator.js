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
  const margin = 14;

  const hasGst = (bill.items || []).some((i) => Number(i.gstPercent) > 0);
  const subtotal = Number(bill.subtotal ?? (bill.items || []).reduce((s, i) => s + Number(i.subtotal), 0));
  const gstTotal = Number(bill.gstTotal ?? (bill.items || []).reduce((s, i) => s + Number(i.gstAmount || 0), 0));
  const grand    = Number(bill.total);

  let cursorY = 16;

  // ── Logo (left) ──────────────────────────────────────────────
  let textStartX = margin;
  if (bill.storeLogo) {
    const isSvg = bill.storeLogo.startsWith('data:image/svg+xml');
    if (!isSvg) {
      try {
        const format = bill.storeLogo.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(bill.storeLogo, format, margin, cursorY, 18, 18);
        textStartX = margin + 22;
      } catch (_) {
        // ignore
      }
    }
  }

  // ── Store info (left) ────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(bill.storeName, textStartX, cursorY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(bill.storeAddress, textStartX, cursorY + 10);
  const metaLine = `GST: ${bill.storeGst}${bill.storePhone ? `  |  ${bill.storePhone}` : ''}`;
  doc.text(metaLine, textStartX, cursorY + 14);

  // ── INVOICE label (right) ────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(99, 102, 241);
  doc.text('INVOICE', pageW - margin, cursorY + 5, { align: 'right' });

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`#${bill.id}`, pageW - margin, cursorY + 10, { align: 'right' });

  cursorY += 22;

  // ── Divider ──────────────────────────────────────────────────
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(margin, cursorY, pageW - margin, cursorY);
  cursorY += 7;

  // ── Bill To / Date cards ─────────────────────────────────────
  const cardW = (pageW - margin * 2 - 6) / 2;
  const cardH = 18;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, cardW, cardH, 2, 2, 'FD');
  doc.roundedRect(margin + cardW + 6, cursorY, cardW, cardH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('BILL TO', margin + 4, cursorY + 5);
  doc.text('INVOICE DATE', margin + cardW + 10, cursorY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(bill.customerName, margin + 4, cursorY + 12);
  doc.text(
    new Date(bill.createdAt).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }),
    margin + cardW + 10,
    cursorY + 12,
  );

  cursorY += cardH + 8;

  // ── Items table ──────────────────────────────────────────────
  const head = hasGst
    ? [['#', 'Product', 'Unit (Rs)', 'Qty', 'GST %', 'GST (Rs)', 'Total (Rs)']]
    : [['#', 'Product', 'Unit (Rs)', 'Qty', 'Total (Rs)']];

  const body = bill.items.map((item, i) => {
    const lineTotal = Number(item.subtotal) + Number(item.gstAmount || 0);
    const base = [
      i + 1,
      item.productName,
      Number(item.price).toFixed(2),
      item.quantity,
    ];
    if (hasGst) {
      base.push(Number(item.gstPercent || 0).toFixed(2) + '%');
      base.push(Number(item.gstAmount || 0).toFixed(2));
    }
    base.push(lineTotal.toFixed(2));
    return base;
  });

  autoTable(doc, {
    startY: cursorY,
    head,
    body,
    styles: { fontSize: 9.5, cellPadding: 3.5 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: hasGst
      ? {
          0: { halign: 'center', cellWidth: 9 },
          2: { halign: 'right' },
          3: { halign: 'center', cellWidth: 12 },
          4: { halign: 'right', cellWidth: 14 },
          5: { halign: 'right' },
          6: { halign: 'right', fontStyle: 'bold' },
        }
      : {
          0: { halign: 'center', cellWidth: 10 },
          2: { halign: 'right' },
          3: { halign: 'center', cellWidth: 14 },
          4: { halign: 'right', fontStyle: 'bold' },
        },
    margin: { left: margin, right: margin },
  });

  const tableEndY = doc.lastAutoTable.finalY + 6;

  // ── Totals summary (right-aligned) ───────────────────────────
  const sumX = pageW - margin - 70;
  const sumW = 70;
  let sumY = tableEndY;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);

  doc.text('Subtotal', sumX, sumY + 4);
  doc.text(`Rs. ${subtotal.toFixed(2)}`, sumX + sumW, sumY + 4, { align: 'right' });

  doc.text('Total GST', sumX, sumY + 10);
  doc.text(`Rs. ${gstTotal.toFixed(2)}`, sumX + sumW, sumY + 10, { align: 'right' });

  sumY += 14;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(sumX, sumY, sumX + sumW, sumY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('Grand Total', sumX, sumY + 7);
  doc.setTextColor(99, 102, 241);
  doc.text(`Rs. ${grand.toFixed(2)}`, sumX + sumW, sumY + 7, { align: 'right' });

  // ── Footer note ──────────────────────────────────────────────
  const footerText = bill.storeFooterNote || 'Thank you for your purchase!';
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(footerText, pageW / 2, sumY + 22, { align: 'center' });

  doc.save(`Storex_Bill_${bill.id}.pdf`);
};
