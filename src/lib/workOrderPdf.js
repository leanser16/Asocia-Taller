import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDate } from '@/lib/utils';
import { addHeader, addFooter, addClientInfo, addVehicleInfo } from '@/lib/pdfUtils';

const parseNumber = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(',', '.'));
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

export const generateWorkOrderPDF = async (workOrder, client, vehicle, organization, user, extraData, totalGeneral) => {
  const doc = new jsPDF();
  const title = `Orden de Trabajo N°: ${workOrder.order_number}`;
  
  await addHeader(doc, title, organization, user);

  let currentY = 47;
  doc.setFontSize(10);
  doc.setTextColor(80,80,80);
  doc.text(`Fecha Ingreso: ${formatDate(workOrder.creation_date)}`, 14, currentY);
  if (extraData.exit_date) {
      doc.text(`Fecha Salida: ${formatDate(extraData.exit_date)}`, doc.internal.pageSize.width / 2, currentY, { align: 'center' });
  }
  doc.text(`Estado: ${workOrder.status}`, doc.internal.pageSize.width - 14, currentY, { align: 'right' });
  currentY+= 7;
  doc.text(`Asignado a: ${workOrder.assigned_to || 'N/A'}`, 14, currentY);
  if (extraData.mileage) {
      doc.text(`Kilometraje: ${extraData.mileage} km`, doc.internal.pageSize.width - 14, currentY, { align: 'right' });
  }
  currentY += 10;

  currentY = addClientInfo(doc, client, currentY);
  currentY = addVehicleInfo(doc, vehicle, currentY);
  doc.setLineWidth(0.2);
  doc.line(14, currentY - 3, doc.internal.pageSize.width - 14, currentY -3);
  currentY += 5;
  
  const serviceItems = extraData.service_items || [];
  const productItems = extraData.product_items || [];
  const allItems = [...serviceItems, ...productItems];

  if (allItems.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(40,40,40);
    doc.text('Detalle de Servicios y Productos:', 14, currentY);
    currentY += 7;
    const tableColumns = ["Descripción", "Cant.", "P. Unit.", "IVA%", "Dto%", "Total Item"];
    const tableRows = [];
    
    allItems.forEach(item => {
      const price = parseNumber(item.price);
      const quantity = parseNumber(item.quantity);
      const vat = parseNumber(item.vat);
      const discount = parseNumber(item.discount);
      const itemTotal = (price * (1 - discount / 100)) * quantity * (1 + vat / 100);
      
      tableRows.push([
        item.description || 'N/A',
        quantity,
        formatCurrency(price),
        `${vat}%`,
        `${discount}%`,
        formatCurrency(itemTotal)
      ]);
    });
    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] },
      styles: { fontSize: 8.5, cellPadding: 2 },
      columnStyles: { 
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
      }
    });
    currentY = doc.lastAutoTable.finalY + 5;
  }
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(40,40,40);
  doc.text(`Total General: ${formatCurrency(totalGeneral)}`, doc.internal.pageSize.width - 14, currentY, { align: 'right' });
  currentY += 10;

  // Separate user notes from the JSON data blob
  const separator = '---DATA---';
  const separatorIndex = (workOrder.notes || '').indexOf(separator);
  let userNotes = workOrder.notes || '';
  if (separatorIndex !== -1) {
      userNotes = (workOrder.notes.substring(0, separatorIndex)).trim();
  }

  if (userNotes) {
    doc.setFontSize(12);
    doc.setTextColor(40,40,40);
    doc.text('Notas Adicionales:', 14, currentY);
    currentY += 7;
    doc.setFontSize(10);
    doc.setTextColor(80,80,80);
    const notesLines = doc.splitTextToSize(userNotes, doc.internal.pageSize.width - 28);
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