import { useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const usePurchasesLogic = () => {
  const { data, addData, updateData, deleteData, fetchData } = useData();
  const { organization } = useAuth();
  const { checks = [], suppliers = [] } = data;

  const handleSavePurchase = useCallback(async (purchaseData, originalPurchase = null) => {
    const isEditing = !!purchaseData.id;
    let savedPurchase;

    const { 
      supplierId,
      date,
      dueDate,
      documentType,
      paymentType,
      ...restOfPurchaseData 
    } = purchaseData;
    
    const purchaseToSave = {
      ...restOfPurchaseData,
      supplier_id: supplierId,
      purchase_date: date,
      due_date: dueDate,
      document_type: documentType,
      payment_type: paymentType,
      status: paymentType === 'Cuenta Corriente' ? 'Pendiente de Pago' : (purchaseData.balance > 0.009 ? 'Pendiente de Pago' : 'Pagada'),
    };
    
    const supplierName = suppliers.find(s => s.id === supplierId)?.name || 'N/A';
    const checkPaymentMethods = purchaseData.payment_methods?.filter(pm => pm.method === 'Cheque') || [];

    if (isEditing) {
      savedPurchase = await updateData('purchases', purchaseData.id, purchaseToSave);
      
      const originalCheckPayments = originalPurchase?.payment_methods?.filter(pm => pm.method === 'Cheque') || [];
      const currentCheckDetails = checkPaymentMethods.map(p => p.checkDetails).filter(Boolean);

      const checksToDelete = originalCheckPayments.filter(p => 
        p.checkDetails && !currentCheckDetails.some(cd => cd.id === p.checkDetails.id)
      );

      for (const payment of checksToDelete) {
        const checkRecord = checks.find(c => c.type === 'emitido' && c.associated_document_id === savedPurchase.id && c.check_number === payment.checkDetails.checkNumber);
        if (checkRecord) {
          await deleteData('checks', checkRecord.id);
        }
      }

    } else {
      const purchasePayload = { ...purchaseToSave };
      savedPurchase = await addData('purchases', purchasePayload);
    }
    
    if (!savedPurchase || !savedPurchase.id) {
        throw new Error("No se pudo guardar la compra correctamente.");
    }
    
    await fetchData(); 

    for (const payment of checkPaymentMethods) {
      const checkDetails = payment.checkDetails;
      if (!checkDetails || !checkDetails.checkNumber) continue;

      const originalCheckDetail = isEditing && originalPurchase?.payment_methods
        ?.map(p => p.checkDetails)
        .find(cd => cd && cd.id === checkDetails.id);

      const checkNumberToFind = originalCheckDetail ? originalCheckDetail.checkNumber : checkDetails.checkNumber;

      const existingCheck = isEditing ? (data.checks || []).find(c => 
          c.type === 'emitido' && 
          c.associated_document_id === savedPurchase.id && 
          c.check_number === checkNumberToFind
      ) : null;
      
      const checkData = {
        type: 'emitido',
        check_number: checkDetails.checkNumber,
        bank: checkDetails.bank,
        amount: parseFloat(payment.amount),
        issue_date: purchaseToSave.purchase_date,
        due_date: checkDetails.dueDate,
        status: 'en_cartera',
        holder: supplierName,
        associated_document_id: savedPurchase.id,
        organization_id: organization.id,
      };

      if (existingCheck) {
        await updateData('checks', existingCheck.id, checkData);
      } else {
        await addData('checks', checkData);
      }
    }

    return savedPurchase;
  }, [data, addData, updateData, deleteData, checks, suppliers, organization, fetchData]);

  const handleDeletePurchase = useCallback(async (purchaseId) => {
    const relatedChecks = checks.filter(c => c.associated_document_id === purchaseId && c.type === 'emitido');
    for (const check of relatedChecks) {
      await deleteData('checks', check.id);
    }

    await deleteData('purchases', purchaseId);
  }, [checks, deleteData]);

  return { handleSavePurchase, handleDeletePurchase };
};