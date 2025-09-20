import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useData } from '@/contexts/DataContext';
import { formatDate, formatCurrency } from '@/lib/utils';
import WorkOrderFormDialog from '@/components/workorders/WorkOrderFormDialog';
import WorkOrderDetailDialog from '@/components/workorders/WorkOrderDetailDialog';
import CustomerForm from '@/components/forms/CustomerForm';
import VehicleForm from '@/components/forms/VehicleForm';
import ProductForm from '@/components/forms/ProductForm';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const statusConfig = {
  'Ingresado': 'bg-blue-500',
  'En Proceso': 'bg-yellow-500',
  'Finalizado': 'bg-green-500',
  'Cancelado': 'bg-red-500',
};

const parseNumber = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(',', '.'));
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

const OrderTable = ({ orders, statusConfig, handleStatusChange, openDetail, openForm, confirmDelete }) => (
    <div className="rounded-lg border overflow-hidden glassmorphism mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N° Orden</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Vehículo</TableHead>
            <TableHead>Fecha Ingreso</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Costo Final</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length > 0 ? (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.order_number}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{order.vehicleInfo}</TableCell>
                <TableCell>{formatDate(order.creation_date)}</TableCell>
                <TableCell>
                  <Select value={order.status} onValueChange={(newStatus) => handleStatusChange(order.id, newStatus)}>
                    <SelectTrigger className="w-[140px] border-none !bg-transparent p-0 focus:ring-0">
                      <SelectValue>
                        <Badge className={`${statusConfig[order.status]} hover:${statusConfig[order.status]} text-white`}>
                          {order.status}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(statusConfig).map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(order.calculated_final_cost || 0)}</TableCell>
                <TableCell className="text-right">
                  <div className='flex items-center justify-end space-x-2'>
                    <Button variant='outline' size='icon' onClick={() => openDetail(order)}><Eye className='h-4 w-4' /></Button>
                    <Separator orientation='vertical' className='h-6' />
                    <Button variant='outline' size='icon' onClick={() => openForm(order)}><Edit className='h-4 w-4' /></Button>
                    <Separator orientation='vertical' className='h-6' />
                    <Button variant='destructive' size='icon' onClick={() => confirmDelete(order.id)}><Trash2 className='h-4 w-4' /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan="7" className="text-center">
                No se encontraron órdenes de trabajo.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
);

const WorkOrdersPage = () => {
  const { data, addData, updateData, deleteData, loading, organization } = useData();
  const { work_orders = [], customers = [], vehicles = [] } = data;
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const { toast } = useToast();

  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productFormType, setProductFormType] = useState('Venta');
  const [activeTab, setActiveTab] = useState('en-proceso');

  const ordersWithDetails = useMemo(() => {
    if (!work_orders || !customers || !vehicles) return [];
    return work_orders.map(order => {
      const customer = customers.find(c => c.id === order.customer_id);
      const vehicle = vehicles.find(v => v.id === order.vehicle_id);

      let calculated_final_cost = 0;
      const separator = '---DATA---';
      const separatorIndex = (order.notes || '').indexOf(separator);
      if (separatorIndex !== -1) {
          const dataString = order.notes.substring(separatorIndex + separator.length);
          try {
              const extraData = JSON.parse(dataString);
              const serviceItems = extraData.service_items || [];
              const productItems = extraData.product_items || [];
              const allItems = [...serviceItems, ...productItems];
              
              calculated_final_cost = allItems.reduce((sum, item) => {
                  const price = parseNumber(item.price);
                  const quantity = parseNumber(item.quantity);
                  const vat = parseNumber(item.vat);
                  const discount = parseNumber(item.discount);
                  const itemTotal = (price * (1 - discount / 100)) * quantity * (1 + vat / 100);
                  return sum + itemTotal;
              }, 0);
          } catch (e) {
              console.error("Error parsing order notes for total calculation:", e);
              calculated_final_cost = 0;
          }
      }

      return {
        ...order,
        customerName: customer ? customer.name : 'N/A',
        vehicleInfo: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})` : 'N/A',
        calculated_final_cost,
      };
    }).sort((a, b) => b.order_number - a.order_number);
  }, [work_orders, customers, vehicles]);

  const filteredOrders = useMemo(() =>
    ordersWithDetails.filter(order =>
      (order.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (order.vehicleInfo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      String(order.order_number).includes(searchTerm)
    ),
    [ordersWithDetails, searchTerm]
  );

  const enProcesoOrders = useMemo(() => filteredOrders.filter(order => order.status !== 'Finalizado'), [filteredOrders]);
  const realizadasOrders = useMemo(() => filteredOrders.filter(order => order.status === 'Finalizado'), [filteredOrders]);

  const handleSaveOrder = async (orderData, isEditing) => {
    try {
      if (isEditing) {
        await updateData('work_orders', currentOrder.id, orderData);
        toast({ title: "Orden Actualizada", description: `La orden de trabajo ha sido actualizada.` });
      } else {
        const lastOrderNumber = work_orders.reduce((max, wo) => Math.max(max, wo.order_number || 0), 0);
        const newOrderData = { ...orderData, order_number: lastOrderNumber + 1, status: 'Ingresado' };
        await addData('work_orders', newOrderData);
        toast({ title: "Orden Creada", description: `La orden de trabajo ha sido creada.` });
      }
      setIsFormOpen(false);
      setCurrentOrder(null);
    } catch (error) {
      toast({ title: "Error", description: `Error al guardar la orden: ${error.message}`, variant: "destructive" });
    }
  };

  const handleSaveCustomer = async (customerData) => {
    try {
      await addData('customers', customerData);
      toast({ title: "Cliente Creado", description: "El nuevo cliente ha sido agregado." });
      setIsCustomerFormOpen(false);
    } catch (error) {
      toast({ title: "Error", description: `Error al guardar el cliente: ${error.message}`, variant: "destructive" });
    }
  };

  const handleSaveVehicle = async (vehicleData) => {
    try {
      const dataToSave = { ...vehicleData, year: parseInt(vehicleData.year, 10) || null };
      await addData('vehicles', dataToSave);
      toast({ title: "Vehículo Creado", description: "El nuevo vehículo ha sido agregado." });
      setIsVehicleFormOpen(false);
    } catch (error) {
      toast({ title: "Error", description: `Error al guardar el vehículo: ${error.message}`, variant: "destructive" });
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      const table = productFormType === 'Venta' ? 'sale_products' : 'purchase_products';
      let dataToSave;
      if (productFormType === 'Venta') {
        dataToSave = { name: productData.name, description: productData.description, category: productData.category, vat: productData.vat || 21, work_hours: parseFloat(productData.work_hours) || 0, price: parseFloat(productData.price) || 0 };
      } else { dataToSave = { name: productData.name, description: productData.description, category: productData.category, vat: productData.vat || 21, cost: parseFloat(productData.cost) || 0 }; }
      await addData(table, dataToSave);
      toast({ title: "Producto Creado", description: `El nuevo producto/servicio ha sido agregado.` });
      setIsProductFormOpen(false);
    } catch (error) {
      toast({ title: "Error", description: `Error al guardar el producto: ${error.message}`, variant: "destructive" });
    }
  };
  
  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateData('work_orders', id, { status: newStatus });
      toast({ title: "Estado Actualizado", description: "El estado de la orden ha sido actualizado." });
    } catch (error) {
      toast({ title: "Error", description: `Error al actualizar el estado: ${error.message}`, variant: "destructive" });
    }
  };

  const openForm = (order = null) => { setCurrentOrder(order); setIsFormOpen(true); };
  const openDetail = (order) => { setCurrentOrder(order); setIsDetailOpen(true); };
  const openProductForm = (type) => { setProductFormType(type); setIsProductFormOpen(true); }
  const confirmDelete = (id) => { setOrderToDelete(id); };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      await deleteData('work_orders', orderToDelete);
      toast({ title: "Orden Eliminada", description: "La orden de trabajo ha sido eliminada.", variant: "destructive" });
    } catch (error) {
      toast({ title: "Error", description: `Error al eliminar la orden: ${error.message}`, variant: "destructive" });
    } finally {
      setOrderToDelete(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full">Cargando órdenes de trabajo...</div>;

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Órdenes de Trabajo</h1>
        <Button onClick={() => openForm()} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white w-full md:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" /> Nueva Orden
        </Button>
      </div>

      <div className="w-full">
        <Input
          placeholder="Buscar por cliente, vehículo o N° de orden..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="en-proceso">Órdenes en Proceso</TabsTrigger>
          <TabsTrigger value="realizadas">Órdenes Realizadas</TabsTrigger>
        </TabsList>
        <TabsContent value="en-proceso">
            <OrderTable orders={enProcesoOrders} statusConfig={statusConfig} handleStatusChange={handleStatusChange} openDetail={openDetail} openForm={openForm} confirmDelete={confirmDelete} />
        </TabsContent>
        <TabsContent value="realizadas">
            <OrderTable orders={realizadasOrders} statusConfig={statusConfig} handleStatusChange={handleStatusChange} openDetail={openDetail} openForm={openForm} confirmDelete={confirmDelete} />
        </TabsContent>
      </Tabs>

      <WorkOrderFormDialog isOpen={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setCurrentOrder(null); setIsFormOpen(isOpen); }} onSave={handleSaveOrder} workOrder={currentOrder} onQuickAddCustomer={() => setIsCustomerFormOpen(true)} onQuickAddVehicle={() => setIsVehicleFormOpen(true)} onQuickAddProduct={openProductForm} />
      <WorkOrderDetailDialog isOpen={isDetailOpen} onOpenChange={(isOpen) => { if (!isOpen) setCurrentOrder(null); setIsDetailOpen(isOpen); }} workOrder={currentOrder} statusColors={statusConfig} />
      <Dialog open={isCustomerFormOpen} onOpenChange={setIsCustomerFormOpen}><DialogContent><DialogHeader><DialogTitle>Agregar Nuevo Cliente</DialogTitle></DialogHeader><CustomerForm onSave={handleSaveCustomer} onCancel={() => setIsCustomerFormOpen(false)} /></DialogContent></Dialog>
      <Dialog open={isVehicleFormOpen} onOpenChange={setIsVehicleFormOpen}><DialogContent><DialogHeader><DialogTitle>Agregar Nuevo Vehículo</DialogTitle></DialogHeader><VehicleForm onSave={handleSaveVehicle} onCancel={() => setIsVehicleFormOpen(false)} customers={customers} /></DialogContent></Dialog>
      <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Nuevo {productFormType === 'Venta' ? 'Servicio' : 'Producto'}</DialogTitle></DialogHeader><ProductForm onSave={handleSaveProduct} onCancel={() => setIsProductFormOpen(false)} productType={productFormType} workPriceHour={organization?.work_price_hour || 0} /></DialogContent></Dialog>
      <AlertDialog open={!!orderToDelete} onOpenChange={() => setOrderToDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente la orden de trabajo.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteOrder} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </motion.div>
  );
};

export default WorkOrdersPage;
