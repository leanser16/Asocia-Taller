import React, { useState, useMemo, useCallback } from 'react';
    import { motion } from 'framer-motion';
    import { PlusCircle, FileText } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { useToast } from "@/components/ui/use-toast";
    import { useData } from '@/contexts/DataContext';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import CollectionFormDialog from '@/components/collections/CollectionFormDialog';
    import PendingCollectionsTable from '@/components/collections/PendingCollectionsTable';
    import CollectionsHistoryTable from '@/components/collections/CollectionsHistoryTable';
    import AccountSummaryDialog from '@/components/collections/AccountSummaryDialog';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { getDaysUntilDue, formatSaleNumber } from '@/lib/utils';
    import { generateAccountSummaryPDF, generateCollectionsHistoryPDF } from '@/lib/pdfGenerator';
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

    const CollectionsPage = () => {
      const { data, addData, updateData, deleteData, loading } = useData();
      const { user, organization } = useAuth();
      const { sales = [], collections = [], customers = [], checks = [] } = data;
      const [isFormOpen, setIsFormOpen] = useState(false);
      const [isSummaryOpen, setIsSummaryOpen] = useState(false);
      const [currentCollection, setCurrentCollection] = useState(null);
      const [selectedSale, setSelectedSale] = useState(null);
      const [collectionToDelete, setCollectionToDelete] = useState(null);
      const [activeTab, setActiveTab] = useState('pending');
      const { toast } = useToast();

      const pendingSales = useMemo(() => {
        return sales
          .filter(sale => sale.payment_type === 'Cuenta Corriente' && sale.status === 'Pendiente de Pago' && sale.balance > 0.009)
          .map(sale => ({
            ...sale,
            customerName: customers.find(c => c.id === sale.customer_id)?.name || 'N/A',
            daysUntilDue: getDaysUntilDue(sale.due_date),
          }))
          .sort((a, b) => {
            const aDays = a.daysUntilDue === null ? Infinity : a.daysUntilDue;
            const bDays = b.daysUntilDue === null ? Infinity : b.daysUntilDue;
            return aDays - bDays;
          });
      }, [sales, customers]);

      const collectionsWithDetails = useMemo(() => {
        const cashSaleCollections = sales
          .filter(sale => sale.payment_type === 'Contado' && Array.isArray(sale.payment_methods) && sale.payment_methods.length > 0)
          .flatMap(sale => 
            sale.payment_methods.map((pm, index) => ({
              id: `${sale.id}-cash-${index}`,
              isVirtual: true,
              collection_date: sale.sale_date,
              amount: parseFloat(pm.amount) || 0,
              method: pm.method,
              customer_id: sale.customer_id,
              sale_id: sale.id,
            }))
          );

        const allCollections = [...collections, ...cashSaleCollections];

        return allCollections.map(collection => {
          const customer = customers.find(c => c.id === collection.customer_id);
          const sale = sales.find(s => s.id === collection.sale_id);
          return {
            ...collection,
            customerName: customer ? customer.name : 'Cliente no asignado',
            saleFormattedNumber: sale ? formatSaleNumber(sale) : 'Venta no encontrada',
          };
        }).sort((a,b) => new Date(b.collection_date) - new Date(a.collection_date));
      }, [collections, customers, sales]);

      const handleSaveCollection = async (collectionData) => {
        try {
          const isEditing = !!collectionData.id && !collectionData.isVirtual;
          
          if (isEditing) {
            await updateData('collections', collectionData.id, collectionData);
            toast({ title: "Cobro Actualizado", description: "El cobro ha sido actualizado exitosamente." });
          } else {
            const saleToUpdate = sales.find(s => s.id === collectionData.sale_id);
            if (!saleToUpdate) {
              throw new Error("La venta asociada no fue encontrada.");
            }

            const newBalance = parseFloat(saleToUpdate.balance) - collectionData.amount;
            const newStatus = newBalance <= 0.009 ? 'Pagado' : 'Pendiente de Pago';
            
            const savedCollection = await addData('collections', collectionData);
            await updateData('sales', collectionData.sale_id, { balance: newBalance, status: newStatus });

            if (collectionData.method === 'Cheque' && collectionData.check_details) {
              const checkToSave = {
                check_number: collectionData.check_details.checkNumber,
                bank: collectionData.check_details.bank,
                amount: collectionData.amount,
                issue_date: collectionData.collection_date,
                due_date: collectionData.check_details.dueDate,
                status: 'en_cartera',
                type: 'recibido',
                associated_document_id: savedCollection.id,
                holder: customers.find(c => c.id === saleToUpdate.customer_id)?.name || 'N/A',
              };
              await addData('checks', checkToSave);
            }
            toast({ title: "Cobro Registrado", description: "El cobro ha sido registrado exitosamente." });
          }
          setIsFormOpen(false);
          setCurrentCollection(null);
          setSelectedSale(null);
        } catch (error) {
          toast({ title: "Error", description: `Error al procesar el cobro: ${error.message}`, variant: "destructive" });
        }
      };
      
      const handleDeleteCollection = async () => {
        if (!collectionToDelete || collectionToDelete.isVirtual) return;

        try {
          const saleToUpdate = sales.find(s => s.id === collectionToDelete.sale_id);
          if (saleToUpdate) {
            const newBalance = parseFloat(saleToUpdate.balance) + parseFloat(collectionToDelete.amount);
            const newStatus = newBalance > 0 ? 'Pendiente de Pago' : saleToUpdate.status;
            await updateData('sales', saleToUpdate.id, { balance: newBalance, status: newStatus });
          }

          if (collectionToDelete.method === 'Cheque') {
            const checkToDelete = checks.find(c => c.associated_document_id === collectionToDelete.id);
            if (checkToDelete) {
              await deleteData('checks', checkToDelete.id);
            }
          }

          await deleteData('collections', collectionToDelete.id);
          
          toast({ title: "Cobro Eliminado", description: "El cobro ha sido eliminado exitosamente." });
        } catch (error) {
           toast({ title: "Error", description: `Error al eliminar el cobro: ${error.message}`, variant: "destructive" });
        } finally {
          setCollectionToDelete(null);
        }
      };

      const openCollectForm = (sale = null) => {
        setSelectedSale(sale);
        setCurrentCollection(null);
        setIsFormOpen(true);
      };

      const openEditForm = (collection) => {
        if (collection.isVirtual) {
          toast({ title: "Acción no permitida", description: "Los cobros de ventas de contado no se pueden editar. Modifique la venta directamente.", variant: "destructive" });
          return;
        }
        setCurrentCollection(collection);
        setSelectedSale(null);
        setIsFormOpen(true);
      };

      const confirmDelete = (collection) => {
         if (collection.isVirtual) {
          toast({ title: "Acción no permitida", description: "Los cobros de ventas de contado no se pueden eliminar. Anule o modifique la venta.", variant: "destructive" });
          return;
        }
        setCollectionToDelete(collection);
      };
      
      const handleGenerateSummary = useCallback((entityId, summaryType) => {
        const customer = customers.find(c => c.id === entityId);
        if (!customer) {
          toast({ title: "Error", description: "Cliente no encontrado.", variant: "destructive" });
          return;
        }

        if (summaryType === 'pending') {
            const customerSales = sales.filter(s => s.customer_id === entityId && s.status === 'Pendiente de Pago' && s.balance > 0);
            if (customerSales.length > 0) {
              generateAccountSummaryPDF(customer, customerSales, 'customer', 'pending', organization, user);
              toast({ title: "Resumen Generado", description: `Se ha generado el resumen de cuenta para ${customer.name}.` });
            } else {
              toast({ title: "Sin Deuda", description: "El cliente seleccionado no tiene facturas pendientes de pago.", variant: "destructive" });
            }
        } else if (summaryType === 'history') {
            const customerCollections = collectionsWithDetails.filter(c => c.customer_id === entityId);
             if (customerCollections.length > 0) {
                generateCollectionsHistoryPDF(customer, customerCollections, 'customer', organization, user);
                toast({ title: "Historial Generado", description: `Se ha generado el historial de cobros para ${customer.name}.` });
            } else {
                toast({ title: "Sin Cobros", description: "El cliente seleccionado no tiene cobros registrados.", variant: "destructive" });
            }
        } else if (summaryType === 'all') {
            const customerSales = sales.filter(s => s.customer_id === entityId);
            if (customerSales.length > 0) {
                generateAccountSummaryPDF(customer, customerSales, 'customer', 'all', organization, user);
                toast({ title: "Resumen Generado", description: `Se ha generado el resumen total para ${customer.name}.` });
            } else {
                toast({ title: "Sin Documentos", description: "El cliente no tiene documentos registrados.", variant: "destructive" });
            }
        }
        setIsSummaryOpen(false);
      }, [customers, sales, collectionsWithDetails, organization, user, toast]);


      if (loading) {
        return <div className="flex items-center justify-center h-full">Cargando cobros...</div>;
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
            <h1 className="text-3xl font-bold tracking-tight text-primary">Gestión de Cobros</h1>
            <div className="flex gap-2 w-full md:w-auto">
              <Button onClick={() => setIsSummaryOpen(true)} variant="outline" className="w-full">
                <FileText className="mr-2 h-5 w-5" /> Generar Resumen
              </Button>
              <Button onClick={() => openCollectForm()} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white w-full">
                <PlusCircle className="mr-2 h-5 w-5" /> Registrar Cobro
              </Button>
            </div>
          </div>

          <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending">Cuentas por Cobrar</TabsTrigger>
              <TabsTrigger value="history">Historial de Cobros</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4">
              <PendingCollectionsTable sales={pendingSales} onCollect={openCollectForm} />
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <CollectionsHistoryTable 
                collections={collectionsWithDetails} 
                onEdit={openEditForm}
                onDelete={confirmDelete}
              />
            </TabsContent>
          </Tabs>

          <CollectionFormDialog
            isOpen={isFormOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setCurrentCollection(null);
                setSelectedSale(null);
              }
              setIsFormOpen(isOpen);
            }}
            onSave={handleSaveCollection}
            allSales={sales.filter(s => s.payment_type === 'Cuenta Corriente')}
            sale={selectedSale}
            collection={currentCollection}
          />

          <AccountSummaryDialog
            isOpen={isSummaryOpen}
            onOpenChange={setIsSummaryOpen}
            customers={customers}
            sales={sales}
            collections={collections}
            onGenerate={handleGenerateSummary}
            entityType="customer"
            summaryType={activeTab === 'pending' ? 'pending' : (activeTab === 'history' ? 'history' : 'all')}
          />

          <AlertDialog open={!!collectionToDelete} onOpenChange={() => setCollectionToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente el cobro y
                  actualizará el saldo de la venta asociada.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCollection} className="bg-destructive hover:bg-destructive/90">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      );
    };

    export default CollectionsPage;