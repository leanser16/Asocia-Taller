import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import CustomerForm from '@/components/forms/CustomerForm';
import { useData } from '@/contexts/DataContext';
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

const CustomersPage = () => {
  const { data, addData, updateData, deleteData, loading } = useData();
  const { customers = [], sales = [], vehicles = [], work_orders = [] } = data;
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const { toast } = useToast();

  const filteredCustomers = useMemo(() =>
    customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.taxid && customer.taxid.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [customers, searchTerm]
  );

  const handleSaveCustomer = async (customerData) => {
    try {
      if (currentCustomer) {
        await updateData('customers', currentCustomer.id, customerData);
        toast({ title: "Cliente Actualizado", description: `El cliente ${customerData.name} ha sido actualizado.` });
      } else {
        await addData('customers', customerData);
        toast({ title: "Cliente Creado", description: `El cliente ${customerData.name} ha sido creado.` });
      }
      setIsFormOpen(false);
      setCurrentCustomer(null);
    } catch (error) {
      toast({ title: "Error", description: `Error al guardar el cliente: ${error.message}`, variant: "destructive" });
    }
  };

  const openForm = (customer = null) => {
    setCurrentCustomer(customer);
    setIsFormOpen(true);
  };

  const confirmDelete = (id) => {
    setCustomerToDelete(id);
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    const hasSales = sales.some(sale => sale.customer_id === customerToDelete);
    const hasVehicles = vehicles.some(vehicle => vehicle.customer_id === customerToDelete);
    const hasWorkOrders = work_orders.some(wo => wo.customer_id === customerToDelete);

    if (hasSales || hasVehicles || hasWorkOrders) {
      toast({
        title: "Error de Borrado",
        description: "No se puede eliminar el cliente porque tiene facturas, vehículos u órdenes de trabajo asociadas. Por favor, elimine esos registros primero.",
        variant: "destructive",
        duration: 5000,
      });
      setCustomerToDelete(null);
      return;
    }

    try {
      await deleteData('customers', customerToDelete);
      toast({ title: "Cliente Eliminado", description: "El cliente ha sido eliminado.", variant: "destructive" });
    } catch (error) {
      toast({ title: "Error", description: `Error al eliminar el cliente: ${error.message}`, variant: "destructive" });
    } finally {
      setCustomerToDelete(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Cargando clientes...</div>;
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
        <h1 className="text-3xl font-bold tracking-tight text-primary">Clientes</h1>
        <Button onClick={() => openForm()} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white w-full md:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" /> Nuevo Cliente
        </Button>
      </div>

      <div className="w-full">
        <Input
          placeholder="Buscar por nombre o CUIT/DNI..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-lg border overflow-hidden glassmorphism">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>CUIT/DNI</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.taxid}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openForm(customer)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => confirmDelete(customer.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="5" className="text-center">
                  No se encontraron clientes.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setCurrentCustomer(null); setIsFormOpen(isOpen); }}>
        <DialogContent className="sm:max-w-2xl glassmorphism">
          <DialogHeader>
            <DialogTitle className="text-primary">{currentCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
            <DialogDescription>
              {currentCustomer ? 'Modifica los datos del cliente.' : 'Ingresa los datos del nuevo cliente.'}
            </DialogDescription>
          </DialogHeader>
          <CustomerForm
            customer={currentCustomer}
            onSave={handleSaveCustomer}
            onCancel={() => { setIsFormOpen(false); setCurrentCustomer(null); }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default CustomersPage;