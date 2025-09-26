import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash, PackagePlus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const ivaRates = [0, 10.5, 21, 27];

const PurchaseItemRow = ({ item, index, handleItemChange, removeItem, canRemove, isCreditNote, purchaseProducts = [], onQuickAddProduct }) => {
    
    const handleLocalChange = (field, value) => {
        handleItemChange(index, field, value);
    };

    const calculationMode = item.calculationMode || 'net';

    return (
        <div className="p-4 border rounded-lg space-y-4 relative bg-muted/20 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-grow">
                    <Label htmlFor={`item-productId-${index}`}>Producto/Servicio</Label>
                    <div className="flex items-center gap-2">
                        <Select value={item.productId || ''} onValueChange={(value) => handleLocalChange('productId', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un producto/servicio" />
                            </SelectTrigger>
                            <SelectContent>
                                {purchaseProducts.map(product => (
                                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" onClick={onQuickAddProduct} title="Nuevo Producto">
                            <PackagePlus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <Label>Calcular desde:</Label>
                     <RadioGroup 
                        value={calculationMode} 
                        onValueChange={(value) => handleLocalChange('calculationMode', value)}
                        className="flex items-center space-x-4 mt-2"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="net" id={`r-net-${index}`} />
                            <Label htmlFor={`r-net-${index}`}>Neto</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="total" id={`r-total-${index}`} />
                            <Label htmlFor={`r-total-${index}`}>Total</Label>
                        </div>
                    </RadioGroup>
                </div>
            </div>

            <div>
                <Label htmlFor={`item-description-${index}`}>Descripción Adicional</Label>
                <Textarea id={`item-description-${index}`} value={item.description} onChange={(e) => handleLocalChange('description', e.target.value)} placeholder="Detalles adicionales, N° de serie, etc." />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                    <Label htmlFor={`item-quantity-${index}`}>Cantidad</Label>
                    <Input id={`item-quantity-${index}`} type="number" value={item.quantity} onChange={(e) => handleLocalChange('quantity', e.target.value)} placeholder="1" min="0" step="any" required />
                </div>
                <div>
                    <Label htmlFor={`item-unitPrice-${index}`}>Costo Unit. ($)</Label>
                    <Input 
                        id={`item-unitPrice-${index}`} 
                        type="number" 
                        step="0.01" 
                        value={item.unitPrice} 
                        onChange={(e) => {
                            handleLocalChange('unitPrice', e.target.value);
                            if (calculationMode === 'total') {
                                handleLocalChange('calculationMode', 'net');
                            }
                        }} 
                        placeholder="0.00" 
                        required 
                        disabled={calculationMode === 'total'}
                        className={cn(calculationMode === 'total' && "bg-muted/50 cursor-not-allowed")}
                    />
                </div>
                <div>
                    <Label htmlFor={`item-iva-${index}`}>IVA (%)</Label>
                    <Select value={String(item.iva)} onValueChange={(value) => handleLocalChange('iva', value)}>
                        <SelectTrigger id={`item-iva-${index}`} className="flex-grow">
                            <SelectValue placeholder="IVA" />
                        </SelectTrigger>
                        <SelectContent>
                            {ivaRates.map(rate => (
                                <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor={`item-total-${index}`}>Total Item ($)</Label>
                    <Input 
                        id={`item-total-${index}`}
                        type="number"
                        step="0.01"
                        value={item.total} 
                        onChange={(e) => {
                            handleLocalChange('total', e.target.value);
                            if (calculationMode === 'net') {
                                handleLocalChange('calculationMode', 'total');
                            }
                        }} 
                        disabled={calculationMode === 'net'}
                        className={cn("font-semibold", calculationMode === 'net' && "bg-muted/50 cursor-not-allowed")}
                    />
                    <div className="text-sm font-medium mt-1">
                        IVA: {formatCurrency(item.ivaAmount)}
                    </div>
                </div>
            </div>

            {canRemove && (
                <Button type="button" variant="destructive" size="icon" className="absolute top-3 right-3 h-7 w-7" onClick={() => removeItem(index)}>
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Eliminar item</span>
                </Button>
            )}
        </div>
    );
};

export default PurchaseItemRow;