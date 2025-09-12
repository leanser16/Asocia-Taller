import { formatCurrency, formatDate, formatSaleNumber, formatPurchaseNumber } from '@/lib/utils';

export const formatDateForPdf = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const correctedDate = new Date(date.getTime() + userTimezoneOffset);
  return correctedDate.toLocaleDateString('es-AR', { timeZone: 'UTC' });
};

const loadImageAsBase64 = async (url) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error loading image for PDF:", error);
        return null;
    }
};

export const addHeader = async (doc, title, organization, user) => {
  const logoUrl = organization?.logo_url;
  const workshopName = organization?.name || 'AsociaTaller';
  const ownerName = organization?.owner_name;
  const address = organization?.address;
  const phone = organization?.phone;
  const taxId = organization?.tax_id;

  let logoX = 14;
  let textX = 14;
  
  if (logoUrl) {
    const logoBase64 = await loadImageAsBase64(logoUrl);
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', 14, 12, 25, 25);
        textX = 45;
      } catch (e) {
        console.error("Error adding image to PDF, may be corrupt or unsupported:", e);
      }
    }
  }

  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text(workshopName, textX, 18);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  if (ownerName) {
    doc.text(ownerName, textX, 24);
  }
  if (address) {
    doc.text(address, textX, 28);
  }
  if (phone) {
    doc.text(`Tel: ${phone}`, textX, 32);
  }
  if (taxId) {
    doc.text(`CUIT/DNI: ${taxId}`, textX, 36);
  }
  
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text(title, doc.internal.pageSize.width - 14, 18, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Fecha de Emisión: ${formatDateForPdf(new Date().toISOString())}`, doc.internal.pageSize.width - 14, 24, { align: 'right' });

  doc.setLineWidth(0.5);
  doc.line(14, 42, doc.internal.pageSize.width - 14, 42);
};

export const addFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    doc.text('AsociaTaller - Sistema de Gestión', 14, doc.internal.pageSize.height - 10);
  }
};

export const addClientInfo = (doc, client, startY) => {
  doc.setFontSize(12);
  doc.setTextColor(40,40,40);
  doc.text('Cliente:', 14, startY);
  doc.setFontSize(10);
  doc.setTextColor(80,80,80);
  doc.text(`Nombre: ${client?.name || 'N/A'}`, 14, startY + 7);
  doc.text(`Email: ${client?.email || 'N/A'}`, 14, startY + 12);
  doc.text(`Teléfono: ${client?.phone || 'N/A'}`, 14, startY + 17);
  doc.text(`Dirección: ${client?.address || 'N/A'}`, 100, startY + 7);
  doc.text(`ID Fiscal: ${client?.taxid || 'N/A'}`, 100, startY + 12);
  doc.text(`Cond. IVA: ${client?.taxcondition || 'N/A'}`, 100, startY + 17);
  return startY + 25;
};

export const addVehicleInfo = (doc, vehicle, startY) => {
    if (!vehicle) return startY;
    doc.setFontSize(12);
    doc.setTextColor(40,40,40);
    doc.text('Vehículo:', 14, startY);
    doc.setFontSize(10);
    doc.setTextColor(80,80,80);
    doc.text(`Marca: ${vehicle?.brand || 'N/A'}`, 14, startY + 7);
    doc.text(`Modelo: ${vehicle?.model || 'N/A'}`, 14, startY + 12);
    doc.text(`Patente: ${vehicle?.plate || 'N/A'}`, 14, startY + 17);
    doc.text(`Año: ${vehicle?.year || 'N/A'}`, 100, startY + 7);
    doc.text(`Chasis: ${vehicle?.vin || 'N/A'}`, 100, startY + 12);
    doc.text(`Color: ${vehicle?.color || 'N/A'}`, 100, startY + 17);
    return startY + 25;
};

export const addSupplierInfo = (doc, supplier, startY) => {
  doc.setFontSize(12);
  doc.setTextColor(40,40,40);
  doc.text('Proveedor:', 14, startY);
  doc.setFontSize(10);
  doc.setTextColor(80,80,80);
  doc.text(`Nombre: ${supplier?.name || 'N/A'}`, 14, startY + 7);
  doc.text(`Email: ${supplier?.email || 'N/A'}`, 14, startY + 12);
  doc.text(`Teléfono: ${supplier?.phone || 'N/A'}`, 14, startY + 17);
  doc.text(`ID Fiscal: ${supplier?.taxId || 'N/A'}`, 100, startY + 7);
  doc.text(`Contacto: ${supplier?.contactPerson || 'N/A'}`, 100, startY + 12);
  return startY + 25;
};

export const cleanAndParseFloat = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const cleanedValue = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
        return parseFloat(cleanedValue) || 0;
    }
    return 0;
};