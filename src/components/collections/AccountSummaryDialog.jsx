import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

const AccountSummaryDialog = ({ 
  isOpen, 
  onOpenChange, 
  customers, 
  sales,
  collections,
  onGenerate, 
  entityType = 'customer',
  summaryType = 'pending' // 'pending', 'history', 'all'
}) => {
  const [selectedEntityId, setSelectedEntityId] = useState('');

  const entities = useMemo(() => {
    if (!customers) return [];
    return customers;
  }, [customers]);

  const handleGenerateClick = () => {
    if (selectedEntityId) {
      onGenerate(selectedEntityId, summaryType);
      onOpenChange(false);
      setSelectedEntityId('');
    }
  };

  const getTitle = () => {
    const entityName = entityType === 'customer' ? 'Cliente' : 'Proveedor';
    switch (summaryType) {
      case 'pending': return `Resumen de Deuda de ${entityName}`;
      case 'history': return `Historial de Cobros de ${entityName}`;
      case 'all': return `Resumen Total de Documentos de ${entityName}`;
      default: return `Generar Resumen de ${entityName}`;
    }
  };

  const getDescription = () => {
    const entityName = entityType === 'customer' ? 'un cliente' : 'un proveedor';
    switch (summaryType) {
      case 'pending': return `Selecciona ${entityName} para generar un PDF con sus facturas pendientes de pago.`;
      case 'history': return `Selecciona ${entityName} para generar un PDF con su historial de cobros realizados.`;
      case 'all': return `Selecciona ${entityName} para generar un PDF con todos sus documentos de venta.`;
      default: return `Selecciona ${entityName} para generar un resumen.`;
    }
  };
  
  const getLabel = () => {
     return entityType === 'customer' ? 'Cliente' : 'Proveedor';
  }
  
  const getPlaceholder = () => {
    return entityType === 'customer' ? 'Selecciona un cliente...' : 'Selecciona un proveedor...';
  }

  const getNoDataText = () => {
    return entityType === 'customer' ? 'No hay clientes' : 'No hay proveedores';
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glassmorphism">
        <DialogHeader>
          <DialogTitle className="text-primary">{getTitle()}</DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="entity-select">{getLabel()}</Label>
            <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
              <SelectTrigger id="entity-select">
                <SelectValue placeholder={getPlaceholder()} />
              </SelectTrigger>
              <SelectContent>
                {entities.length > 0 ? (
                  entities.map(entity => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-entities" disabled>
                    {getNoDataText()}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" onClick={handleGenerateClick} disabled={!selectedEntityId}>
            Generar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccountSummaryDialog;