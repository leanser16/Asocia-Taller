import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from "@/components/ui/dialog";

const CustomerForm = ({ customer, onSave, onCancel }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const customerData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      type: formData.get('type'),
      taxid: formData.get('taxId'),
      city: formData.get('city'),
      postalcode: formData.get('postalCode'),
      fiscaladdress: formData.get('fiscalAddress'),
      taxcondition: formData.get('taxCondition'),
    };
    onSave(customerData);
  };

  const handleInputChange = (e) => {
    const { name, value, pattern } = e.target;
    if (pattern) {
      const regex = new RegExp(`^${pattern}$`);
      if (!regex.test(value)) {
        e.target.value = value.slice(0, -1);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3">
      <h3 className="text-lg font-medium text-primary border-b pb-2 mb-3">Datos Personales</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nombre Completo / Razón Social</Label>
          <Input id="name" name="name" defaultValue={customer?.name} placeholder="Ej: Juan Pérez o Empresa S.A." required pattern="[a-zA-Z0-9\s]*" onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="email">Correo Electrónico</Label>
          <Input id="email" name="email" type="email" defaultValue={customer?.email} placeholder="ejemplo@dominio.com" required />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" type="text" defaultValue={customer?.phone} placeholder="Solo números" pattern="\d*" onChange={handleInputChange} />
        </div>
         <div>
          <Label htmlFor="type">Tipo de Cliente</Label>
          <select id="type" name="type" defaultValue={customer?.type || "Particular"} className="w-full p-2 border rounded-md bg-background">
              <option value="Particular">Particular</option>
              <option value="Empresa">Empresa</option>
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" name="address" defaultValue={customer?.address} placeholder="Ej: Calle Falsa 123" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Ciudad</Label>
          <Input id="city" name="city" defaultValue={customer?.city} placeholder="Ej: Springfield" pattern="[a-zA-Z\s]*" onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="postalCode">Código Postal</Label>
          <Input id="postalCode" name="postalCode" defaultValue={customer?.postalcode} placeholder="Ej: S1234ABC" pattern="[a-zA-Z0-9]*" onChange={handleInputChange} />
        </div>
      </div>

      <h3 className="text-lg font-medium text-primary border-b pb-2 mb-3 pt-4">Datos Fiscales</h3>
       <div>
          <Label htmlFor="taxId">(CUIT/CUIL/DNI)</Label>
          <Input id="taxId" name="taxId" defaultValue={customer?.taxid} placeholder="Solo números, sin guiones" pattern="\d*" maxLength="11" onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="fiscalAddress">Dirección Fiscal</Label>
          <Input id="fiscalAddress" name="fiscalAddress" defaultValue={customer?.fiscaladdress} placeholder="Ej: Av. Siempreviva 742" />
        </div>
        <div>
          <Label htmlFor="taxCondition">Condición IVA</Label>
          <select id="taxCondition" name="taxCondition" defaultValue={customer?.taxcondition || "Consumidor Final"} className="w-full p-2 border rounded-md bg-background">
              <option value="Consumidor Final">Consumidor Final</option>
              <option value="Responsable Inscripto">Responsable Inscripto</option>
              <option value="Monotributista">Monotributista</option>
              <option value="Exento">Exento</option>
          </select>
        </div>
      
      <DialogFooter className="pt-6">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90">Guardar Cliente</Button>
      </DialogFooter>
    </form>
  );
};

export default CustomerForm;