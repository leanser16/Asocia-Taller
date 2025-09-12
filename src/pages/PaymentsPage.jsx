import React, { useState, useMemo, useCallback } from 'react';
    import { motion } from 'framer-motion';
    import { PlusCircle, FileText } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { useToast } from "@/components/ui/use-toast";
    import { useData } from '@/contexts/DataContext';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import PaymentFormDialog from '@/components/payments/PaymentFormDialog';
    import PendingPaymentsTable from '@/components/payments/PendingPaymentsTable';
    import PaymentsHistoryTable from '@/components/payments/PaymentsHistoryTable';
    import AccountSummaryDialog from '@/components/collections/AccountSummaryDialog';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { getDaysUntilDue, formatPurchaseNumber } from '@/lib/utils';
    import { generateAccountSummaryPDF, generatePaymentsHistoryPDF } from '@/lib/pdfGenerator';
     import {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
    } from "@/components/ui/alert-dialog";

    const pageVariants = {
      initial: { opacity: 0, y: 20 },
      in: { opacity: 1, y: 0 },
      out: { opacity: 0, y: -20 },
    };

    const PaymentsPage = () => {
      const { data, addData, updateData, deleteData, loading } = useData();
      const { user, organization } = useAuth();
      const { purchases = [], payments = [], suppliers = [], checks = [] } = data;
      const [isFormOpen, setIsFormOpen] = useState(false);
      const [isSummaryOpen, setIsSummaryOpen] = useState(false);
      const [currentPayment, setCurrentPayment] = useState(null);
      const [selectedPurchase, setSelectedPurchase] = useState(null);
      const [paymentToDelete, setPaymentToDelete] = useState(null);
      const [activeTab, setActiveTab] = useState('pending');
      const { toast } = useToast();

      const pendingPurchases = useMemo(() => {
        return purchases
          .filter(p => p.payment_type === 'Cuenta Corriente' && p.status === 'Pendiente de Pago' && p.balance > 0.009)
          .map(p => ({
            ...p,
            supplierName: suppliers.find(s => s.id === p.supplier_id)?.name || 'N/A',
            daysUntilDue: getDaysUntilDue(p.due_date),
          }))
          .sort((a, b) => {
            const aDays = a.daysUntilDue === null ? Infinity : a.daysUntilDue;
            const bDays = b.daysUntilDue === null ? Infinity : b.daysUntilDue;
            return aDays - bDays;
          });
      }, [purchases, suppliers]);

      const paymentsWithDetails = useMemo(() => {
        const cashPurchasePayments = purchases
          .filter(p => p.payment_type === 'Contado' && Array.isArray(p.payment_methods) && p.payment_methods.length > 0)
          .flatMap(p => 
            p.payment_methods
            .filter(pm => parseFloat(pm.amount) > 0)
            .map((pm, index) => ({
              id: `${p.id}-cash-${index}`,
              isVirtual: true,
              payment_date: p.purchase_date,
              amount: parseFloat(pm.amount) || 0,
              method: pm.method,
              supplier_id: p.supplier_id,
              purchase_id: p.id,
            }))
          );

        const allPayments = [...payments, ...cashPurchasePayments];

        return allPayments.filter(p => p.amount > 0).map(payment => {
          const supplier = suppliers.find(s => s.id === payment.supplier_id);
          const purchase = purchases.find(p => p.id === payment.purchase_id);
          return {
            ...payment,
            supplierName: supplier ? supplier.name : 'Proveedor no asignado',
            purchaseFormattedNumber: purchase ? formatPurchaseNumber(purchase) : 'Compra no encontrada',
          };
        }).sort((a,b) => new Date(b.payment_date) - new Date(a.payment_date));
      }, [payments, suppliers, purchases]);
      
      const handleSavePayment = async (paymentData) => {
        try {
          const isEditing = !!paymentData.id && !paymentData.isVirtual;
          
          if (isEditing) {
            await updateData('payments', paymentData.id, paymentData);
            toast({ title: "Pago Actualizado", description: "El pago ha sido actualizado exitosamente." });
          } else {
            const purchaseToUpdate = purchases.find(s => s.id === paymentData.purchase_id);
            if (!purchaseToUpdate) {
              throw new Error("La compra asociada no fue encontrada.");
            }

            const newBalance = parseFloat(purchaseToUpdate.balance) - paymentData.amount;
            const newStatus = newBalance <= 0.009 ? 'Pagada' : 'Pendiente de Pago';
            
            const savedPayment = await addData('payments', paymentData);
            await updateData('purchases', paymentData.purchase_id, { balance: newBalance, status: newStatus });

            if (paymentData.method === 'Cheque' && paymentData.check_details) {
              const checkToSave = {
                check_number: paymentData.check_details.checkNumber,
                bank: paymentData.check_details.bank,
                amount: paymentData.amount,
                issue_date: paymentData.payment_date,
                due_date: paymentData.check_details.dueDate,
                status: 'en_cartera',
                type: 'emitido',
                associated_document_id: savedPayment.id,
                holder: suppliers.find(s => s.id === purchaseToUpdate.supplier_id)?.name || 'N/A',
              };
              await addData('checks', checkToSave);
            }
            toast({ title: "Pago Registrado", description: "El pago ha sido registrado exitosamente." });
          }
          setIsFormOpen(false);
          setCurrentPayment(null);
          setSelectedPurchase(null);
        } catch (error) {
          toast({ title: "Error", description: `Error al procesar el pago: ${error.message}`, variant: "destructive" });
        }
      };
      
      const handleDeletePayment = async () => {
        if (!paymentToDelete || paymentToDelete.isVirtual) return;

        try {
          const purchaseToUpdate = purchases.find(p => p.id === paymentToDelete.purchase_id);
          if (purchaseToUpdate) {
            const newBalance = parseFloat(purchaseToUpdate.balance) + parseFloat(paymentToDelete.amount);
            const newStatus = newBalance > 0 ? 'Pendiente de Pago' : purchaseToUpdate.status;
            await updateData('purchases', purchaseToUpdate.id, { balance: newBalance, status: newStatus });
          }
          
          if (paymentToDelete.method === 'Cheque') {
            const checkToDelete = checks.find(c => c.associated_document_id === paymentToDelete.id);
            if (checkToDelete) {
              await deleteData('checks', checkToDelete.id);
            }
          }

          await deleteData('payments', paymentToDelete.id);
          
          toast({ title: "Pago Eliminado", description: "El pago ha sido eliminado exitosamente." });
        } catch (error) {
           toast({ title: "Error", description: `Error al eliminar el pago: ${error.message}`, variant: "destructive" });
        } finally {
          setPaymentToDelete(null);
        }
      };

      const openPayForm = (purchase = null) => {
        setSelectedPurchase(purchase);
        setCurrentPayment(null);
        setIsFormOpen(true);
      };

      const openEditForm = (payment) => {
        if (payment.isVirtual) {
          toast({ title: "Acción no permitida", description: "Los pagos de compras de contado no se pueden editar. Modifique la compra directamente.", variant: "destructive" });
          return;
        }
        setCurrentPayment(payment);
        setSelectedPurchase(null);
        setIsFormOpen(true);
      };

       const confirmDelete = (payment) => {
         if (payment.isVirtual) {
          toast({ title: "Acción no permitida", description: "Los pagos de compras de contado no se pueden eliminar. Anule o modifique la compra.", variant: "destructive" });
          return;
        }
        setPaymentToDelete(payment);
      };
      
      const handleGenerateSummary = useCallback((entityId, summaryType) => {
        const supplier = suppliers.find(s => s.id === entityId);
        if (!supplier) {
          toast({ title: "Error", description: "Proveedor no encontrado.", variant: "destructive" });
          return;
        }
        
        if (summaryType === 'pending') {
            const supplierPurchases = purchases.filter(p => p.supplier_id === entityId && p.status === 'Pendiente de Pago' && p.balance > 0);
             if (supplierPurchases.length > 0) {
              generateAccountSummaryPDF(supplier, supplierPurchases, 'supplier', 'pending', organization, user);
              toast({ title: "Resumen Generado", description: `Se ha generado el resumen de cuenta para ${supplier.name}.` });
            } else {
              toast({ title: "Sin Deuda", description: "El proveedor seleccionado no tiene facturas pendientes de pago.", variant: "destructive" });
            }
        } else if (summaryType === 'history') {
             const supplierPayments = paymentsWithDetails.filter(p => p.supplier_id === entityId);
             if (supplierPayments.length > 0) {
                generatePaymentsHistoryPDF(supplier, supplierPayments, organization, user);
                toast({ title: "Historial Generado", description: `Se ha generado el historial de pagos para ${supplier.name}.` });
            } else {
                toast({ title: "Sin Pagos", description: "El proveedor seleccionado no tiene pagos registrados.", variant: "destructive" });
            }
        } else if (summaryType === 'all') {
            const supplierPurchases = purchases.filter(p => p.supplier_id === entityId);
             if (supplierPurchases.length > 0) {
                generateAccountSummaryPDF(supplier, supplierPurchases, 'supplier', 'all', organization, user);
                toast({ title: "Resumen Generado", description: `Se ha generado el resumen total para ${supplier.name}.` });
            } else {
                toast({ title: "Sin Documentos", description: "El proveedor no tiene documentos registrados.", variant: "destructive" });
            }
        }
        setIsSummaryOpen(false);
      }, [suppliers, purchases, paymentsWithDetails, organization, user, toast]);

      if (loading) {
        return <div className="flex items-center justify-center h-full">Cargando pagos...</div>;
      }

      return (
        <motion.div
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-primary">Gestión de Pagos</h1>
            <div className="flex gap-2 w-full md:w-auto">
              <Button onClick={() => setIsSummaryOpen(true)} variant="outline" className="w-full">
                <FileText className="mr-2 h-5 w-5" /> Generar Resumen
              </Button>
              <Button onClick={() => openPayForm()} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white w-full">
                <PlusCircle className="mr-2 h-5 w-5" /> Registrar Pago
              </Button>
            </div>
          </div>

          <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending">Cuentas por Pagar</TabsTrigger>
              <TabsTrigger value="history">Historial de Pagos</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4">
              <PendingPaymentsTable purchases={pendingPurchases} onPay={openPayForm} />
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <PaymentsHistoryTable 
                payments={paymentsWithDetails}
                onEdit={openEditForm}
                onDelete={confirmDelete}
              />
            </TabsContent>
          </Tabs>
          
          <PaymentFormDialog
            isOpen={isFormOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setCurrentPayment(null);
                setSelectedPurchase(null);
              }
              setIsFormOpen(isOpen);
            }}
            onSave={handleSavePayment}
            allPurchases={purchases.filter(p => p.payment_type === 'Cuenta Corriente')}
            purchase={selectedPurchase}
            payment={currentPayment}
          />
          
          <AccountSummaryDialog
            isOpen={isSummaryOpen}
            onOpenChange={setIsSummaryOpen}
            customers={suppliers}
            sales={purchases}
            collections={payments}
            onGenerate={handleGenerateSummary}
            entityType="supplier"
            summaryType={activeTab === 'pending' ? 'pending' : (activeTab === 'history' ? 'history' : 'all')}
          />

          <AlertDialog open={!!paymentToDelete} onOpenChange={() => setPaymentToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente el pago y
                  actualizará el saldo de la compra asociada.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive hover:bg-destructive/90">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      );
    };

    export default PaymentsPage;