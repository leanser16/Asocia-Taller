import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export function formatCurrency(number) {
    if (typeof number !== 'number' || isNaN(number)) {
        return '$ 0,00';
    }
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(number);
}

export function getDaysUntilDue(dueDate) {
  if (!dueDate) return null;
  const today = new Date();
  
  const [year, month, day] = dueDate.split('-').map(Number);
  const due = new Date(year, month - 1, day);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatDate(dateInput) {
    if (!dateInput) return 'N/A';
    try {
        // If dateInput is a string like '2023-12-25', it's treated as UTC.
        // To treat it as local, we need to ensure it's parsed correctly.
        // new Date('2023-12-25') can be problematic. new Date('2023-12-25T00:00:00') is better.
        const date = (dateInput instanceof Date) ? dateInput : new Date(dateInput.toString().includes('T') ? dateInput : dateInput + 'T00:00:00');
        
        if (isNaN(date.getTime())) {
          const dateString = dateInput.toString();
          const parts = dateString.split('-');
          if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
          return 'Fecha inválida';
        }
        // Use local timezone for display
        return date.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
    } catch (error) {
        return 'Fecha inválida';
    }
}

export function formatSaleNumber(sale) {
  if (!sale || !sale.sale_number_parts) {
    return sale?.sale_number || 'N/A';
  }
  const { letter, pointOfSale, number } = sale.sale_number_parts;
  const pv = String(pointOfSale).padStart(4, '0');
  const num = String(number).padStart(8, '0');
  return `${letter}-${pv}-${num}`;
}

export function formatPurchaseNumber(purchase) {
  if (!purchase || !purchase.document_number_parts) {
    return purchase?.document_number || 'N/A';
  }
  const { letter, pointOfSale, number } = purchase.document_number_parts;
  const pv = String(pointOfSale).padStart(4, '0');
  const num = String(number).padStart(8, '0');
  return `${letter}-${pv}-${num}`;
}