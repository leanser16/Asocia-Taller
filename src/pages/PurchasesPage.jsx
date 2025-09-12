import React, { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useData } from '@/contexts/DataContext';
import { usePurchasesLogic } from '@/hooks/usePurchasesLogic';
import PurchasesHeader from '@/components/purchases/PurchasesHeader';
import PurchasesTable from '@/components/purchases/PurchasesTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import PurchaseForm from '@/components/purchases/PurchaseForm';
import SupplierForm from '@/components/forms/SupplierForm';
import { generatePurchasePDF } from '@/lib/purchasePdf';
import { useAuth } from '@/contexts/SupabaseAuthContext';


const PurchasesPage = () => {
    const { data, addData, fetchData } = useData();
    const { organization, user } = useAuth();
    const { toast } = useToast();
    const { handleSavePurchase, handleDeletePurchase } = usePurchasesLogic();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [sortConfig, setSortConfig] = useState({ key: 'purchase_date', direction: 'desc' });

    const statusConfig = {
      'Pagada': { color: 'bg-green-500' },
      'Pendiente de Pago': { color: 'bg-yellow-500' },
      'Anulada': { color: 'bg-red-500' },
    };

    const handleOpenForm = (purchase = null) => {
        setSelectedPurchase(purchase);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedPurchase(null);
    };

    const handleSave = async (purchaseData) => {
        try {
            const purchaseToSave = {
                ...purchaseData,
                id: selectedPurchase?.id,
            };
            const savedPurchase = await handleSavePurchase(purchaseToSave, selectedPurchase);
            
            toast({
                title: `Compra ${selectedPurchase ? 'actualizada' : 'creada'}`,
                description: `La compra para el proveedor ${data.suppliers.find(s => s.id === savedPurchase.supplier_id)?.name || ''} ha sido guardada.`,
            });
            handleCloseForm();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error al guardar la compra",
                description: error.message,
            });
        }
    };

    const handleDelete = async (purchaseId) => {
        try {
            await handleDeletePurchase(purchaseId);
            toast({
                title: "Compra eliminada",
                description: "La compra ha sido eliminada exitosamente.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error al eliminar la compra",
                description: error.message,
            });
        }
    };
    
    const handlePrint = (purchase) => {
        const supplier = data.suppliers.find(s => s.id === purchase.supplier_id);
        const purchaseProducts = data.purchase_products;
        generatePurchasePDF(purchase, supplier, purchaseProducts, organization, user);
    };

    const handleQuickAddSupplier = async (supplierData) => {
        try {
            await addData('suppliers', supplierData);
            toast({
                title: "Proveedor Creado",
                description: `El proveedor ${supplierData.name} ha sido creado.`,
            });
            setIsSupplierFormOpen(false);
            fetchData();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error al crear proveedor",
                description: error.message,
            });
        }
    };

    const sortedAndFilteredPurchases = useCallback(() => {
        if (!data.purchases || !data.suppliers) return [];

        let filtered = data.purchases.map(p => ({
            ...p,
            supplierName: data.suppliers.find(s => s.id === p.supplier_id)?.name || 'N/A'
        })).filter(p => {
            const supplierName = p.supplierName.toLowerCase();
            const documentNumber = p.document_number_parts ? `${p.document_number_parts.pointOfSale}-${p.document_number_parts.number}` : '';
            const searchTermLower = searchTerm.toLowerCase();

            const matchesSearch = supplierName.includes(searchTermLower) || documentNumber.includes(searchTermLower);

            if (dateRange.from && dateRange.to) {
                const purchaseDate = new Date(p.purchase_date);
                const fromDate = new Date(dateRange.from);
                fromDate.setUTCHours(0, 0, 0, 0);
                const toDate = new Date(dateRange.to);
                toDate.setUTCHours(23, 59, 59, 999);
                if (purchaseDate < fromDate || purchaseDate > toDate) {
                    return false;
                }
            }
            return matchesSearch;
        });

        return filtered.sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];
            
            if (sortConfig.key === 'supplierName') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [data.purchases, data.suppliers, searchTerm, dateRange, sortConfig]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const purchasesToDisplay = sortedAndFilteredPurchases();

    return (
        <main className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col gap-6">
            <PurchasesHeader 
                onNewPurchase={() => handleOpenForm()}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
            />
            <PurchasesTable 
                purchases={purchasesToDisplay}
                statusConfig={statusConfig}
                onEdit={handleOpenForm}
                onDelete={handleDelete}
                onPrint={handlePrint}
                onSort={handleSort}
                sortConfig={sortConfig}
            />

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{selectedPurchase ? 'Editar Compra' : 'Nueva Compra'}</DialogTitle>
                        <DialogDescription>
                            {selectedPurchase ? 'Modifica los detalles de la compra.' : 'Completa los detalles para registrar una nueva compra.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-grow overflow-hidden">
                       <PurchaseForm
                            key={selectedPurchase?.id || 'new'}
                            purchase={selectedPurchase}
                            onSave={handleSave}
                            onCancel={handleCloseForm}
                            onQuickAddSupplier={() => setIsSupplierFormOpen(true)}
                            toast={toast}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isSupplierFormOpen} onOpenChange={setIsSupplierFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nuevo Proveedor Rápido</DialogTitle>
                        <DialogDescription>Ingresa los datos del nuevo proveedor.</DialogDescription>
                    </DialogHeader>
                    <SupplierForm 
                        onSave={handleQuickAddSupplier} 
                        onCancel={() => setIsSupplierFormOpen(false)} 
                    />
                </DialogContent>
            </Dialog>
        </main>
    );
};

export default PurchasesPage;