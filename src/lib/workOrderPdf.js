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

export const generateWorkOrderPDF = async (workOrder, client, vehicle, organization, user, extraData = {}, userNotes = '') => {
  console.log("--- generateWorkOrderPDF: Iniciando generación de PDF ---");
  console.log("Work Order:", workOrder);
  console.log("Client:", client);
  console.log("Vehicle:", vehicle);
  console.log("Extra Data:", extraData);
  console.log("User Notes:", userNotes);

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

  doc.setFontSize(12);
  doc.setTextColor(40,40,40);
  doc.text('Descripción del Servicio:', 14, currentY);
  currentY += 7;
  doc.setFontSize(10);
  doc.setTextColor(80,80,80);
  const serviceLines = doc.splitTextToSize(workOrder.description || 'N/A', doc.internal.pageSize.width - 28);
  doc.text(serviceLines, 14, currentY);
  currentY += (serviceLines.length * 5) + 5;
  
  let grandTotal = 0;
  const itemsTableColumn = ["Descripción", "Detalles", "Cantidad", "Precio Unit.", "Total"];
  let itemsTableRows = [];

  const productItems = extraData.product_items || [];
  const serviceItems = extraData.service_items || [];

  console.log("Product Items for PDF:", productItems);
  console.log("Service Items for PDF:", serviceItems);

  if (productItems.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(40,40,40);
    doc.text('Ítems de Productos:', 14, currentY);
    currentY += 7;
    productItems.forEach(item => {
      const total = cleanAndParseFloat(item.total);
      grandTotal += total;
      itemsTableRows.push([
        item.description,
        item.details || 'N/A',
        item.quantity,
        `${cleanAndParseFloat(item.price).toFixed(2)}`,
        `${total.toFixed(2)}`
      ]);
    });
    doc.autoTable({
      head: [itemsTableColumn],
      body: itemsTableRows,
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } }
    });
    currentY = doc.lastAutoTable.finalY + 5;
    itemsTableRows = []; // Clear for next section
  }

  if (serviceItems.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(40,40,40);
    doc.text('Ítems de Servicios:', 14, currentY);
    currentY += 7;
    serviceItems.forEach(item => {
      const total = cleanAndParseFloat(item.total);
      grandTotal += total;
      itemsTableRows.push([
        item.description,
        item.details || 'N/A',
        item.quantity,
        `${cleanAndParseFloat(item.price).toFixed(2)}`,
        `${total.toFixed(2)}`
      ]);
    });
    doc.autoTable({
      head: [itemsTableColumn],
      body: itemsTableRows,
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } }
    });
    currentY = doc.lastAutoTable.finalY + 5;
  }
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(40,40,40);
  doc.text(`Total General: ${formatCurrency(totalGeneral)}`, doc.internal.pageSize.width - 14, currentY, { align: 'right' });
  currentY += 10;

  if (userNotes) { 
    doc.setFontSize(12);
    doc.setTextColor(40,40,40);
    doc.text('Notas Adicionales:', 14, currentY);
    currentY += 7;
    doc.setFontSize(10);
    doc.setTextColor(80,80,80);
    const notesLines = doc.splitTextToSize(userNotes, doc.internal.pageSize.width - 28);
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
  console.log("--- generateWorkOrderPDF: Intentando abrir PDF en nueva ventana ---");
  doc.output('dataurlnewwindow'); 
  console.log("--- generateWorkOrderPDF: Finalizado ---");
};