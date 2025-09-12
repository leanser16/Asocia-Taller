import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";

const SupplierForm = ({ supplier, onSave, onCancel }) => {
  // Estado para manejar los datos del formulario de forma controlada
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    cuit: supplier?.cuit || '',
    taxStatus: supplier?.taxStatus || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    contact_person: supplier?.contact_person || '',
    address: supplier?.address || '',
  });

  // Manejador para cambios en los inputs de texto
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Manejador específico para el cambio en el componente Select
  const handleTaxStatusChange = (value) => {
    setFormData(prev => ({ ...prev, taxStatus: value }));
  };

  // Manejador para el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3">
      {/* Fila para Nombre y CUIT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nombre / Razón Social</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Autopartes S.R.L." required />
        </div>
        <div>
          <Label htmlFor="cuit">CUIT</Label>
          <Input id="cuit" name="cuit" value={formData.cuit} onChange={handleChange} placeholder="Ej: 20-12345678-9" />
        </div>
      </div>

      {/* Fila para Condición IVA y Correo Electrónico */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="taxStatus">Condición frente al IVA</Label>
          <Select value={formData.taxStatus} onValueChange={handleTaxStatusChange}>
            <SelectTrigger id="taxStatus">
              <SelectValue placeholder="Seleccionar condición..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RI">Responsable Inscripto</SelectItem>
              <SelectItem value="Monotributista">Monotributista</SelectItem>
              <SelectItem value="Exento">Exento</SelectItem>
              <SelectItem value="No Inscripto">No Inscripto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="email">Correo Electrónico</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="contacto@proveedor.com" />
        </div>
      </div>

      {/* Fila para Teléfono y Persona de Contacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Ej: 555-987-6543" />
        </div>
        <div>
          <Label htmlFor="contactPerson">Persona de Contacto</Label>
          <Input id="contactPerson" name="contact_person" value={formData.contact_person} onChange={handleChange} placeholder="Ej: Ana Pérez" />
        </div>
      </div>

      {/* Fila para Dirección */}
      <div>
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Ej: Av. Principal 456" />
      </div>

      <DialogFooter className="pt-6">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90">Guardar Proveedor</Button>
      </DialogFooter>
    </form>
  );
};

export default SupplierForm;
