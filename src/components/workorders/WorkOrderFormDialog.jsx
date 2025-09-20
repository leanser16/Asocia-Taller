import React, { useState, useEffect, useCallback, memo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { useData } from '@/contexts/DataContext';
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from '@/lib/utils';
import { PlusCircle, Trash2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const parseNumber = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(',', '.'));
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

const ItemRow = memo(({ item, index, onChange, onRemove, type, products, onQuickAddProduct }) => {
    
    const handleInputChange = (field, value) => {
        onChange(index, { [field]: value });
    };

    const handleSelectChange = (field, value) => {
        onChange(index, { [field]: parseNumber(value) });
    };
    
    const handleMonetaryInputChange = (field, value) => {
        const sanitizedValue = value.replace(/[^0-9,]/g, '');
        const parts = sanitizedValue.split(',');
        value = parts.length > 2 ? parts[0] + ',' + parts.slice(1).join('') : sanitizedValue;
        onChange(index, { [field]: value });
    }

    const handleProductChange = (productId) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            onChange(index, {
                description: product.name,
                price: String((type === 'service' ? product.price : product.cost) || '0').replace('.', ','),
                vat: product.vat || 21,
                details: product.description || '',
            });
        }
    };

    return (
        <div className="p-4 border rounded-lg space-y-4 relative bg-card/50 shadow-sm">
            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:text-destructive/80" onClick={onRemove}><Trash2 className="h-4 w-4" /></Button>
            <div className="space-y-2">
                <Label>{type === 'service' ? 'Servicio' : 'Producto'}</Label>
                <div className="flex gap-2">
                    <Select onValueChange={handleProductChange}><SelectTrigger><SelectValue placeholder={type === 'service' ? "Seleccionar un servicio" : "Seleccionar un producto"} /></SelectTrigger><SelectContent>{products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                    <Button type="button" variant="outline" size="icon" onClick={() => onQuickAddProduct(type === 'service' ? 'Venta' : 'Compra')} aria-label="Agregar Item"><PlusCircle className="h-4 w-4" /></Button>
                </div>
            </div>
            <div className="space-y-2"><Label>Descripción Adicional</Label><Textarea value={item.details || ''} onChange={(e) => handleInputChange('details', e.target.value)} placeholder="Detalles adicionales... (ej: nro de serie, etc)"/></div>
            <div className="pt-4 border-t border-border/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 items-end">
                    <div className="space-y-2"><Label>Precio Unit.</Label><Input type="text" inputMode="decimal" value={item.price} onChange={(e) => handleMonetaryInputChange('price', e.target.value)} placeholder="0,00" disabled={item.calculationMode === 'total'} /></div>
                    <div className="space-y-2"><Label>Cantidad</Label><Input type="number" value={item.quantity} onChange={(e) => handleInputChange('quantity', e.target.value)} placeholder="1" min="0" /></div>
                    
                    <div className="space-y-2">
                        <Label>IVA (%)</Label>
                        <Select value={String(item.vat)} onValueChange={(value) => handleSelectChange('vat', value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="21">21%</SelectItem>
                                <SelectItem value="0">0%</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2"><Label>Dto. (%)</Label><Input type="number" value={item.discount} onChange={(e) => handleInputChange('discount', e.target.value)} placeholder="0" min="0" /></div>
                    
                    <div className="space-y-2 flex flex-col justify-end h-full">
                        <Label className="mb-2">Calcular desde:</Label>
                        <RadioGroup value={item.calculationMode} onValueChange={(value) => handleInputChange('calculationMode', value)} className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="net" id={`r-net-${type}-${index}`} /><Label htmlFor={`r-net-${type}-${index}`}>Neto</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="total" id={`r-total-${type}-${index}`} /><Label htmlFor={`r-total-${type}-${index}`}>Total</Label></div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2 lg:col-span-2"><Label>Total Item</Label>{item.calculationMode === 'net' ? <div className="p-2 border rounded-md bg-muted text-foreground font-bold h-10 flex items-center justify-end">{formatCurrency(parseNumber(item.total))}</div> : <Input type="text" inputMode="decimal" value={item.total} onChange={(e) => handleMonetaryInputChange('total', e.target.value)} placeholder="0,00" className="font-bold text-right" />}</div>
                </div>
            </div>
        </div>
    );
});
ItemRow.displayName = 'ItemRow';

const WorkOrderFormDialog = ({ isOpen, onOpenChange, workOrder, onSave, onQuickAddCustomer, onQuickAddVehicle, onQuickAddProduct }) => {
    const { data } = useData();
    const { customers = [], vehicles = [], sale_products = [], purchase_products = [] } = data;
    const { toast } = useToast();

    const getInitialFormData = useCallback((wo) => {
        const initial = { customer_id: '', vehicle_id: '', creation_date: new Date().toISOString().split('T')[0], exit_date: new Date().toISOString().split('T')[0], mileage: '', service_items: [], product_items: [], notes: '' };
        if (!wo) return initial;
        const separator = '---DATA---';
        const separatorIndex = (wo.notes || '').indexOf(separator);
        let userNotes = wo.notes || '';
        let extraData = {};
        if (separatorIndex !== -1) {
            userNotes = (wo.notes.substring(0, separatorIndex)).trim();
            const dataString = wo.notes.substring(separatorIndex + separator.length);
            try { extraData = JSON.parse(dataString); } catch (e) { console.error("Error parsing notes:", e); }
        }
        const ensureProps = (items = []) => items.map(item => ({...item, calculationMode: item.calculationMode || 'net', quantity: item.quantity || 1, vat: item.vat ?? 21 }));
        return { ...initial, customer_id: wo.customer_id || '', vehicle_id: wo.vehicle_id || '', creation_date: wo.creation_date ? new Date(wo.creation_date).toISOString().split('T')[0] : initial.creation_date, exit_date: extraData.exit_date || initial.exit_date, mileage: extraData.mileage || '', service_items: ensureProps(extraData.service_items), product_items: ensureProps(extraData.product_items), notes: userNotes };
    }, []);

    const [formData, setFormData] = useState(() => getInitialFormData(workOrder));
    const [filteredVehicles, setFilteredVehicles] = useState([]);

    useEffect(() => { if (isOpen) { setFormData(getInitialFormData(workOrder)); } }, [isOpen, workOrder, getInitialFormData]);

    useEffect(() => {
        const customerVehicles = formData.customer_id ? vehicles.filter(v => v.customer_id === formData.customer_id) : [];
        setFilteredVehicles(customerVehicles);
        if (customerVehicles.length === 1 && !formData.vehicle_id) {
            setFormData(prev => ({...prev, vehicle_id: customerVehicles[0].id}));
        }
    }, [formData.customer_id, vehicles, formData.vehicle_id]);

    const handleGeneralChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    }, []);
    
    const handleSelectChange = useCallback((name, value) => {
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'customer_id') { newState.vehicle_id = ''; }
            return newState;
        });
    }, []);

    const handleItemChange = useCallback((type, index, updatedFields) => {
        setFormData(prev => {
            const newItems = [...prev[type]];
            const originalItem = newItems[index];
            let calculatedItem = { ...originalItem, ...updatedFields };

            const quantity = parseNumber(calculatedItem.quantity);
            const price = parseNumber(calculatedItem.price);
            const vat = parseNumber(calculatedItem.vat);
            const discount = parseNumber(calculatedItem.discount);
            
            if (calculatedItem.calculationMode === 'net') {
                const priceAfterDiscount = price * (1 - discount / 100);
                const newTotal = priceAfterDiscount * quantity * (1 + vat / 100);
                calculatedItem.total = String(newTotal.toFixed(2));
            } else { 
                const total = parseNumber(calculatedItem.total);
                if (quantity > 0) {
                    const totalBeforeVat = total / (1 + vat / 100);
                    const priceBeforeDiscount = totalBeforeVat / quantity;
                    const newUnitPrice = (discount > 0 && discount < 100) ? priceBeforeDiscount / (1 - discount / 100) : priceBeforeDiscount;
                    calculatedItem.price = String(newUnitPrice.toFixed(2)).replace('.', ',');
                }
            }
            
            newItems[index] = calculatedItem;
            return { ...prev, [type]: newItems };
        });
    }, []);

    const addItem = useCallback((type) => {
        const newItem = { description: '', details: '', quantity: 1, price: '0,00', vat: 21, discount: 0, total: '0.00', calculationMode: 'net' };
        setFormData(prev => ({ ...prev, [type]: [...prev[type], newItem] }));
    }, []);

    const removeItem = useCallback((type, index) => {
        setFormData(prev => ({ ...prev, [type]: prev[type].filter((_, i) => i !== index) }));
    }, []);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.customer_id) { toast({ variant: "destructive", title: "Falta el Cliente", description: "Por favor, selecciona un cliente." }); return; }
        if (!formData.vehicle_id) { toast({ variant: "destructive", title: "Falta el Vehículo", description: "Por favor, selecciona un vehículo." }); return; }

        const { exit_date, mileage, notes, product_items, service_items, ...rest } = formData;
        const itemDescriptions = [...service_items, ...product_items].map(i => i.description).filter(Boolean);
        const autoDescription = itemDescriptions.length > 0 ? itemDescriptions.join(', ') : 'Orden de trabajo';
        const extraData = { exit_date, mileage, product_items, service_items };
        const finalNotes = `${notes || ''} ---DATA--- ${JSON.stringify(extraData)}`.trim();
        onSave({ ...rest, description: autoDescription.substring(0, 255), notes: finalNotes }, !!workOrder);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl glassmorphism">
                <DialogHeader><DialogTitle className="text-primary">{workOrder ? 'Editar' : 'Nueva'} Orden de Trabajo</DialogTitle><DialogDescription>Ingresa los detalles del documento.</DialogDescription></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-2 pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div><Label>Cliente</Label><div className="flex items-center gap-2"><Select name="customer_id" value={formData.customer_id} onValueChange={(value) => handleSelectChange('customer_id', value)} required><SelectTrigger><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger><SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><Button type="button" onClick={() => onQuickAddCustomer(true)} variant="outline" size="icon"><PlusCircle className="h-4 w-4" /></Button></div></div>
                        <div><Label>Vehículo</Label><div className="flex items-center gap-2"><Select name="vehicle_id" value={formData.vehicle_id} onValueChange={(value) => handleSelectChange('vehicle_id', value)} required disabled={!formData.customer_id}><SelectTrigger><SelectValue placeholder={!formData.customer_id ? "Selecciona un cliente" : "Selecciona un vehículo"} /></SelectTrigger><SelectContent>{filteredVehicles.length > 0 ? filteredVehicles.map(v => <SelectItem key={v.id} value={v.id}>{`${v.brand} ${v.model} (${v.plate})`}</SelectItem>) : <SelectItem value="no-vehicles" disabled>No hay vehículos</SelectItem>}</SelectContent></Select><Button type="button" onClick={() => onQuickAddVehicle(true)} variant="outline" size="icon" disabled={!formData.customer_id}><PlusCircle className="h-4 w-4" /></Button></div></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><Label>Fecha Entrada</Label><Input name="creation_date" type="date" value={formData.creation_date} onChange={handleGeneralChange} required /></div>
                        <div><Label>Fecha Salida</Label><Input name="exit_date" type="date" value={formData.exit_date} onChange={handleGeneralChange} /></div>
                        <div><Label>Kilometraje</Label><Input name="mileage" type="number" value={formData.mileage} onChange={handleGeneralChange} placeholder="Kilometraje" /></div>
                    </div>
                    
                    <div className="space-y-4 rounded-lg border p-4"><h3 className="text-lg font-medium text-primary">Items de Servicio</h3><div className="space-y-2">{formData.service_items.map((item, index) => (<ItemRow key={index} item={item} index={index} onChange={(idx, fields) => handleItemChange('service_items', idx, fields)} onRemove={() => removeItem('service_items', index)} type="service" products={sale_products} onQuickAddProduct={onQuickAddProduct} />))}</div><Button type="button" variant="outline" onClick={() => addItem('service_items')}><PlusCircle className="mr-2 h-4 w-4" /> Agregar Servicio</Button></div>
                    
                    <div className="space-y-4 rounded-lg border p-4"><h3 className="text-lg font-medium text-primary">Items de Producto</h3><div className="space-y-2">{formData.product_items.map((item, index) => (<ItemRow key={index} item={item} index={index} onChange={(idx, fields) => handleItemChange('product_items', idx, fields)} onRemove={() => removeItem('product_items', index)} type="product" products={purchase_products} onQuickAddProduct={onQuickAddProduct} />))}</div><Button type="button" variant="outline" onClick={() => addItem('product_items')}><PlusCircle className="mr-2 h-4 w-4" /> Agregar Producto</Button></div>
                    
                    <div><Label>Notas Adicionales</Label><Textarea name="notes" value={formData.notes} onChange={handleGeneralChange} placeholder="Cualquier observación relevante" /></div>
                    <DialogFooter className="pt-4"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" className="bg-primary hover:bg-primary/90">{workOrder ? 'Guardar Cambios' : 'Crear Orden'}</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default WorkOrderFormDialog;
