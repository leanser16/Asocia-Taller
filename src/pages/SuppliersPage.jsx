import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import SupplierForm from '@/components/forms/SupplierForm';
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

const SuppliersPage = () => {
  const { data, addData, updateData, deleteData, loading } = useData();
  const { suppliers = [], purchases = [] } = data;
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const { toast } = useToast();

  const filteredSuppliers = useMemo(() =>
    suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [suppliers, searchTerm]
  );

  const handleSaveSupplier = async (supplierData) => {
    try {
      if (currentSupplier) {
        await updateData('suppliers', currentSupplier.id, supplierData);
        toast({ title: "Proveedor Actualizado", description: `El proveedor ${supplierData.name} ha sido actualizado.` });
      } else {
        await addData('suppliers', supplierData);
        toast({ title: "Proveedor Creado", description: `El proveedor ${supplierData.name} ha sido creado.` });
      }
      setIsFormOpen(false);
      setCurrentSupplier(null);
    } catch (error) {
      toast({ title: "Error", description: `Error al guardar el proveedor: ${error.message}`, variant: "destructive" });
    }
  };

  const openForm = (supplier = null) => {
    setCurrentSupplier(supplier);
    setIsFormOpen(true);
  };

  const confirmDelete = (id) => {
    setSupplierToDelete(id);
  };

  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return;

    const hasPurchases = purchases.some(p => p.supplier_id === supplierToDelete);
    if (hasPurchases) {
      toast({
        title: "Error de Borrado",
        description: "No se puede eliminar el proveedor porque tiene compras asociadas. Por favor, elimine esas compras primero.",
        variant: "destructive",
        duration: 5000,
      });
      setSupplierToDelete(null);
      return;
    }

    try {
      await deleteData('suppliers', supplierToDelete);
      toast({ title: "Proveedor Eliminado", description: "El proveedor ha sido eliminado.", variant: "destructive" });
    } catch (error) {
      toast({ title: "Error", description: `Error al eliminar el proveedor: ${error.message}`, variant: "destructive" });
    } finally {
      setSupplierToDelete(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Cargando proveedores...</div>;
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
        <h1 className="text-3xl font-bold tracking-tight text-primary">Proveedores</h1>
        <Button onClick={() => openForm()} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white w-full md:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" /> Nuevo Proveedor
        </Button>
      </div>

      <div className="w-full">
        <Input
          placeholder="Buscar por nombre..."
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
              <TableHead>Contacto</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
               <TableHead>CUIT</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contact_person}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>{supplier.cuit}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openForm(supplier)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => confirmDelete(supplier.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="5" className="text-center">
                  No se encontraron proveedores.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setCurrentSupplier(null); setIsFormOpen(isOpen); }}>
        <DialogContent className="sm:max-w-lg glassmorphism">
          <DialogHeader>
            <DialogTitle className="text-primary">{currentSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
            <DialogDescription>
              {currentSupplier ? 'Modifica los datos del proveedor.' : 'Ingresa los datos del nuevo proveedor.'}
            </DialogDescription>
          </DialogHeader>
          <SupplierForm
            supplier={currentSupplier}
            onSave={handleSaveSupplier}
            onCancel={() => { setIsFormOpen(false); setCurrentSupplier(null); }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!supplierToDelete} onOpenChange={() => setSupplierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el proveedor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSupplier} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default SuppliersPage;