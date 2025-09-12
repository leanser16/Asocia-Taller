import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDate, formatSaleNumber, formatPurchaseNumber } from '@/lib/utils';
import { addHeader, addFooter, addClientInfo, addSupplierInfo, cleanAndParseFloat } from '@/lib/pdfUtils';

export const generateAccountSummaryPDF = async (entity, documents, entityType, summaryType, organization, user) => {
  const doc = new jsPDF();
  const title = summaryType === 'all' ? `Resumen Total de Documentos` : `Resumen de Cuenta Corriente`;
  
  await addHeader(doc, title, organization, user);

  let currentY = 47;
  if (entityType === 'customer') {
    currentY = addClientInfo(doc, entity, currentY);
  } else {
    currentY = addSupplierInfo(doc, entity, currentY);
  }
  
  doc.setLineWidth(0.2);
  doc.line(14, currentY - 3, doc.internal.pageSize.width - 14, currentY -3);
  currentY += 5;

  const docTitle = summaryType === 'all' ? 'Todos los Documentos' : 'Comprobantes Pendientes de Pago';
  doc.setFontSize(12);
  doc.setTextColor(40,40,40);
  doc.text(docTitle, 14, currentY);
  currentY += 7;

  const tableColumn = ["Fecha", "Tipo y N°", "Vencimiento", "Total", "Saldo Pendiente"];
  const tableRows = [];
  let totalBalance = 0;

  documents.forEach(docData => {
    const isSale = entityType === 'customer';
    const docNumber = isSale ? formatSaleNumber(docData) : formatPurchaseNumber(docData);
    const docDate = isSale ? docData.sale_date : docData.purchase_date;
    const docType = isSale ? docData.type : docData.document_type;

    tableRows.push([
      formatDate(docDate),
      `${docType} ${docNumber}`,
      formatDate(docData.due_date),
      formatCurrency(cleanAndParseFloat(docData.total)),
      formatCurrency(cleanAndParseFloat(docData.balance))
    ]);
    totalBalance += cleanAndParseFloat(docData.balance);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: currentY,
    theme: 'grid',
    headStyles: { fillColor: [63, 81, 181] },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } }
  });

  currentY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(`Saldo Total Pendiente: ${formatCurrency(totalBalance)}`, doc.internal.pageSize.width - 14, currentY, { align: 'right' });

  addFooter(doc);
  doc.save(`Resumen_Cuenta_${entity.name.replace(/\s/g, '_')}.pdf`);
};

export const generateCollectionsHistoryPDF = async (entity, collections, organization, user) => {
    const doc = new jsPDF();
    const title = `Historial de Cobros`;
    
    await addHeader(doc, title, organization, user);

    let currentY = 47;
    currentY = addClientInfo(doc, entity, currentY);

    doc.setLineWidth(0.2);
    doc.line(14, currentY - 3, doc.internal.pageSize.width - 14, currentY - 3);
    currentY += 5;

    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(`Listado de Cobros Realizados:`, 14, currentY);
    currentY += 7;

    const tableColumn = ["Fecha", "Ref. Documento", "Monto", "Método"];
    const tableRows = [];
    let totalCollected = 0;

    collections.forEach(coll => {
        tableRows.push([
            formatDate(coll.collection_date),
            coll.saleFormattedNumber,
            formatCurrency(cleanAndParseFloat(coll.amount)),
            coll.method
        ]);
        totalCollected += cleanAndParseFloat(coll.amount);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: currentY,
        theme: 'grid',
        headStyles: { fillColor: [63, 81, 181] },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 2: { halign: 'right' } }
    });

    currentY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Cobrado: ${formatCurrency(totalCollected)}`, doc.internal.pageSize.width - 14, currentY, { align: 'right' });

    addFooter(doc);
    doc.save(`Historial_Cobros_${entity.name.replace(/\s/g, '_')}.pdf`);
};

export const generatePaymentsHistoryPDF = async (entity, payments, organization, user) => {
    const doc = new jsPDF();
    const title = `Historial de Pagos`;
    
    await addHeader(doc, title, organization, user);

    let currentY = 47;
    currentY = addSupplierInfo(doc, entity, currentY);
    
    doc.setLineWidth(0.2);
    doc.line(14, currentY - 3, doc.internal.pageSize.width - 14, currentY - 3);
    currentY += 5;

    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(`Listado de Pagos Realizados:`, 14, currentY);
    currentY += 7;

    const tableColumn = ["Fecha", "Ref. Documento", "Monto", "Método"];
    const tableRows = [];
    let totalPaid = 0;

    payments.forEach(payment => {
        tableRows.push([
            formatDate(payment.payment_date),
            payment.purchaseFormattedNumber,
            formatCurrency(cleanAndParseFloat(payment.amount)),
            payment.method
        ]);
        totalPaid += cleanAndParseFloat(payment.amount);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: currentY,
        theme: 'grid',
        headStyles: { fillColor: [63, 81, 181] },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 2: { halign: 'right' } }
    });

    currentY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Pagado: ${formatCurrency(totalPaid)}`, doc.internal.pageSize.width - 14, currentY, { align: 'right' });

    addFooter(doc);
    doc.save(`Historial_Pagos_${entity.name.replace(/\s/g, '_')}.pdf`);
};