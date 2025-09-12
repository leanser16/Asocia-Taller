import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { useToast } from "@/components/ui/use-toast";
import { useData } from '@/contexts/DataContext';
import { formatCurrency } from '@/lib/utils';

const ProductForm = ({ product, onSave, onCancel, productType }) => {
  const { data } = useData();
  const workPriceHour = data?.organizations?.[0]?.work_price_hour || 0;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    cost: '',
    work_hours: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        price: product.price || '',
        cost: product.cost || '',
        work_hours: product.work_hours || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        price: '',
        cost: '',
        work_hours: '',
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if ((name === 'cost' || name === 'work_hours' || name === 'price') && value !== '' && !/^\d*\.?\d*$/.test(value)) {
        return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      toast({
        title: "Error de validación",
        description: "El Nombre y la Categoría del producto son obligatorios.",
        variant: "destructive",
      });
      return;
    }
    
    const work_hours = parseFloat(formData.work_hours) || 0;
    const cost = parseFloat(formData.cost) || 0;
    let finalData = {...formData};

    if (productType === 'Venta') {
      const price = parseFloat(formData.price) || 0;
      finalData.work_hours = work_hours;
      finalData.price = price > 0 ? price : (work_hours * workPriceHour);
    } else { // Compra
      if (isNaN(cost) || cost < 0) {
          toast({
              title: "Error de validación",
              description: "El costo de compra debe ser un número válido.",
              variant: "destructive",
          });
          return;
      }
      finalData.cost = cost;
    }
    onSave(finalData);
  };

  const calculatedPrice = (parseFloat(formData.work_hours) || 0) * workPriceHour;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del Producto/Servicio</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Cambio de aceite" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Input id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Ej: Incluye filtro y aceite sintético" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <Input id="category" name="category" value={formData.category} onChange={handleChange} placeholder="Ej: Mantenimiento" required />
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
          <Label htmlFor="cost">Costo de Compra ($)</Label>
          <Input id="cost" name="cost" type="text" value={formData.cost} onChange={handleChange} placeholder="0.00" required />
        </div>
      )}
      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{product ? 'Guardar Cambios' : `Crear Producto`}</Button>
      </DialogFooter>
    </form>
  );
};

export default ProductForm;