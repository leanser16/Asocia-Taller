import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";

const VehicleForm = ({ vehicle, customers, onSave, onCancel }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const vehicleData = {
      plate: formData.get('plate'),
      customer_id: formData.get('customerId'),
      brand: formData.get('brand'),
      model: formData.get('model'),
      year: formData.get('year'),
      color: formData.get('color'),
      vehicleType: formData.get('vehicleType'),
      vin: formData.get('chassisNumber'),
    };
    onSave(vehicleData);
  };

  const handleInputChange = (e) => {
    const { name, value, pattern } = e.target;
    if (pattern) {
      const regex = new RegExp(`^${pattern}$`);
      if (!regex.test(value)) {
        e.target.value = value.slice(0, -1);
      }
    }
    if (name === 'plate') {
      e.target.value = value.toUpperCase();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="plate">Patente</Label>
          <Input id="plate" name="plate" defaultValue={vehicle?.plate} placeholder="Solo letras y números" required pattern="[a-zA-Z0-9]*" onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="customerId">Cliente</Label>
          <Select name="customerId" defaultValue={vehicle?.customer_id} required>
              <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                  {customers && customers.length > 0 ? customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>{customer.name} ({customer.taxid || 'N/A'})</SelectItem>
                  )) : <SelectItem value="no-customers" disabled>No hay clientes cargados</SelectItem>}
              </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="brand">Marca</Label>
          <Input id="brand" name="brand" defaultValue={vehicle?.brand} placeholder="Solo letras" required pattern="[a-zA-Z\s]*" onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="model">Modelo</Label>
          <Input id="model" name="model" defaultValue={vehicle?.model} placeholder="Letras y números" required pattern="[a-zA-Z0-9\s]*" onChange={handleInputChange} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="year">Año</Label>
          <Input id="year" name="year" type="text" defaultValue={vehicle?.year} placeholder="4 dígitos" required pattern="\d*" maxLength="4" onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="color">Color (Opcional)</Label>
          <Input id="color" name="color" defaultValue={vehicle?.color} placeholder="Solo letras" pattern="[a-zA-Z\s]*" onChange={handleInputChange} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <Label htmlFor="vehicleType">Tipo de Vehículo</Label>
            <Select name="vehicleType" defaultValue={vehicle?.vehicleType}>
                <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Auto">Auto</SelectItem>
                    <SelectItem value="Camioneta">Camioneta</SelectItem>
                    <SelectItem value="Moto">Moto</SelectItem>
                    <SelectItem value="Camión">Camión</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
            </Select>
        </div>
         <div>
            <Label htmlFor="chassisNumber">Número de Chasis (Opcional)</Label>
            <Input id="chassisNumber" name="chassisNumber" defaultValue={vehicle?.vin} placeholder="Ej: 123ABC456DEF789G" />
        </div>
      </div>
      
      <DialogFooter className="pt-6">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90">Guardar Vehículo</Button>
      </DialogFooter>
    </form>
  );
};

export default VehicleForm;