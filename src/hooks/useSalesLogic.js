import { useCallback } from 'react';
import { formatSaleNumber } from '@/lib/utils';

export const useSalesLogic = ({ sales, customers, addData, updateData, deleteData, toast }) => {

  const handleSaveSale = useCallback(async (saleData, currentSale) => {
    try {
        const isEditing = !!currentSale;
        
        const dataToSave = {
            customer_id: saleData.customer_id,
            sale_date: saleData.sale_date,
            due_date: saleData.due_date,
            total: saleData.total,
            balance: saleData.balance,
            status: saleData.status,
            type: saleData.type,
            items: saleData.items,
            payment_type: saleData.payment_type,
            payment_methods: saleData.payment_methods,
            sale_number_parts: saleData.sale_number_parts,
            sale_number: saleData.sale_number,
        };
        
        let savedSale;
        const checkOperations = [];

        if (isEditing) {
            const oldSale = sales.find(s => s.id === currentSale.id);
            const oldCheckPayments = oldSale?.payment_methods?.filter(p => p.method === 'Cheque') || [];
            
            for (const oldPayment of oldCheckPayments) {
                if (oldPayment.checkDetails?.id) {
                    checkOperations.push({ action: 'delete', id: oldPayment.checkDetails.id });
                }
            }
        }

        const newCheckPayments = saleData.payment_methods?.filter(p => p.method === 'Cheque') || [];
        for (const payment of newCheckPayments) {
            checkOperations.push({ action: 'add', details: payment.checkDetails, amount: payment.amount, date: saleData.sale_date, customerId: saleData.customer_id });
        }
        
        if (isEditing) {
            savedSale = await updateData('sales', currentSale.id, dataToSave);
            toast({ title: "Documento Actualizado", description: `El documento ${formatSaleNumber(savedSale)} ha sido actualizado.` });
        } else {
            savedSale = await addData('sales', dataToSave);
            toast({ title: "Documento Creado", description: `El ${savedSale.type} ${formatSaleNumber(savedSale)} ha sido creado.` });
        }

        for (const op of checkOperations) {
            if (op.action === 'delete') {
                await deleteData('checks', op.id);
            } else if (op.action === 'add') {
                const customerName = customers.find(c => c.id === op.customerId)?.name || 'N/A';
                const checkToSave = {
                    check_number: op.details.checkNumber,
                    bank: op.details.bank,
                    amount: op.amount,
                    issue_date: op.date,
                    due_date: op.details.dueDate,
                    status: 'en_cartera',
                    type: 'recibido',
                    associated_document_id: savedSale.id,
                    holder: customerName,
                };
                const newCheck = await addData('checks', checkToSave);
                const paymentToUpdate = savedSale.payment_methods.find(p => p.method === 'Cheque' && p.checkDetails.checkNumber === newCheck.check_number);
                if (paymentToUpdate) {
                    paymentToUpdate.checkDetails.id = newCheck.id;
                }
            }
        }
        
        await updateData('sales', savedSale.id, { payment_methods: savedSale.payment_methods });

    } catch (error) {
        toast({ title: "Error", description: `Error al guardar la venta: ${error.message}`, variant: "destructive" });
    }
  }, [sales, customers, addData, updateData, deleteData, toast]);

  const handleDeleteSale = useCallback(async (saleId) => {
    if (!saleId) return;
    try {
        const sale = sales.find(s => s.id === saleId);
        if (sale && sale.payment_methods) {
            for (const payment of sale.payment_methods) {
                if (payment.method === 'Cheque' && payment.checkDetails?.id) {
                    await deleteData('checks', payment.checkDetails.id);
                }
            }
        }
        await deleteData('sales', saleId);
        toast({ title: "Documento Eliminado", description: `El documento ha sido eliminado junto con sus cheques asociados.`, variant: "destructive" });
    } catch (error) {
        toast({ title: "Error", description: `Error al eliminar: ${error.message}`, variant: "destructive" });
    }
  }, [sales, deleteData, toast]);

  const handleConvertToInvoice = useCallback(async (presupuesto) => {
    try {
      const pointOfSale = presupuesto.sale_number_parts?.pointOfSale || '0001';
      const lastInvoiceNumber = sales
        .filter(s => s.type === 'Factura' && s.sale_number_parts?.pointOfSale === pointOfSale)
        .reduce((max, s) => {
          const num = parseInt(s.sale_number_parts.number, 10);
          return num > max ? num : max;
        }, 0);
      
      const newInvoiceNumber = String(lastInvoiceNumber + 1).padStart(8, '0');

      const newInvoiceNumberParts = {
          ...presupuesto.sale_number_parts,
          letter: 'A',
          number: newInvoiceNumber,
      };

      const newInvoiceData = {
        ...presupuesto,
        type: 'Factura',
        status: 'Pendiente de Pago',
        balance: presupuesto.total,
        payment_methods: [],
        payment_type: 'Cuenta Corriente',
        sale_number_parts: newInvoiceNumberParts,
        sale_number: `${newInvoiceNumberParts.letter}-${pointOfSale}-${newInvoiceNumberParts.number}`,
      };
      delete newInvoiceData.id; 
      
      const savedInvoice = await addData('sales', newInvoiceData);
      
      await updateData('sales', presupuesto.id, { status: 'Facturado' });
      
      toast({ title: "Presupuesto Convertido", description: `El presupuesto se convirtió a la factura ${formatSaleNumber(savedInvoice)}.`});
    } catch (error) {
      toast({ title: "Error", description: `Error al convertir: ${error.message}`, variant: "destructive" });
    }
  }, [sales, addData, updateData, toast]);
      
  const handleApprovePresupuesto = useCallback(async (id) => {
    try {
      await updateData('sales', id, { status: 'Aprobado' });
      toast({ title: "Presupuesto Aprobado" });
    } catch (error) {
      toast({ title: "Error", description: `Error al aprobar: ${error.message}`, variant: "destructive" });
    }
  }, [updateData, toast]);
      
  const handleRejectPresupuesto = useCallback(async (id) => {
    try {
      await updateData('sales', id, { status: 'Rechazado' });
      toast({ title: "Presupuesto Rechazado" });
    } catch (error) {
      toast({ title: "Error", description: `Error al rechazar: ${error.message}`, variant: "destructive" });
    }
  }, [updateData, toast]);

  return {
    handleSaveSale,
    handleDeleteSale,
    handleConvertToInvoice,
    handleApprovePresupuesto,
    handleRejectPresupuesto,
  };
};