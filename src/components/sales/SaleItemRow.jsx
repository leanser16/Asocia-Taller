import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, Car, PlusCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const SaleItemRow = ({ item, index, handleItemChange, removeItem, canRemove, vehicles, onQuickAddVehicle, customerId, documentType, saleProducts, onQuickAddProduct }) => {
  const customerVehicles = vehicles.filter(v => v.customer_id === customerId);

  return (
    <div className="p-4 border rounded-lg space-y-4 relative bg-muted/20">
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
          onClick={() => removeItem(index)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Producto/Servicio</label>
          <div className="flex gap-2">
            <Select
              value={item.productId || ''}
              onValueChange={(value) => handleItemChange(index, 'productId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar producto/servicio" />
              </SelectTrigger>
              <SelectContent>
                {saleProducts && saleProducts.length > 0 ? (
                  saleProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                ) : (
                  <SelectItem value="no-products" disabled>No hay productos cargados</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="icon" onClick={onQuickAddProduct} aria-label="Agregar Producto">
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Vehículo</label>
          <div className="flex gap-2">
            <Select
              value={item.vehicleId || 'none'}
              onValueChange={(value) => handleItemChange(index, 'vehicleId', value === 'none' ? null : value)}
              disabled={!customerId}
            >
              <SelectTrigger>
                <Car className="mr-2 h-4 w-4 opacity-50" />
                <SelectValue placeholder={!customerId ? "Seleccione un cliente" : "Seleccionar vehículo"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin vehículo específico</SelectItem>
                {customerVehicles.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.brand} {v.model} ({v.plate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="icon" onClick={onQuickAddVehicle} disabled={!customerId} aria-label="Agregar Vehículo">
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Descripción Adicional</label>
        <Input
          value={item.description}
          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
          placeholder="Detalles adicionales del producto o servicio"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Cantidad</label>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
            placeholder="1"
            min="0"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Precio Unit.</label>
          <Input
            type="number"
            value={item.unitPrice}
            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">IVA (%)</label>
          <Input
            type="number"
            value={item.iva}
            onChange={(e) => handleItemChange(index, 'iva', e.target.value)}
            placeholder="21"
            min="0"
            disabled={documentType !== 'Presupuesto'}
          />
        </div>
      </div>
      <div className="text-right font-bold text-lg text-primary">
        Total Item: {formatCurrency(item.total)}
      </div>
    </div>
  );
};

export default SaleItemRow;