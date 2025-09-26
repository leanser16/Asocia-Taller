import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

const PurchaseFormHeader = ({ formData, onFormDataChange, onQuickAddSupplier, suppliers }) => {
  const [documentNumber, setDocumentNumber] = useState('');
  const [pointOfSale, setPointOfSale] = useState('');
  
  useEffect(() => {
    setDocumentNumber(formData.document_number_parts?.number || '');
    setPointOfSale(formData.document_number_parts?.pointOfSale || '');
  }, [formData.document_number_parts]);

  const handleDocumentNumberChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 8) {
      setDocumentNumber(value);
    }
  };

  const handleDocumentNumberBlur = () => {
    let num = parseInt(documentNumber, 10) || 0;
    if (num === 0) {
        num = 1;
    }
    const paddedNumber = String(num).padStart(8, '0');
    setDocumentNumber(paddedNumber);
    onFormDataChange('document_number_parts', { ...formData.document_number_parts, number: paddedNumber });
  };
  
  const handlePointOfSaleChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setPointOfSale(value);
    }
  };
  
  const handlePointOfSaleBlur = () => {
    const paddedPointOfSale = pointOfSale.padStart(4, '0');
    setPointOfSale(paddedPointOfSale);
    onFormDataChange('document_number_parts', { ...formData.document_number_parts, pointOfSale: paddedPointOfSale });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="space-y-1">
        <Label htmlFor="date">Fecha Compra</Label>
        <Input id="date" name="date" type="date" value={formData.date} onChange={(e) => onFormDataChange('date', e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="dueDate">Fecha Vencimiento</Label>
        <Input id="dueDate" name="dueDate" type="date" value={formData.dueDate} onChange={(e) => onFormDataChange('dueDate', e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="supplierId">Proveedor</Label>
        <div className="flex gap-2">
          <Select name="supplierId" value={formData.supplierId} onValueChange={(value) => onFormDataChange('supplierId', value)} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un proveedor" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="icon" onClick={onQuickAddSupplier}>
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="documentType">Tipo Documento</Label>
        <Select name="documentType" value={formData.documentType} onValueChange={(value) => onFormDataChange('documentType', value)} required>
          <SelectTrigger>
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Factura">Factura</SelectItem>
            <SelectItem value="Ticket">Ticket</SelectItem>
            <SelectItem value="Nota de Credito">Nota de Crédito</SelectItem>
            <SelectItem value="Otro">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-1 lg:col-span-2 space-y-1">
        <Label>Número de Documento</Label>
        <div className="grid grid-cols-3 gap-2">
          <Select 
            name="documentLetter"
            value={formData.document_number_parts?.letter || ''}
            onValueChange={(value) => onFormDataChange('document_number_parts', { ...formData.document_number_parts, letter: value })}
          >
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="C">C</SelectItem>
              <SelectItem value="M">M</SelectItem>
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
            required
          />
        </div>
      </div>
    </div>
  );
};

export default PurchaseFormHeader;