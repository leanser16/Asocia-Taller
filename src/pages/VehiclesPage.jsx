import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import VehicleForm from '@/components/forms/VehicleForm';
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

const VehiclesPage = () => {
  const { data, addData, updateData, deleteData, loading } = useData();
  const { vehicles = [], customers = [], work_orders = [] } = data;
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState(null);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const { toast } = useToast();

  const vehiclesWithCustomerNames = useMemo(() => {
    return vehicles.map(vehicle => {
      const customer = customers.find(c => c.id === vehicle.customer_id);
      return {
        ...vehicle,
        customerName: customer ? customer.name : 'Cliente no asignado',
      };
    });
  }, [vehicles, customers]);

  const filteredVehicles = useMemo(() =>
    vehiclesWithCustomerNames.filter(vehicle =>
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.plate && vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase())) ||
      vehicle.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [vehiclesWithCustomerNames, searchTerm]
  );

  const handleSaveVehicle = async (vehicleData) => {
    try {
      const dataToSave = {
        brand: vehicleData.brand,
        model: vehicleData.model,
        year: parseInt(vehicleData.year),
        plate: vehicleData.plate,
        vin: vehicleData.chassisNumber,
        customer_id: vehicleData.customerId,
        color: vehicleData.color,
        vehicleType: vehicleData.vehicleType,
      };

      if (currentVehicle) {
        await updateData('vehicles', currentVehicle.id, dataToSave);
        toast({ title: "Vehículo Actualizado", description: `El vehículo ${dataToSave.plate} ha sido actualizado.` });
      } else {
        await addData('vehicles', dataToSave);
        toast({ title: "Vehículo Creado", description: `El vehículo ${dataToSave.plate} ha sido creado.` });
      }
      setIsFormOpen(false);
      setCurrentVehicle(null);
    } catch (error) {
      toast({ title: "Error", description: `Error al guardar el vehículo: ${error.message}`, variant: "destructive" });
    }
  };

  const openForm = (vehicle = null) => {
    setCurrentVehicle(vehicle);
    setIsFormOpen(true);
  };

  const confirmDelete = (id) => {
    setVehicleToDelete(id);
  };

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;

    const hasWorkOrders = work_orders.some(wo => wo.vehicle_id === vehicleToDelete);
    if (hasWorkOrders) {
      toast({
        title: "Error de Borrado",
        description: "No se puede eliminar el vehículo porque tiene órdenes de trabajo asociadas. Por favor, elimine esas órdenes primero.",
        variant: "destructive",
        duration: 5000,
      });
      setVehicleToDelete(null);
      return;
    }

    try {
      await deleteData('vehicles', vehicleToDelete);
      toast({ title: "Vehículo Eliminado", description: "El vehículo ha sido eliminado.", variant: "destructive" });
    } catch (error) {
      toast({ title: "Error", description: `Error al eliminar el vehículo: ${error.message}`, variant: "destructive" });
    } finally {
      setVehicleToDelete(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Cargando vehículos...</div>;
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
        <h1 className="text-3xl font-bold tracking-tight text-primary">Vehículos</h1>
        <Button onClick={() => openForm()} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white w-full md:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" /> Nuevo Vehículo
        </Button>
      </div>

      <div className="w-full">
        <Input
          placeholder="Buscar por marca, modelo, patente o cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-lg border overflow-hidden glassmorphism">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Marca</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Año</TableHead>
              <TableHead>Patente</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVehicles.length > 0 ? (
              filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.brand}</TableCell>
                  <TableCell>{vehicle.model}</TableCell>
                  <TableCell>{vehicle.year}</TableCell>
                  <TableCell>{vehicle.plate}</TableCell>
                  <TableCell>{vehicle.customerName}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openForm(vehicle)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => confirmDelete(vehicle.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="6" className="text-center">
                  No se encontraron vehículos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setCurrentVehicle(null); setIsFormOpen(isOpen); }}>
        <DialogContent className="sm:max-w-lg glassmorphism">
          <DialogHeader>
            <DialogTitle className="text-primary">{currentVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}</DialogTitle>
            <DialogDescription>
              {currentVehicle ? 'Modifica los datos del vehículo.' : 'Ingresa los datos del nuevo vehículo.'}
            </DialogDescription>
          </DialogHeader>
          <VehicleForm
            vehicle={currentVehicle}
            customers={customers}
            onSave={handleSaveVehicle}
            onCancel={() => { setIsFormOpen(false); setCurrentVehicle(null); }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!vehicleToDelete} onOpenChange={() => setVehicleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el vehículo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVehicle} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default VehiclesPage;