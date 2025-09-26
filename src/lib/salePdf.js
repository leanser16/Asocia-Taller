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
        
        const paymentMethodsText = (sale.payment_methods && sale.payment_methods.length > 0)
          ? sale.payment_methods.map(p => p.method).join(', ')
          : 'N/A';
        doc.text(`Forma de Pago: ${paymentMethodsText}`, doc.internal.pageSize.width - 14, currentY, { align: 'right' });
        
        currentY += 7;
        doc.text(`Estado: ${sale.status}`, 14, currentY);
        if(sale.workOrderId) doc.text(`Orden de Trabajo: ${sale.workOrderId}`, doc.internal.pageSize.width - 14, currentY, { align: 'right' });
        currentY += 10;
        
        // Corrected fullClient creation to ensure all client properties are carried over
        const fullClient = {
          ...client, // Include all properties from the original client object
          name: sale.customerName || client?.name, // Override name if present in sale
          taxid: sale.customerTaxId || client?.taxid, // Override taxid if present in sale
          taxcondition: client?.taxcondition || 'N/A' // Ensure taxcondition is always present
        };
        
        // Corrected call to addClientInfo - removed sale.vehicleName
        currentY = addClientInfo(doc, fullClient, currentY);

        // If vehicle information needs to be displayed in the sale PDF,
        // it should be added here using a separate call or a dedicated function,
        // similar to how it's done in workOrderPdf.js using addVehicleInfo.
        // For now, focusing on fixing the addClientInfo argument error.

        doc.setLineWidth(0.2);
        doc.line(14, currentY - 3, doc.internal.pageSize.width - 14, currentY - 3);
        currentY += 5;

        const tableHeaders = [
          'Cant.',
          'Descripción',
          'P. Unitario',
          'IVA (%)',
          'Dto. (%)',
          'Total',
        ];
      
        const tableRows = sale.items.map(item => [
          String(Number(item.quantity) || 0),
          String(item.description || ''),
          String(formatCurrency(cleanAndParseFloat(item.unitPrice))),
          String(`${Number(item.iva) || 0}%`),
          String(`${Number(item.discount) || 0}%`),
          String(formatCurrency(cleanAndParseFloat(item.total))),
        ]);
      
        doc.autoTable({
          head: [tableHeaders],
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
        // Changed back to output to new window for testing, can be changed to doc.save() once confirmed working
        doc.output('dataurlnewwindow'); 
      };