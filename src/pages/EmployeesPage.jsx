import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useData } from '@/contexts/DataContext';
import { formatDate } from '@/lib/utils';
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

const EmployeeForm = ({ employee, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    position: employee?.position || '',
    phone: employee?.phone || '',
    email: employee?.email || '',
    hire_date: employee?.hire_date || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input name="name" value={formData.name} onChange={handleChange} placeholder="Nombre Completo" required />
      <Input name="position" value={formData.position} onChange={handleChange} placeholder="Cargo" />
      <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="Teléfono" />
      <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" />
      <Input name="hire_date" type="date" value={formData.hire_date} onChange={handleChange} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  );
};

const EmployeesPage = () => {
  const { data, addData, updateData, deleteData, loading } = useData();
  const { employees = [], work_orders = [] } = data;
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const { toast } = useToast();

  const filteredEmployees = useMemo(() =>
    employees.filter(employee =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [employees, searchTerm]
  );

  const handleSaveEmployee = async (employeeData) => {
    try {
      if (currentEmployee) {
        await updateData('employees', currentEmployee.id, employeeData);
        toast({ title: "Empleado Actualizado", description: `El empleado ${employeeData.name} ha sido actualizado.` });
      } else {
        await addData('employees', employeeData);
        toast({ title: "Empleado Creado", description: `El empleado ${employeeData.name} ha sido creado.` });
      }
      setIsFormOpen(false);
      setCurrentEmployee(null);
    } catch (error) {
      toast({ title: "Error", description: `Error al guardar el empleado: ${error.message}`, variant: "destructive" });
    }
  };

  const openForm = (employee = null) => {
    setCurrentEmployee(employee);
    setIsFormOpen(true);
  };

  const confirmDelete = (id) => {
    setEmployeeToDelete(id);
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    const employee = employees.find(e => e.id === employeeToDelete);
    const hasWorkOrders = work_orders.some(wo => wo.assigned_to === employee?.name);

    if (hasWorkOrders) {
      toast({
        title: "Error de Borrado",
        description: "No se puede eliminar el empleado porque tiene órdenes de trabajo asignadas. Por favor, reasigne o elimine esas órdenes primero.",
        variant: "destructive",
        duration: 5000,
      });
      setEmployeeToDelete(null);
      return;
    }

    try {
      await deleteData('employees', employeeToDelete);
      toast({ title: "Empleado Eliminado", description: "El empleado ha sido eliminado.", variant: "destructive" });
    } catch (error) {
      toast({ title: "Error", description: `Error al eliminar el empleado: ${error.message}`, variant: "destructive" });
    } finally {
      setEmployeeToDelete(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Cargando empleados...</div>;
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
        <h1 className="text-3xl font-bold tracking-tight text-primary">Empleados</h1>
        <Button onClick={() => openForm()} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white w-full md:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" /> Nuevo Empleado
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
              <TableHead>Cargo</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Fecha de Ingreso</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.phone}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{formatDate(employee.hire_date)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openForm(employee)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => confirmDelete(employee.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="6" className="text-center">
                  No se encontraron empleados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setCurrentEmployee(null); setIsFormOpen(isOpen); }}>
        <DialogContent className="sm:max-w-lg glassmorphism">
          <DialogHeader>
            <DialogTitle className="text-primary">{currentEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}</DialogTitle>
            <DialogDescription>
              {currentEmployee ? 'Modifica los datos del empleado.' : 'Ingresa los datos del nuevo empleado.'}
            </DialogDescription>
          </DialogHeader>
          <EmployeeForm
            employee={currentEmployee}
            onSave={handleSaveEmployee}
            onCancel={() => { setIsFormOpen(false); setCurrentEmployee(null); }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!employeeToDelete} onOpenChange={() => setEmployeeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el empleado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default EmployeesPage;