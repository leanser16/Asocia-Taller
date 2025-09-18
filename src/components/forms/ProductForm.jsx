import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';

const ProductForm = ({ product, productType, onSave, onCancel, workPriceHour = 0 }) => {
  const getInitialFormData = () => ({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    work_hours: product?.work_hours || '',
    price: product?.price || '0.00',
    cost: product?.cost || '0.00',
  });

  const [formData, setFormData] = useState(getInitialFormData);

  useEffect(() => {
    setFormData(getInitialFormData());
  }, [product, productType]);

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'work_hours' || name === 'price' || name === 'cost') {
      if (value === '' || !/^[\d.]*$/.test(value)) {
        // allow clearing the field or only numbers and dots
      } else {
        // No specific formatting here, just update state
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const calculatedPrice = useMemo(() => {
    const hours = parseFloat(formData.work_hours) || 0;
    return hours * (workPriceHour || 0);
  }, [formData.work_hours, workPriceHour]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let dataToSave = { ...formData };

    if (productType === 'Venta') {
      const finalPrice = parseFloat(dataToSave.price) || 0;
      if (finalPrice === 0 && calculatedPrice > 0) {
        dataToSave.price = calculatedPrice;
      }
    }

    onSave(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del Producto/Servicio</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Cambio de Aceite" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Detalles del producto o servicio" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <Input id="category" name="category" value={formData.category} onChange={handleChange} placeholder="Ej: Mantenimiento" />
      </div>

      {productType === 'Venta' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="work_hours">Horas de Trabajo</Label>
            <Input id="work_hours" name="work_hours" type="text" value={formData.work_hours} onChange={handleChange} placeholder="Ej: 1.5" />
          </div>
          <div className="space-y-2">
            <Label>Valor del Producto (calculado por horas)</Label>
            <div className="p-2 border rounded-md bg-muted text-muted-foreground">
              {formatCurrency(calculatedPrice)}
            </div>
            <p className="text-xs text-muted-foreground">
              Horas de Trabajo ({formData.work_hours || 0}) x Precio Hora ({formatCurrency(workPriceHour)})
            </p>
          </div>
           <div className="space-y-2">
            <Label htmlFor="price">O ingrese un precio final</Label>
            <Input id="price" name="price" type="text" value={formData.price} onChange={handleChange} placeholder="0.00" />
          </div>
        </>
      )}

      {productType === 'Compra' && (
        <div className="space-y-2">
          <Label htmlFor="cost">Costo</Label>
          <Input id="cost" name="cost" type="text" value={formData.cost} onChange={handleChange} placeholder="0.00" required />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90">{product ? 'Guardar Cambios' : 'Crear Producto'}</Button>
      </div>
    </form>
  );
};

export default ProductForm;
