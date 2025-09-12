import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDate, formatSaleNumber } from '@/lib/utils';
import { addHeader, addFooter, addClientInfo, cleanAndParseFloat } from '@/lib/pdfUtils';

export const generateSalePDF = async (sale, client, organization, user) => {
  const doc = new jsPDF();
  const title = `${sale.type} N°: ${formatSaleNumber(sale)}`;
  
  await addHeader(doc, title, organization, user);
  
  let currentY = 47;
  doc.setFontSize(10);
  doc.setTextColor(80,80,80);
  doc.text(`Fecha Documento: ${formatDate(sale.sale_date)}`, 14, currentY);
  doc.text(`Forma de Pago: ${sale.payment_methods?.map(p => p.method).join(', ') || 'N/A'}`, doc.internal.pageSize.width - 14, currentY, { align: 'right' });
  currentY += 7;
  doc.text(`Estado: ${sale.status}`, 14, currentY);
  if(sale.workOrderId) doc.text(`Orden de Trabajo: ${sale.workOrderId}`, doc.internal.pageSize.width - 14, currentY, { align: 'right' });
  currentY += 10;

  currentY = addClientInfo(doc, client, currentY);
  doc.setLineWidth(0.2);
  doc.line(14, currentY - 3, doc.internal.pageSize.width - 14, currentY -3);
  currentY += 2;

  const tableColumn = ["Cant.", "Descripción", "Vehículo", "P. Unit.", "IVA (%)", "Total Item"];
  const tableRows = [];

  sale.items.forEach(item => {
    const itemData = [
      item.quantity,
      item.description,
      item.vehicleName || 'N/A',
      `${cleanAndParseFloat(item.unitPrice).toFixed(2)}`,
      `${cleanAndParseFloat(item.iva).toFixed(2)}%`,
      `${cleanAndParseFloat(item.total).toFixed(2)}`
    ];
    tableRows.push(itemData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: currentY,
    theme: 'grid',
    headStyles: { fillColor: [63, 81, 181] }, 
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 15 }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } }
  });
  
  currentY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(`Total General: ${formatCurrency(cleanAndParseFloat(sale.total))}`, doc.internal.pageSize.width - 14, currentY, { align: 'right' });
  if (sale.status === 'Pendiente de Pago') {
    currentY += 7;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Saldo Pendiente: ${formatCurrency(cleanAndParseFloat(sale.balance))}`, doc.internal.pageSize.width - 14, currentY, { align: 'right' });
  }

  addFooter(doc);
  doc.save(`${sale.type}_${formatSaleNumber(sale)}.pdf`);
};