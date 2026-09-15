import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import QRCode from 'qrcode';

const budgetLabels = { PENDING: 'Pendiente', APPROVED: 'Autorizado', REJECTED: 'Rechazado' };
const priorityLabels = { NORMAL: 'Normal', ALTA: 'Alta', URGENTE: 'Urgente' };

const money = (value) => `$${Number(value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

export async function generateOrderPdf(order) {
  const trackingUrl = `${window.location.origin}/tracking/${order.publicTrackingToken}`;
  const qrDataUrl = await QRCode.toDataURL(trackingUrl, { margin: 1, width: 200, color: { dark: '#141414', light: '#ffffff' } }).catch(
    () => null
  );

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
  doc.text('Comprobante de recepción / Cotización', marginX, y + 6);

  doc.setTextColor(20, 20, 20);
  doc.text(`Folio: ${order.folio}`, pageWidth - marginX, y, { align: 'right' });
  doc.text(`Fecha: ${new Date(order.receivedAt).toLocaleDateString('es-MX')}`, pageWidth - marginX, y + 6, { align: 'right' });

  y += 16;
  doc.setDrawColor(220, 220, 220);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Cliente', marginX, y);
  doc.text('Equipo', 110, y);
  doc.setFont('helvetica', 'normal');
  y += 6;
  doc.text(order.customer.name, marginX, y);
  doc.text(`${order.device.brand} ${order.device.model}`, 110, y);
  y += 5;
  doc.text(order.customer.phone || '-', marginX, y);
  doc.text(order.device.category, 110, y);
  y += 5;
  if (order.device.serialNumber) {
    doc.text(`N. serie: ${order.device.serialNumber}`, 110, y);
    y += 5;
  }
  if (order.device.imei) {
    doc.text(`IMEI: ${order.device.imei}`, 110, y);
    y += 5;
  }

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Falla reportada', marginX, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  const issueLines = doc.splitTextToSize(order.reportedIssue || '-', pageWidth - marginX * 2);
  doc.text(issueLines, marginX, y);
  y += issueLines.length * 5 + 4;

  if (order.diagnosis) {
    doc.setFont('helvetica', 'bold');
    doc.text('Diagnóstico', marginX, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    const diagnosisLines = doc.splitTextToSize(order.diagnosis, pageWidth - marginX * 2);
    doc.text(diagnosisLines, marginX, y);
    y += diagnosisLines.length * 5 + 4;
  }

  const total = order.finalCost || order.estimatedCost || 0;
  autoTable(doc, {
    startY: y,
    head: [['Concepto', 'Monto']],
    body: [
      ['Piezas', money(order.partsCost)],
      ['Mano de obra', money(order.laborCost)],
      ['Otros cargos', money(order.otherCharges)]
    ],
    foot: [[order.finalCost ? 'Total final' : 'Total estimado', money(total)]],
    theme: 'grid',
    headStyles: { fillColor: [33, 150, 243] },
    footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: 'bold' },
    margin: { left: marginX, right: marginX }
  });

  y = doc.lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Autorización del presupuesto: ${budgetLabels[order.budgetStatus] || order.budgetStatus}`, marginX, y);
  y += 6;
  doc.text(`Prioridad: ${priorityLabels[order.priority] || order.priority}`, marginX, y);
  if (order.estimatedDeliveryAt) {
    y += 6;
    doc.text(`Entrega estimada: ${new Date(order.estimatedDeliveryAt).toLocaleDateString('es-MX')}`, marginX, y);
  }
  if (order.warrantyExpiresAt) {
    y += 6;
    doc.text(
      `Garantía: ${order.warrantyDays} días · vigente hasta ${new Date(order.warrantyExpiresAt).toLocaleDateString('es-MX')}`,
      marginX,
      y
    );
  }

  y += 12;
  doc.setDrawColor(220, 220, 220);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 8;
  const footerTop = y;
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('Consulta el estado de tu reparación en línea:', marginX, y);
  y += 5;
  doc.setTextColor(33, 150, 243);
  doc.text(trackingUrl, marginX, y);
  y += 8;
  doc.setTextColor(150, 150, 150);
  doc.text(`Generado el ${new Date().toLocaleString('es-MX')}`, marginX, y);
  if (qrDataUrl) {
    const qrSize = 24;
    doc.addImage(qrDataUrl, 'PNG', pageWidth - marginX - qrSize, footerTop - 4, qrSize, qrSize);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('Escanea para dar seguimiento', pageWidth - marginX - qrSize / 2, footerTop - 4 + qrSize + 4, { align: 'center' });
  }

  doc.save(`${order.folio}.pdf`);
}
