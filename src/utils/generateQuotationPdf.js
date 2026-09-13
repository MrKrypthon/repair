import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

const money = (value) => `$${Number(value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

export function generateQuotationPdf(quotation) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const marginX = 15;
  const pageWidth = 210;
  let y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(33, 150, 243);
  doc.text('FixTrack', marginX, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text('Cotización', marginX, y + 6);

  doc.setTextColor(20, 20, 20);
  doc.text(`Folio: ${quotation.folio}`, pageWidth - marginX, y, { align: 'right' });
  doc.text(`Fecha: ${new Date(quotation.createdAt).toLocaleDateString('es-MX')}`, pageWidth - marginX, y + 6, { align: 'right' });
  if (quotation.validUntil) {
    doc.text(`Válida hasta: ${new Date(quotation.validUntil).toLocaleDateString('es-MX')}`, pageWidth - marginX, y + 12, { align: 'right' });
  }

  y += 20;
  doc.setDrawColor(220, 220, 220);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Cliente', marginX, y);
  doc.text('Equipo', 110, y);
  doc.setFont('helvetica', 'normal');
  y += 6;
  doc.text(quotation.customer.name, marginX, y);
  doc.text(`${quotation.device.brand} ${quotation.device.model}`, 110, y);
  y += 5;
  doc.text(quotation.customer.phone || '-', marginX, y);
  doc.text(quotation.device.category, 110, y);

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Falla reportada', marginX, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  const issueLines = doc.splitTextToSize(quotation.issueDescription || '-', pageWidth - marginX * 2);
  doc.text(issueLines, marginX, y);
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
    margin: { left: marginX, right: marginX }
  });

  y = doc.lastAutoTable.finalY + 8;
  if (quotation.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text('Notas', marginX, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(quotation.notes, pageWidth - marginX * 2);
    doc.text(noteLines, marginX, y);
    y += noteLines.length * 5 + 4;
  }

  y += 6;
  doc.setDrawColor(220, 220, 220);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('Esta cotización no representa un cargo ni una orden de servicio hasta ser autorizada por el cliente.', marginX, y);
  y += 5;
  doc.text(`Generado el ${new Date().toLocaleString('es-MX')}`, marginX, y);

  doc.save(`${quotation.folio}.pdf`);
}
