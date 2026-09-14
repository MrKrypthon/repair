import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

const money = (value) => `$${Number(value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_X = 15;
const BOTTOM_MARGIN = 22;

const statusMeta = {
  DRAFT: { label: 'BORRADOR', color: [120, 120, 120] },
  SENT: { label: 'ENVIADA', color: [2, 119, 189] },
  APPROVED: { label: 'APROBADA', color: [46, 125, 50] },
  REJECTED: { label: 'RECHAZADA', color: [198, 40, 40] },
  CONVERTED: { label: 'CONVERTIDA EN ORDEN', color: [33, 150, 243] }
};

function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_HEIGHT - BOTTOM_MARGIN) {
    doc.addPage();
    return 20;
  }
  return y;
}

export function generateQuotationPdf(quotation) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(33, 150, 243);
  doc.text('FixTrack', MARGIN_X, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text('Cotización', MARGIN_X, y + 6);

  const isExpired = quotation.validUntil && new Date(quotation.validUntil) < new Date() && ['DRAFT', 'SENT'].includes(quotation.status);
  const status = statusMeta[quotation.status] || statusMeta.DRAFT;

  let rightY = y;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...status.color);
  doc.text(status.label, PAGE_WIDTH - MARGIN_X, rightY, { align: 'right' });
  rightY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(`Folio: ${quotation.folio}`, PAGE_WIDTH - MARGIN_X, rightY, { align: 'right' });
  rightY += 6;
  doc.text(`Fecha: ${new Date(quotation.createdAt).toLocaleDateString('es-MX')}`, PAGE_WIDTH - MARGIN_X, rightY, { align: 'right' });
  if (quotation.validUntil) {
    rightY += 6;
    doc.setTextColor(...(isExpired ? [198, 40, 40] : [20, 20, 20]));
    doc.text(`Válida hasta: ${new Date(quotation.validUntil).toLocaleDateString('es-MX')}${isExpired ? ' (VENCIDA)' : ''}`, PAGE_WIDTH - MARGIN_X, rightY, { align: 'right' });
    doc.setTextColor(20, 20, 20);
  }

  y += Math.max(20, rightY - y + 8);
  doc.setDrawColor(220, 220, 220);
  doc.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Cliente', MARGIN_X, y);
  doc.text('Equipo', 110, y);
  doc.setFont('helvetica', 'normal');
  y += 6;
  doc.text(quotation.customer.name, MARGIN_X, y);
  doc.text(`${quotation.device.brand} ${quotation.device.model}`, 110, y);
  y += 5;
  doc.text(quotation.customer.phone || '-', MARGIN_X, y);
  doc.text(quotation.device.category, 110, y);

  y += 10;
  y = ensureSpace(doc, y, 10);
  doc.setFont('helvetica', 'bold');
  doc.text('Falla reportada', MARGIN_X, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  const issueLines = doc.splitTextToSize(quotation.issueDescription || '-', PAGE_WIDTH - MARGIN_X * 2);
  y = ensureSpace(doc, y, issueLines.length * 5 + 4);
  doc.text(issueLines, MARGIN_X, y);
  y += issueLines.length * 5 + 4;

  const total = quotation.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
  autoTable(doc, {
    startY: y,
    head: [['Concepto', 'Cantidad', 'Precio unitario', 'Subtotal']],
    body: quotation.items.map((item) => [item.description, item.quantity, money(item.unitPrice), money(item.unitPrice * item.quantity)]),
    foot: [['', '', 'Total', money(total)]],
    theme: 'grid',
    headStyles: { fillColor: [33, 150, 243] },
    footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    margin: { left: MARGIN_X, right: MARGIN_X, bottom: BOTTOM_MARGIN }
  });

  y = doc.lastAutoTable.finalY + 8;

  if (quotation.notes) {
    y = ensureSpace(doc, y, 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text('Notas', MARGIN_X, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(quotation.notes, PAGE_WIDTH - MARGIN_X * 2);
    y = ensureSpace(doc, y, noteLines.length * 5 + 4);
    doc.text(noteLines, MARGIN_X, y);
    y += noteLines.length * 5 + 4;
  }

  const conditions = [
    'Precios expresados en pesos mexicanos (MXN).',
    'Sujeta a disponibilidad de piezas al momento de autorizar el trabajo.',
    'El tiempo de reparación se confirma al autorizar esta cotización.'
  ];
  y = ensureSpace(doc, y, 10 + conditions.length * 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text('Condiciones', MARGIN_X, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(90, 90, 90);
  conditions.forEach((line) => {
    doc.text(`• ${line}`, MARGIN_X, y);
    y += 5;
  });

  y = ensureSpace(doc, y, 26);
  y += 10;
  doc.setDrawColor(180, 180, 180);
  doc.line(MARGIN_X, y, MARGIN_X + 75, y);
  doc.line(PAGE_WIDTH - MARGIN_X - 50, y, PAGE_WIDTH - MARGIN_X, y);
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Firma de aceptación del cliente', MARGIN_X, y);
  doc.text('Fecha', PAGE_WIDTH - MARGIN_X - 50, y);

  y = ensureSpace(doc, y, 16);
  y += 10;
  doc.setDrawColor(220, 220, 220);
  doc.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('Esta cotización no representa un cargo ni una orden de servicio hasta ser autorizada por el cliente.', MARGIN_X, y);
  y += 5;
  doc.text(`Generado el ${new Date().toLocaleString('es-MX')}`, MARGIN_X, y);

  const totalPages = doc.internal.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${page} de ${totalPages}`, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 10, { align: 'right' });
  }

  doc.save(`${quotation.folio}.pdf`);
}
