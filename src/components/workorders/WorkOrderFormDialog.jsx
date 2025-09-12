import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { useData } from '@/contexts/DataContext';
import { formatCurrency } from '@/lib/utils';
import { PlusCircle, Trash2 } from 'lucide-react';

const WorkOrderFormDialog = ({ isOpen, onOpenChange, workOrder, onSave }) => {
  const { data } = useData();
  const { customers = [], vehicles = [], employees = [], sale_products = [], organizations = [] } = data;
  const workPriceHour = organizations[0]?.work_price_hour || 0;

  const getInitialFormData = useCallback(() => {
    if (workOrder) {
      return {
        creation_date: workOrder.creation_date || new Date().toISOString().split('T')[0],
        customer_id: workOrder.customer_id || '',
        vehicle_id: workOrder.vehicle_id || '',
        assigned_to: workOrder.assigned_to || '',
        description: workOrder.description || '',
        parts: workOrder.parts || [{ productId: '', name: '', quantity: 1, price: 0, work_hours: 0 }],
        notes: workOrder.notes || '',
      };
    }
    return {
      creation_date: new Date().toISOString().split('T')[0],
      customer_id: '',
      vehicle_id: '',
      assigned_to: '',
      description: '',
      parts: [{ productId: '', name: '', quantity: 1, price: 0, work_hours: 0 }],
      notes: '',
    };
  }, [workOrder]);

  const [formData, setFormData] = useState(getInitialFormData);
  const [filteredVehicles, setFilteredVehicles] = useState([]);

  useEffect(() => {
    setFormData(getInitialFormData());
  }, [isOpen, workOrder, getInitialFormData]);

  useEffect(() => {
    if (formData.customer_id) {
      setFilteredVehicles(vehicles.filter(v => v.customer_id === formData.customer_id));
    } else {
      setFilteredVehicles([]);
      setFormData(prev => ({ ...prev, vehicle_id: '' }));
    }
  }, [formData.customer_id, vehicles]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePartChange = (index, field, value) => {
    const newParts = [...formData.parts];
    newParts[index][field] = value;

    if (field === 'productId') {
      const product = sale_products.find(p => p.id === value);
      if (product) {
        newParts[index].name = product.name;
        newParts[index].work_hours = product.work_hours || 0;
        newParts[index].price = (product.work_hours || 0) * workPriceHour;
      }
    }
    
    setFormData(prev => ({ ...prev, parts: newParts }));
  };

  const addPart = () => {
    setFormData(prev => ({
      ...prev,
      parts: [...prev.parts, { productId: '', name: '', quantity: 1, price: 0, work_hours: 0 }],
    }));
  };

  const removePart = (index) => {
    const newParts = formData.parts.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, parts: newParts }));
  };

  const calculateTotalCost = () => {
    return formData.parts.reduce((total, part) => {
      const quantity = parseFloat(part.quantity) || 0;
      const price = parseFloat(part.price) || 0;
      return total + (quantity * price);
    }, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalCost = calculateTotalCost();
    const dataToSave = {
      ...formData,
      final_cost: finalCost,
      parts: formData.parts.map(p => ({
        productId: p.productId,
        name: p.name,
        quantity: parseFloat(p.quantity) || 0,
        price: parseFloat(p.price) || 0,
      })),
    };
    onSave(dataToSave, !!workOrder);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl glassmorphism">
        <DialogHeader>
          <DialogTitle className="text-primary">{workOrder ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo'}</DialogTitle>
          <DialogDescription>
            {workOrder ? 'Modifica los detalles de la orden.' : 'Ingresa los detalles de la nueva orden.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="creation_date">Fecha</Label>
              <Input id="creation_date" name="creation_date" type="date" value={formData.creation_date} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="customer_id">Cliente</Label>
              <Select name="customer_id" value={formData.customer_id} onValueChange={(value) => handleSelectChange('customer_id', value)} required>
                <SelectTrigger><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vehicle_id">Vehículo</Label>
              <Select name="vehicle_id" value={formData.vehicle_id} onValueChange={(value) => handleSelectChange('vehicle_id', value)} required disabled={!formData.customer_id}>
                <SelectTrigger><SelectValue placeholder={!formData.customer_id ? "Selecciona un cliente primero" : "Selecciona un vehículo"} /></SelectTrigger>
                <SelectContent>
                  {filteredVehicles.length > 0 ? filteredVehicles.map(v => <SelectItem key={v.id} value={v.id}>{`${v.brand} ${v.model} (${v.plate})`}</SelectItem>) : <SelectItem value="no-vehicles" disabled>No hay vehículos</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assigned_to">Asignado A</Label>
              <Select name="assigned_to" value={formData.assigned_to} onValueChange={(value) => handleSelectChange('assigned_to', value)}>
                <SelectTrigger><SelectValue placeholder="Asignar a un empleado" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Servicio/Descripción</Label>
            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Detalles del servicio a realizar" required />
          </div>
          
          <div className="space-y-2 p-3 border rounded-md bg-muted/20">
            <Label className="text-base font-medium text-primary">Servicios y Materiales</Label>
            {formData.parts.map((part, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                <div className="md:col-span-6">
                  <Label htmlFor={`part-name-${index}`} className="sr-only">Nombre</Label>
                  <Select value={part.productId} onValueChange={(value) => handlePartChange(index, 'productId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto/servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {sale_products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor={`part-quantity-${index}`} className="sr-only">Cantidad</Label>
                  <Input id={`part-quantity-${index}`} type="number" value={part.quantity} onChange={(e) => handlePartChange(index, 'quantity', e.target.value)} placeholder="Cant." min="1" />
                </div>
                <div className="md:col-span-3">
                  <Label htmlFor={`part-price-${index}`} className="sr-only">Precio</Label>
                  <Input id={`part-price-${index}`} type="number" step="0.01" value={part.price} onChange={(e) => handlePartChange(index, 'price', e.target.value)} placeholder="Precio" />
                </div>
                <div className="md:col-span-1">
                  {formData.parts.length > 1 && (
                    <Button type="button" variant="destructive" size="icon" onClick={() => removePart(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addPart} className="mt-2">
              <PlusCircle className="mr-2 h-4 w-4" /> Agregar Servicio
            </Button>
          </div>

          <div>
            <Label htmlFor="notes">Notas Adicionales</Label>
            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Cualquier observación relevante" />
          </div>

          <div className="text-right text-xl font-bold text-primary">
            Costo Final: {formatCurrency(calculateTotalCost())}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">{workOrder ? 'Guardar Cambios' : 'Crear Orden'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkOrderFormDialog;