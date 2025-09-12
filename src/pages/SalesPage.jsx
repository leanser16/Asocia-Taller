import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SaleForm from '@/components/sales/SaleForm';
import CustomerForm from '@/components/forms/CustomerForm';
import VehicleForm from '@/components/forms/VehicleForm';
import SalesHeader from '@/components/sales/SalesHeader';
import SalesTable from '@/components/sales/SalesTable';
import { generateSalePDF, generateAccountSummaryPDF } from '@/lib/pdfGenerator';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { formatSaleNumber } from '@/lib/utils';
import AccountSummaryDialog from '@/components/collections/AccountSummaryDialog';
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
import { useSalesLogic } from '@/hooks/useSalesLogic';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const statusConfig = {
  'Pendiente': { color: 'bg-yellow-500', icon: 'Clock' },
  'Aprobado': { color: 'bg-blue-500', icon: 'CheckCircle' },
  'Rechazado': { color: 'bg-red-700', icon: 'XCircle' },
  'Facturado': { color: 'bg-cyan-500', icon: 'FileText' },
  'Pendiente de Pago': { color: 'bg-orange-500', icon: 'Clock' },
  'Pagado': { color: 'bg-green-500', icon: 'CheckCircle' },
  'Anulada': { color: 'bg-red-500', icon: 'XCircle' },
};

const paymentMethods = ["Efectivo", "Transferencia", "Tarjeta de Crédito", "Tarjeta de Débito", "Cheque", "Dolares"];

const SalesPage = () => {
  const { data, addData, updateData, deleteData, loading } = useData();
  const { user, organization } = useAuth();
  const { sales = [], customers = [], vehicles = [] } = data;
  const { toast } = useToast();
  
  const {
    handleDeleteSale,
    handleConvertToInvoice,
    handleApprovePresupuesto,
    handleRejectPresupuesto,
    handleSaveSale: logicHandleSaveSale,
  } = useSalesLogic({ sales, customers, addData, updateData, deleteData, toast });

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);

  const [currentSale, setCurrentSale] = useState(null);
  const [filterType, setFilterType] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');

  const salesWithDetails = useMemo(() => {
    if (!sales || !customers) return [];
    return sales.map(sale => {
      const customer = customers.find(c => c.id === sale.customer_id);
      let status = sale.status;
      if ((sale.type === 'Factura' || sale.type === 'Recibo') && sale.status !== 'Anulada') {
          status = parseFloat(sale.balance) <= 0.009 ? 'Pagado' : 'Pendiente de Pago';
      }
      return {
        ...sale,
        status,
        customerName: customer ? customer.name : 'Cliente Eliminado',
      };
    });
  }, [sales, customers]);

  const filteredSales = useMemo(() => salesWithDetails.filter(sale => {
    const typeMatch = filterType === 'Todos' || sale.type === filterType;
    const statusMatch = filterStatus === 'Todos' || sale.status === filterStatus;
    const searchMatch = (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        formatSaleNumber(sale).toLowerCase().includes(searchTerm.toLowerCase());
    return typeMatch && statusMatch && searchMatch;
  }), [salesWithDetails, searchTerm, filterType, filterStatus]);
  
  const handleSaveSale = async (saleData) => {
    await logicHandleSaveSale(saleData, currentSale);
    setIsFormOpen(false);
    setCurrentSale(null);
  };

  const openForm = (sale = null) => {
    setCurrentSale(sale);
    setIsFormOpen(true);
  };

  const confirmDelete = (id) => {
    setSaleToDelete(id);
  };

  const handlePrintSale = (sale) => {
    const customer = customers.find(c => c.id === sale.customer_id);
    generateSalePDF(sale, customer, organization, user);
    toast({ title: "PDF Generado", description: `Se ha generado el PDF para ${sale.type} ${formatSaleNumber(sale)}.` });
  };

  const handleSaveQuickCustomer = async (customerData) => {
    try {
      await addData('customers', customerData);
      toast({ title: "Cliente Creado", description: `El cliente ${customerData.name} ha sido creado.` });
      setIsCustomerFormOpen(false);
    } catch (error) {
      toast({ title: "Error", description: `Error al crear cliente: ${error.message}`, variant: "destructive" });
    }
  };

  const handleSaveQuickVehicle = async (vehicleData) => {
    try {
      const dataToSave = {
        brand: vehicleData.brand,
        model: vehicleData.model,
        year: parseInt(vehicleData.year),
        plate: vehicleData.licensePlate,
        vin: vehicleData.chassisNumber,
        customer_id: vehicleData.customerId,
      };
      await addData('vehicles', dataToSave);
      toast({ title: "Vehículo Creado", description: `El vehículo ${vehicleData.licensePlate} ha sido creado.` });
      setIsVehicleFormOpen(false);
    } catch (error) {
      toast({ title: "Error", description: `Error al crear vehículo: ${error.message}`, variant: "destructive" });
    }
  };

  const handleGenerateSummary = (customerId, summaryType) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
        toast({ title: "Error", description: "Cliente no encontrado.", variant: "destructive" });
        return;
    }

    let documentsToSummarize = [];
    if (summaryType === 'all') {
        documentsToSummarize = sales.filter(s => s.customer_id === customerId);
    } else { // 'pending' is the other type from this page for now
        documentsToSummarize = sales.filter(s => s.customer_id === customerId && s.status === 'Pendiente de Pago' && s.balance > 0);
    }
    
    if (documentsToSummarize.length > 0) {
      generateAccountSummaryPDF(customer, documentsToSummarize, 'customer', summaryType, organization, user);
      toast({ title: "Resumen Generado", description: `Se ha generado el resumen de cuenta para ${customer.name}.` });
      setIsSummaryOpen(false);
    } else {
      toast({ title: "Sin Documentos", description: "El cliente seleccionado no tiene documentos para este tipo de resumen.", variant: "destructive" });
    }
  };
      
  if (loading) {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-primary text-xl">Cargando ventas...</div>
        </div>
    );
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
        <h1 className="text-3xl font-bold tracking-tight text-primary">Gestión de Ventas</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={() => setIsSummaryOpen(true)} variant="outline" className="w-full">
            <FileText className="mr-2 h-5 w-5" /> Generar Resumen
          </Button>
          <Button onClick={() => openForm()} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white w-full md:w-auto">
            <PlusCircle className="mr-2 h-5 w-5" /> Nuevo Documento
          </Button>
        </div>
      </div>

      <SalesHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        statusConfig={statusConfig}
      />
    
      <SalesTable
        sales={filteredSales}
        statusConfig={statusConfig}
        onApprove={handleApprovePresupuesto}
        onReject={handleRejectPresupuesto}
        onConvertToInvoice={handleConvertToInvoice}
        onEdit={openForm}
        onDelete={confirmDelete}
        onPrint={handlePrintSale}
      />

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setCurrentSale(null); setIsFormOpen(isOpen); }}>
        <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col glassmorphism" aria-labelledby="sale-dialog-title">
          <DialogHeader>
            <DialogTitle id="sale-dialog-title" className="text-primary">{currentSale ? `Editar ${currentSale.type}` : 'Nuevo Documento de Venta'}</DialogTitle>
            <DialogDescription>
              {currentSale ? 'Modifica los detalles del documento.' : 'Ingresa los detalles del nuevo documento.'}
            </DialogDescription>
          </DialogHeader>
          <SaleForm
            sale={currentSale}
            onSave={handleSaveSale}
            onCancel={() => { setIsFormOpen(false); setCurrentSale(null); }}
            onQuickAddCustomer={() => setIsCustomerFormOpen(true)}
            onQuickAddVehicle={() => setIsVehicleFormOpen(true)}
            statusConfig={statusConfig}
            paymentMethods={paymentMethods}
            toast={toast}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isCustomerFormOpen} onOpenChange={setIsCustomerFormOpen}>
        <DialogContent className="sm:max-w-2xl glassmorphism">
          <DialogHeader>
            <DialogTitle className="text-primary">Nuevo Cliente Rápido</DialogTitle>
            <DialogDescription>Ingresa los datos del nuevo cliente.</DialogDescription>
          </DialogHeader>
          <CustomerForm 
            onSave={handleSaveQuickCustomer} 
            onCancel={() => setIsCustomerFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isVehicleFormOpen} onOpenChange={setIsVehicleFormOpen}>
        <DialogContent className="sm:max-w-lg glassmorphism">
          <DialogHeader>
            <DialogTitle className="text-primary">Nuevo Vehículo Rápido</DialogTitle>
            <DialogDescription>Ingresa los datos del nuevo vehículo.</DialogDescription>
          </DialogHeader>
          <VehicleForm 
            customers={customers}
            onSave={handleSaveQuickVehicle}
            onCancel={() => setIsVehicleFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AccountSummaryDialog
        isOpen={isSummaryOpen}
        onOpenChange={setIsSummaryOpen}
        customers={customers}
        sales={sales}
        onGenerate={handleGenerateSummary}
        entityType="customer"
        summaryType="all"
      />

      <AlertDialog open={!!saleToDelete} onOpenChange={() => setSaleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el documento de venta y todos los cheques asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteSale(saleToDelete)} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </motion.div>
  );
};

export default SalesPage;