import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const AccountSummaryDialog = ({ isOpen, onOpenChange, customers, onGenerate, entityType, summaryType: initialSummaryType = 'all' }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [summaryType, setSummaryType] = useState(initialSummaryType);

  const handleGenerateClick = () => {
    if (selectedCustomerId) {
      onGenerate(selectedCustomerId, summaryType);
    }
  };
  
  const entityName = entityType === 'customer' ? 'Cliente' : 'Proveedor';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generar Resumen de Cuenta</DialogTitle>
          <DialogDescription>
            Selecciona un {entityName.toLowerCase()} y el tipo de resumen que deseas generar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="customer-select">Seleccionar {entityName}</Label>
            <Select onValueChange={setSelectedCustomerId} value={selectedCustomerId}>
              <SelectTrigger id="customer-select">
                <SelectValue placeholder={`-- Elige un ${entityName.toLowerCase()} --`} />
              </SelectTrigger>
              <SelectContent>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary-type">Tipo de Resumen</Label>
            <Select onValueChange={setSummaryType} value={summaryType}>
              <SelectTrigger id="summary-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Completo (Todos los Documentos)</SelectItem>
                <SelectItem value="pending">Deuda (Solo Saldos Pendientes)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleGenerateClick} disabled={!selectedCustomerId}>Generar PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccountSummaryDialog;