import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

const SaleFormHeader = ({ formData, onFormDataChange, onQuickAddCustomer, customers, saleDocumentNumberMode }) => {
  const [documentNumber, setDocumentNumber] = useState('');
  const [pointOfSale, setPointOfSale] = useState('');
  
  const isDocumentNumberEditable = saleDocumentNumberMode === 'manual';

  useEffect(() => {
    setDocumentNumber(formData.sale_number_parts?.number || '');
    setPointOfSale(formData.sale_number_parts?.pointOfSale || '');
  }, [formData.sale_number_parts]);

  const handleDocumentNumberChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 8) {
      setDocumentNumber(value);
      if (isDocumentNumberEditable) {
        onFormDataChange('sale_number_parts', { ...formData.sale_number_parts, number: value });
      }
    }
  };

  const handleDocumentNumberBlur = () => {
    if (isDocumentNumberEditable) {
      const paddedNumber = documentNumber.padStart(8, '0');
      setDocumentNumber(paddedNumber);
      onFormDataChange('sale_number_parts', { ...formData.sale_number_parts, number: paddedNumber });
    }
  };
  
  const handlePointOfSaleChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setPointOfSale(value);
      onFormDataChange('sale_number_parts', { ...formData.sale_number_parts, pointOfSale: value });
    }
  };
  
  const handlePointOfSaleBlur = () => {
    const paddedPointOfSale = pointOfSale.padStart(4, '0');
    setPointOfSale(paddedPointOfSale);
    onFormDataChange('sale_number_parts', { ...formData.sale_number_parts, pointOfSale: paddedPointOfSale });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="space-y-1">
        <Label htmlFor="sale_date">Fecha Emisión</Label>
        <Input id="sale_date" name="sale_date" type="date" value={formData.sale_date} onChange={(e) => onFormDataChange('sale_date', e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="due_date">Fecha Vencimiento</Label>
        <Input id="due_date" name="due_date" type="date" value={formData.due_date} onChange={(e) => onFormDataChange('due_date', e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="customer_id">Cliente</Label>
        <div className="flex gap-2">
          <Select name="customer_id" value={formData.customer_id} onValueChange={(value) => onFormDataChange('customer_id', value)} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un cliente" />
            </SelectTrigger>
            <SelectContent>
              {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="icon" onClick={onQuickAddCustomer}>
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="type">Tipo Documento</Label>
        <Select name="type" value={formData.type} onValueChange={(value) => onFormDataChange('type', value)} required>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Presupuesto">Presupuesto</SelectItem>
            <SelectItem value="Factura">Factura</SelectItem>
            <SelectItem value="Remito">Remito</SelectItem>
            <SelectItem value="Recibo">Recibo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-1 lg:col-span-2 space-y-1">
        <Label>Número de Documento</Label>
        <div className="grid grid-cols-3 gap-2">
          <Select 
            name="documentLetter"
            value={formData.sale_number_parts?.letter || ''}
            onValueChange={(value) => onFormDataChange('sale_number_parts', { ...formData.sale_number_parts, letter: value })}
          >
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="C">C</SelectItem>
              <SelectItem value="X">X</SelectItem>
            </SelectContent>
          </Select>
           <Input 
            name="documentPointOfSale" 
            placeholder="0001" 
            value={pointOfSale} 
            onChange={handlePointOfSaleChange}
            onBlur={handlePointOfSaleBlur}
          />
          <Input 
            name="documentNumber"
            placeholder="00000001"
            value={documentNumber}
            onChange={handleDocumentNumberChange}
            onBlur={handleDocumentNumberBlur}
            disabled={!isDocumentNumberEditable}
          />
        </div>
      </div>
    </div>
  );
};

export default SaleFormHeader;