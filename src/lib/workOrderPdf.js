import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDate } from '@/lib/utils';
import { addHeader, addFooter, addClientInfo, addVehicleInfo, cleanAndParseFloat } from '@/lib/pdfUtils';

export const generateWorkOrderPDF = async (workOrder, client, vehicle, organization, user) => {
  const doc = new jsPDF();
  const title = `Orden de Trabajo N°: ${workOrder.order_number}`;
  
  await addHeader(doc, title, organization, user);

  let currentY = 47;
  doc.setFontSize(10);
  doc.setTextColor(80,80,80);
  doc.text(`Fecha: ${formatDate(workOrder.creation_date)}`, 14, currentY);
  doc.text(`Estado: ${workOrder.status}`, doc.internal.pageSize.width - 14, currentY, { align: 'right' });
  currentY+= 7;
  doc.text(`Asignado a: ${workOrder.assigned_to || 'N/A'}`, 14, currentY);
  currentY += 10;

  currentY = addClientInfo(doc, client, currentY);
  currentY = addVehicleInfo(doc, vehicle, currentY);
  doc.setLineWidth(0.2);
  doc.line(14, currentY - 3, doc.internal.pageSize.width - 14, currentY -3);
  currentY += 5;

  doc.setFontSize(12);
  doc.setTextColor(40,40,40);
  doc.text('Descripción del Servicio:', 14, currentY);
  currentY += 7;
  doc.setFontSize(10);
  doc.setTextColor(80,80,80);
  const serviceLines = doc.splitTextToSize(workOrder.description || 'N/A', doc.internal.pageSize.width - 28);
  doc.text(serviceLines, 14, currentY);
  currentY += (serviceLines.length * 5) + 5;
  
  let partsTotal = 0;
  if (workOrder.parts && workOrder.parts.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(40,40,40);
    doc.text('Servicios / Materiales Utilizados:', 14, currentY);
    currentY += 7;
    const partsTableColumn = ["Descripción", "Cantidad", "Precio Unit.", "Total"];
    const partsTableRows = [];
    
    workOrder.parts.forEach(part => {
      const total = cleanAndParseFloat(part.quantity) * cleanAndParseFloat(part.price);
      partsTotal += total;
      partsTableRows.push([
        part.name,
        part.quantity,
        `${cleanAndParseFloat(part.price).toFixed(2)}`,
        `${total.toFixed(2)}`
      ]);
    });
    doc.autoTable({
      head: [partsTableColumn],
      body: partsTableRows,
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } }
    });
    currentY = doc.lastAutoTable.finalY + 5;
  }
  
  const grandTotal = partsTotal;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(40,40,40);
  doc.text(`Total Orden: ${formatCurrency(grandTotal)}`, doc.internal.pageSize.width - 14, currentY, { align: 'right' });
  currentY += 10;

  if (workOrder.notes) {
    doc.setFontSize(12);
    doc.setTextColor(40,40,40);
    doc.text('Notas Adicionales:', 14, currentY);
    currentY += 7;
    doc.setFontSize(10);
    doc.setTextColor(80,80,80);
    const notesLines = doc.splitTextToSize(workOrder.notes, doc.internal.pageSize.width - 28);
    doc.text(notesLines, 14, currentY);
    currentY += (notesLines.length * 5) + 5;
  }
  
  currentY = Math.max(currentY, doc.internal.pageSize.height - 40); 
  doc.setLineWidth(0.2);
  doc.line(14, currentY, doc.internal.pageSize.width - 14, currentY);
  currentY += 7;
  doc.setFontSize(10);
  doc.text('Firma Cliente: _________________________', 14, currentY);
  doc.text('Firma Taller: _________________________', doc.internal.pageSize.width - 14, currentY, { align: 'right' });

  addFooter(doc);
  doc.save(`Orden_Trabajo_${workOrder.order_number}.pdf`);
};