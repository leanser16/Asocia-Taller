import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { useData } from '@/contexts/DataContext';
import { formatCurrency } from '@/lib/utils';
import { PlusCircle, Trash2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const ItemRow = ({ item, index, onChange, onRemove, type, products }) => {
    const handleProductChange = (productId) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            onChange(index, 'description', product.name);
            const price = type === 'service' ? product.price : product.cost;
            onChange(index, 'price', price || 0);
            onChange(index, 'vat', product.vat || 21);
        }
    };

    return (
        <div className="grid grid-cols-12 gap-2 items-center p-2 rounded-md border">
            <div className="col-span-12">
                <Label>Descripcion</Label>
                {products ? (
                    <Select onValueChange={handleProductChange}>
                        <SelectTrigger>
                            <SelectValue placeholder={type === 'service' ? "Seleccionar un servicio" : "Seleccionar un producto"} />
                        </SelectTrigger>
                        <SelectContent>
                            {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input
                        value={item.description}
                        onChange={(e) => onChange(index, 'description', e.target.value)}
                        placeholder={type === 'service' ? "Descripción del servicio" : "Descripción del producto"}
                    />
                )}
                <Textarea
                    value={item.details || ''}
                    onChange={(e) => onChange(index, 'details', e.target.value)}
                    placeholder="Detalles adicionales (opcional)"
                    className="mt-1"
                />
            </div>
            <div className="col-span-3">
                <Label>Precio Unit.</Label>
                <Input type="number" value={item.price} onChange={(e) => onChange(index, 'price', e.target.value)} placeholder="Precio Unit." />
            </div>
            <div className="col-span-2">
                <Label>Cantidad</Label>
                <Input type="number" value={item.quantity} onChange={(e) => onChange(index, 'quantity', e.target.value)} placeholder="Cant." min="1" />
            </div>
            <div className="col-span-2">
                <Label>IVA (%)</Label>
                <Input type="number" value={item.vat} onChange={(e) => onChange(index, 'vat', e.target.value)} placeholder="IVA %" />
            </div>
            <div className="col-span-2">
                <Label>Dto.</Label>
                <Input type="number" value={item.discount} onChange={(e) => onChange(index, 'discount', e.target.value)} placeholder="Dto." />
            </div>
            <div className="col-span-3 flex flex-col justify-between">
                <div>
                    <Label>Calcular desde:</Label>
                    <RadioGroup
                        defaultValue="net"
                        className="flex items-center"
                        onValueChange={(value) => onChange(index, 'calculateFrom', value)}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="net" id={`net-${index}`}/>
                            <Label htmlFor={`net-${index}`}>Neto</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="total" id={`total-${index}`} />
                            <Label htmlFor={`total-${index}`}>Total</Label>
                        </div>
                    </RadioGroup>
                </div>
                <div className='font-bold'>
                    Total Item: {formatCurrency(
                        (item.price * item.quantity * (1 - item.discount / 100)) * (1 + item.vat / 100)
                    )}
                </div>
            </div>
            <div className="col-span-12 flex justify-end">
                <Button type="button" variant="destructive" size="icon" onClick={onRemove}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

const WorkOrderFormDialog = ({ isOpen, onOpenChange, workOrder, onSave }) => {
    const { data } = useData();
    const { customers = [], vehicles = [], sale_products = [], purchase_products = [] } = data;

    const getInitialFormData = useCallback(() => {
        const initialData = {
            customer_id: '',
            vehicle_id: '',
            creation_date: new Date().toISOString().split('T')[0],
            exit_date: new Date().toISOString().split('T')[0],
            mileage: '',
            service_items: [],
            product_items: [],
            notes: '',
        };

        if (workOrder) {
            const separator = '---DATA---';
            const separatorIndex = (workOrder.notes || '').indexOf(separator);
            
            let userNotes = workOrder.notes || '';
            let extraData = {};

            if (separatorIndex !== -1) {
                userNotes = (workOrder.notes.substring(0, separatorIndex)).trim();
                const dataString = workOrder.notes.substring(separatorIndex + separator.length);
                try {
                    extraData = JSON.parse(dataString);
                } catch (e) {
                    console.error("Error parsing data from notes on form load:", e);
                }
            }

            return {
                ...initialData,
                customer_id: workOrder.customer_id || '',
                vehicle_id: workOrder.vehicle_id || '',
                creation_date: workOrder.creation_date ? new Date(workOrder.creation_date).toISOString().split('T')[0] : initialData.creation_date,
                exit_date: extraData.exit_date || initialData.exit_date,
                mileage: extraData.mileage || '',
                service_items: extraData.service_items || [],
                product_items: extraData.product_items || [],
                notes: userNotes,
            };
        }
        return initialData;
    }, [workOrder]);

    const [formData, setFormData] = useState(getInitialFormData);
    const [filteredVehicles, setFilteredVehicles] = useState([]);

    useEffect(() => {
        setFormData(getInitialFormData());
    }, [isOpen, workOrder, getInitialFormData]);

    useEffect(() => {
        if (formData.customer_id) {
            setFilteredVehicles(vehicles.filter(v => v.customer_id === formData.customer_id));
        } else {
            setFilteredVehicles([]);
            setFormData(prev => ({ ...prev, vehicle_id: '' }));
        }
    }, [formData.customer_id, vehicles]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (type, index, field, value) => {
        const items = [...formData[type]];
        items[index][field] = value;
        setFormData(prev => ({ ...prev, [type]: items }));
    };

    const addItem = (type) => {
        const newItem = { description: '', details: '', quantity: 1, price: 0, vat: 21, discount: 0, calculateFrom: 'net' };
        setFormData(prev => ({ ...prev, [type]: [...prev[type], newItem] }));
    };

    const removeItem = (type, index) => {
        const items = formData[type].filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, [type]: items }));
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        const {
            exit_date,
            mileage,
            notes,
            product_items,
            service_items,
            ...restOfData
        } = formData;

        const itemDescriptions = [...service_items, ...product_items]
            .map(item => item.description)
            .filter(Boolean);

        const autoDescription = itemDescriptions.length > 0
            ? itemDescriptions.join(', ')
            : 'Orden de trabajo';

        const extraData = {
            exit_date,
            mileage,
            product_items,
            service_items,
        };

        const separator = '---DATA---';
        const serializedData = JSON.stringify(extraData);
        const finalNotes = `${notes || ''} ${separator} ${serializedData}`.trim();

        const dataToSave = {
            ...restOfData,
            description: autoDescription.substring(0, 255),
            notes: finalNotes,
        };

        onSave(dataToSave, !!workOrder);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl glassmorphism">
                <DialogHeader>
                    <DialogTitle className="text-primary">{workOrder ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo'}</DialogTitle>
                    <DialogDescription>
                        Ingresa los detalles del nuevo documento.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div>
                            <Label htmlFor="customer_id">Cliente</Label>
                            <Select name="customer_id" value={formData.customer_id} onValueChange={(value) => handleSelectChange('customer_id', value)} required>
                                <SelectTrigger><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
                                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="vehicle_id">Vehículo</Label>
                            <Select name="vehicle_id" value={formData.vehicle_id} onValueChange={(value) => handleSelectChange('vehicle_id', value)} required disabled={!formData.customer_id}>
                                <SelectTrigger><SelectValue placeholder={!formData.customer_id ? "Selecciona un cliente primero" : "Sin vehículo específico"} /></SelectTrigger>
                                <SelectContent>
                                    {filteredVehicles.length > 0 ? filteredVehicles.map(v => <SelectItem key={v.id} value={v.id}>{`${v.brand} ${v.model} (${v.plate})`}</SelectItem>) : <SelectItem value="no-vehicles" disabled>No hay vehículos para este cliente</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="creation_date">Fecha Entrada</Label>
                            <Input id="creation_date" name="creation_date" type="date" value={formData.creation_date} onChange={handleChange} required />
                        </div>
                        <div>
                            <Label htmlFor="exit_date">Fecha Salida</Label>
                            <Input id="exit_date" name="exit_date" type="date" value={formData.exit_date} onChange={handleChange} />
                        </div>
                        <div>
                            <Label htmlFor="mileage">Kilometraje</Label>
                            <Input id="mileage" name="mileage" type="number" value={formData.mileage} onChange={handleChange} placeholder="Kilometraje" />
                        </div>
                    </div>

                    <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="text-lg font-medium text-primary">Items de Servicio</h3>
                        <div className="space-y-2">
                            {formData.service_items.map((item, index) => (
                                <ItemRow
                                    key={index}
                                    item={item}
                                    index={index}
                                    onChange={(idx, field, value) => handleItemChange('service_items', idx, field, value)}
                                    onRemove={() => removeItem('service_items', index)}
                                    type="service"
                                    products={sale_products}
                                />
                            ))}
                        </div>
                        <Button type="button" variant="outline" onClick={() => addItem('service_items')}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Agregar Servicio
                        </Button>
                    </div>

                    <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="text-lg font-medium text-primary">Items de Producto</h3>
                        <div className="space-y-2">
                            {formData.product_items.map((item, index) => (
                                <ItemRow
                                    key={index}
                                    item={item}
                                    index={index}
                                    onChange={(idx, field, value) => handleItemChange('product_items', idx, field, value)}
                                    onRemove={() => removeItem('product_items', index)}
                                    type="product"
                                    products={purchase_products}
                                />
                            ))}
                        </div>
                        <Button type="button" variant="outline" onClick={() => addItem('product_items')}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Agregar Producto
                        </Button>
                    </div>
                    
                    <div>
                        <Label htmlFor="notes">Notas Adicionales</Label>
                        <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Cualquier observación relevante" />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" className="bg-primary hover:bg-primary/90">{workOrder ? 'Guardar Cambios' : 'Crear Orden'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default WorkOrderFormDialog;