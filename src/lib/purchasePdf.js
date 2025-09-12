import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDate, formatPurchaseNumber } from '@/lib/utils';
import { addHeader, addFooter, addSupplierInfo, cleanAndParseFloat } from '@/lib/pdfUtils';

export const generatePurchasePDF = async (purchase, supplier, purchaseProducts, organization, user) => {
  const doc = new jsPDF();
  const fullDocumentNumber = `${purchase.document_type} ${formatPurchaseNumber(purchase)}`;
  const title = `Comprobante de Compra`;
  
  await addHeader(doc, title, organization, user);

  let currentY = 47;
  doc.setFontSize(10);
  doc.setTextColor(80,80,80);
  doc.text(`Fecha Documento: ${formatDate(purchase.purchase_date)}`, 14, currentY);
  doc.text(`Comprobante: ${fullDocumentNumber}`, doc.internal.pageSize.width - 14, currentY, { align: 'right' });
  currentY += 7;
  doc.text(`Estado: ${purchase.status}`, 14, currentY);
  doc.text(`Condición de Pago: ${purchase.paymentType}`, doc.internal.pageSize.width - 14, currentY, { align: 'right' });
  currentY += 10;

  const fullSupplier = { ...supplier, name: purchase.supplierName, taxId: purchase.supplierId }; 
  currentY = addSupplierInfo(doc, fullSupplier, currentY);
  doc.setLineWidth(0.2);
  doc.line(14, currentY - 3, doc.internal.pageSize.width - 14, currentY -3);
  currentY += 5;

  doc.setFontSize(12);
  doc.setTextColor(40,40,40);
  doc.text('Detalle de la Compra:', 14, currentY);
  currentY += 7;
  
  const tableColumn = ["Descripción", "Cantidad", "P. Unit.", "IVA (%)", "Total"];
  const tableRows = [];
  
  if (purchase.items && purchase.items.length > 0) {
      purchase.items.forEach(item => {
        tableRows.push([
          item.description || 'N/A',
          item.quantity || 1,
          `${cleanAndParseFloat(item.unitPrice).toFixed(2)}`,
          `${cleanAndParseFloat(item.iva).toFixed(2)}%`,
          `${cleanAndParseFloat(item.total).toFixed(2)}`
        ]);
      });
  }

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: currentY,
    theme: 'grid',
    headStyles: { fillColor: [63, 81, 181] },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } }
  });
  
  currentY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(`Total Compra: ${formatCurrency(cleanAndParseFloat(purchase.total))}`, doc.internal.pageSize.width - 14, currentY, { align: 'right' });
  if (purchase.paymentType === 'Cuenta Corriente') {
    currentY += 7;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Saldo Pendiente: ${formatCurrency(cleanAndParseFloat(purchase.balance))}`, doc.internal.pageSize.width - 14, currentY, { align: 'right' });
  }

  addFooter(doc);
  doc.save(`Compra_${formatPurchaseNumber(purchase)}.pdf`);
};