import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, PlusCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const SaleItemRow = ({ item, index, handleItemChange, removeItem, canRemove, saleProducts, onQuickAddProduct }) => {
  const calculateIvaAmount = () => {
    const quantity = parseFloat(item.quantity) || 0;
    let unitPrice = parseFloat(item.unitPrice) || 0;
    const iva = parseFloat(item.iva) || 0;
    const discount = parseFloat(item.discount) || 0;

    let priceForCalc = unitPrice;
    if (item.calculationMode === 'total') {
      priceForCalc = unitPrice / (1 + (iva / 100));
    }

    const subtotal = quantity * priceForCalc;
    const discountAmount = subtotal * (discount / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    
    return subtotalAfterDiscount * (iva / 100);
  };

  const ivaAmount = calculateIvaAmount();

  return (
    <div className="grid grid-cols-12 gap-2 items-start p-2 rounded-md border">
        <div className="col-span-12 space-y-2">
            <Label>Producto/Servicio</Label>
            <div className="flex items-center gap-2">
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
                <Button type="button" onClick={onQuickAddProduct} variant="outline" size="icon" className="min-w-max">
                    <PlusCircle className="h-4 w-4" />
                </Button>
            </div>
            <Textarea
                value={item.description}
                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                placeholder="Detalles adicionales del producto o servicio"
                className="mt-1"
            />
        </div>

        <div className="col-span-12 md:col-span-3 space-y-1">
            <Label>Precio Unit.</Label>
            <Input
                type="number"
                value={item.unitPrice}
                onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
            />
        </div>

        <div className="col-span-6 md:col-span-2 space-y-1">
            <Label>IVA (%)</Label>
            <Select
                value={String(item.iva)}
                onValueChange={(value) => handleItemChange(index, 'iva', value)}
            >
                <SelectTrigger className="flex-grow">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="21">21%</SelectItem>
                    <SelectItem value="0">0%</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="col-span-6 md:col-span-2 space-y-1">
            <Label>Dto. (%)</Label>
            <Input
                type="number"
                value={item.discount}
                onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                placeholder="0"
                min="0"
                max="100"
            />
        </div>
        
        <div className="col-span-12 md:col-span-3 flex flex-col justify-between h-full space-y-1">
            <div>
                <Label>Calcular desde:</Label>
                <RadioGroup 
                    value={item.calculationMode}
                    onValueChange={(value) => handleItemChange(index, 'calculationMode', value)}
                    className="flex items-center space-x-2 pt-2"
                >
                    <div className="flex items-center space-x-1">
                        <RadioGroupItem value="net" id={`r-net-${index}`} />
                        <Label htmlFor={`r-net-${index}`} className="text-xs font-normal">Neto</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                        <RadioGroupItem value="total" id={`r-total-${index}`} />
                        <Label htmlFor={`r-total-${index}`} className="text-xs font-normal">Total</Label>
                    </div>
                </RadioGroup>
                <div className="text-sm font-medium mt-2">
                    IVA: {formatCurrency(ivaAmount)}
                </div>
            </div>
            <div className="text-right font-bold text-lg text-primary pt-2">
                Total: {formatCurrency(item.total)}
            </div>
        </div>

        {canRemove && (
            <div className="col-span-12 flex justify-end items-center mt-2">
                <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeItem(index)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        )}
    </div>
  );
};

export default SaleItemRow;
