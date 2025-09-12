import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import SaleFormHeader from '@/components/sales/SaleFormHeader';
import SaleFormItems from '@/components/sales/SaleFormItems';
import SaleFormPayment from '@/components/sales/SaleFormPayment';
import ProductForm from '@/components/forms/ProductForm';
import { useData } from '@/contexts/DataContext';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const letterOptions = {
  Factura: ['A', 'B', 'C'],
  Presupuesto: ['P'],
  Recibo: ['R'],
  Remito: ['R'],
  default: ['X']
};

const SaleForm = ({ sale, onSave, onCancel, onQuickAddCustomer, onQuickAddVehicle, statusConfig, paymentMethods, toast }) => {
  const { data, addData } = useData();
  const { customers, vehicles, sale_products: saleProducts, sales: allSales } = data;
  const { organization } = useAuth();
  const workPriceHour = organization?.work_price_hour || 0;
  const saleDocumentNumberMode = organization?.sale_document_number_mode || 'automatic';

  const getInitialIva = (type) => {
    if (type === 'Factura') return 21;
    if (type === 'Recibo') return 0;
    return 21; 
  };

  const getInitialPaymentMethods = (saleData) => {
    if (saleData && saleData.payment_methods && saleData.payment_methods.length > 0) {
        return saleData.payment_methods;
    }
    return [{ method: 'Efectivo', amount: 0, checkDetails: null, dollarDetails: null }];
  };
  
  const getInitialFormData = (sale) => {
    const type = sale?.type || 'Factura';
    return {
      sale_date: sale?.sale_date || new Date().toISOString().split('T')[0],
      due_date: sale?.due_date || new Date().toISOString().split('T')[0],
      customer_id: sale?.customer_id || null,
      type: type,
      payment_type: sale?.payment_type || (type === 'Presupuesto' ? 'N/A' : 'Contado'),
      status: sale?.status || '',
      sale_number_parts: sale?.sale_number_parts || {
        letter: letterOptions[type]?.[0] || 'X',
        pointOfSale: '0001',
        number: ''
      }
    };
  };

  const [formData, setFormData] = useState(getInitialFormData(sale));
  const [saleItems, setSaleItems] = useState(sale?.items || [{ productId: '', description: '', vehicleId: '', quantity: 1, unitPrice: 0, iva: getInitialIva(formData.type), total: 0 }]);
  const [payments, setPayments] = useState(() => getInitialPaymentMethods(sale));
  
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);

  const handleFormDataChange = useCallback((name, value) => {
    setFormData(prev => {
      const newFormData = { ...prev, [name]: value };
      if (name === 'type') {
          const newLetterOptions = letterOptions[value] || letterOptions.default;
          newFormData.sale_number_parts = { ...newFormData.sale_number_parts, letter: newLetterOptions[0]};
      }
      if (name === 'customer_id') {
          setSaleItems(prevItems => prevItems.map(item => ({...item, vehicleId: ''})));
      }
      return newFormData;
    });
  }, []);

  const getNextSaleNumber = useCallback((type, pointOfSale) => {
      if (!allSales || allSales.length === 0) return 1;

      const relevantSales = allSales.filter(s => 
        s.type === type && 
        s.sale_number_parts && 
        s.sale_number_parts.pointOfSale === pointOfSale
      );

      if (relevantSales.length === 0) return 1;

      const maxNumber = relevantSales.reduce((max, s) => {
        const num = parseInt(s.sale_number_parts.number, 10);
        return !isNaN(num) && num > max ? num : max;
      }, 0);

      return maxNumber + 1;
  }, [allSales]);

  useEffect(() => {
    if (!sale && saleDocumentNumberMode === 'automatic') {
      const pointOfSale = formData.sale_number_parts.pointOfSale || '0001';
      const nextNum = getNextSaleNumber(formData.type, pointOfSale);
      const newNumber = String(nextNum).padStart(8, '0');
      handleFormDataChange('sale_number_parts', {...formData.sale_number_parts, number: newNumber});
    }
  }, [formData.type, formData.sale_number_parts.pointOfSale, getNextSaleNumber, sale, saleDocumentNumberMode, handleFormDataChange]);

  useEffect(() => {
    if (sale) {
        setFormData(getInitialFormData(sale));
        const items = Array.isArray(sale.items) ? sale.items : [{ productId: '', description: '', vehicleId: '', quantity: 1, unitPrice: 0, iva: getInitialIva(sale.type), total: 0 }];
        setSaleItems(items.map(item => ({...item, vehicleId: item.vehicleId || ''})));
        setPayments(getInitialPaymentMethods(sale));
    } else {
        const newInitialData = getInitialFormData(null);
        setFormData(newInitialData);
        setSaleItems([{ productId: '', description: '', vehicleId: '', quantity: 1, unitPrice: 0, iva: getInitialIva(newInitialData.type), total: 0 }]);
        setPayments([{ method: 'Efectivo', amount: 0, checkDetails: null, dollarDetails: null }]);
    }
  }, [sale]);

  useEffect(() => {
    setFormData(prev => {
        const newFormData = {...prev};
        if (prev.type === 'Presupuesto') {
          newFormData.payment_type = 'N/A';
          setPayments([]);
        } else if (prev.payment_type === 'N/A' || !prev.payment_type) {
          newFormData.payment_type = 'Contado';
        } else if (prev.payment_type === 'Cuenta Corriente') {
          setPayments([]);
        } else if (prev.payment_type === 'Contado' && payments.length === 0) {
            setPayments([{ method: 'Efectivo', amount: 0, checkDetails: null, dollarDetails: null }]);
        }
        return newFormData;
    })
  }, [formData.type, formData.payment_type]);

  useEffect(() => {
      const newIva = getInitialIva(formData.type);
      setSaleItems(items => items.map(item => {
          const quantity = parseFloat(item.quantity) || 0;
          const unitPrice = parseFloat(item.unitPrice) || 0;
          const subtotal = quantity * unitPrice;
          const total = subtotal + (subtotal * (newIva / 100));
          return { ...item, iva: newIva, total: total };
      }))
  }, [formData.type, workPriceHour]);
  
  const handleItemChange = (index, field, value) => {
    const newItems = [...saleItems];
    const currentItem = { ...newItems[index] };
    currentItem[field] = value;

    if (field === 'productId') {
        const selectedProduct = saleProducts.find(p => p.id === value);
        if (selectedProduct) {
            currentItem.description = selectedProduct.name;
            const calculatedPrice = (selectedProduct.work_hours || 0) * workPriceHour;
            currentItem.unitPrice = calculatedPrice > 0 ? calculatedPrice : selectedProduct.price;
        }
    }

    const quantity = parseFloat(currentItem.quantity) || 0;
    const unitPrice = parseFloat(currentItem.unitPrice) || 0;
    const subtotal = quantity * unitPrice;
    const ivaPercent = parseFloat(currentItem.iva) || 0;
    currentItem.total = subtotal * (1 + (ivaPercent / 100));
    
    newItems[index] = currentItem;
    setSaleItems(newItems);
  };

  const addItem = () => {
    setSaleItems([...saleItems, { productId: '', description: '', vehicleId: '', quantity: 1, unitPrice: 0, iva: getInitialIva(formData.type), total: 0 }]);
  };

  const removeItem = (index) => {
    const newItems = saleItems.filter((_, i) => i !== index);
    setSaleItems(newItems);
  };

  const calculateGrandTotal = () => {
    return saleItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  };
  
  const calculateTotalPaid = () => {
    return payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  };

  const handlePaymentChange = (index, field, value) => {
    const newPayments = [...payments];
    newPayments[index][field] = value;
    setPayments(newPayments);
  };

  const addPaymentMethod = () => {
    setPayments([...payments, { method: 'Efectivo', amount: 0, checkDetails: null, dollarDetails: null }]);
  };

  const removePaymentMethod = (index) => {
    const newPayments = payments.filter((_, i) => i !== index);
    setPayments(newPayments);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.customer_id) {
        toast({
            variant: "destructive",
            title: "Falta el Cliente",
            description: "Por favor, selecciona un cliente antes de guardar.",
        });
        return;
    }
    
    const grandTotal = calculateGrandTotal();
    const totalPaid = calculateTotalPaid();
    const difference = totalPaid - grandTotal;

    if (formData.payment_type === 'Contado' && Math.abs(difference) > 0.01) {
      toast({
        variant: "destructive",
        title: "Error en el Monto del Pago",
        description: `El monto pagado (${formatCurrency(totalPaid)}) no coincide con el total (${formatCurrency(grandTotal)}). ${difference > 0 ? 'Sobra' : 'Falta'} ${formatCurrency(Math.abs(difference))}.`,
      });
      return;
    }

    const saleNumberParts = {
      letter: formData.sale_number_parts.letter,
      pointOfSale: formData.sale_number_parts.pointOfSale,
      number: formData.sale_number_parts.number,
    };
    
    const saleDataToSave = {
      ...formData,
      customer_id: formData.customer_id || null,
      sale_number_parts: saleNumberParts,
      sale_number: `${saleNumberParts.letter}-${saleNumberParts.pointOfSale}-${saleNumberParts.number}`,
      items: saleItems.map(item => {
        const selectedVehicle = vehicles.find(v => v.id === item.vehicleId);
        return {
          ...item,
          vehicleName: selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.plate})` : 'N/A',
          quantity: parseFloat(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          iva: parseFloat(item.iva) || 0,
          total: parseFloat(item.total) || 0,
        }
      }),
      total: grandTotal,
      payment_methods: payments
    };

    if (sale) {
        saleDataToSave.status = formData.status;
    } else {
        if (saleDataToSave.type === 'Presupuesto') {
            saleDataToSave.status = 'Pendiente';
        } else if (saleDataToSave.payment_type === 'Contado') {
            saleDataToSave.status = 'Pagado';
        } else {
            saleDataToSave.status = 'Pendiente de Pago';
        }
    }

    saleDataToSave.balance = saleDataToSave.status === 'Pagado' ? 0 : grandTotal;

    onSave(saleDataToSave);
  };

  const handleSaveQuickProduct = async (productData) => {
    try {
      const dataToSave = {
        name: productData.name,
        description: productData.description,
        category: productData.category,
        price: parseFloat(productData.price) || 0,
        work_hours: parseFloat(productData.work_hours) || 0,
      };
      await addData('sale_products', dataToSave);
      toast({ title: "Producto Creado", description: `El producto ${productData.name} ha sido creado.` });
      setIsProductFormOpen(false);
    } catch (error) {
      toast({ title: "Error", description: `Error al crear producto: ${error.message}`, variant: "destructive" });
    }
  };

  const getAvailableStatuses = () => {
    if (formData.type === 'Presupuesto') {
      return ['Pendiente', 'Aceptado', 'Rechazado', 'Facturado'];
    }
    if (formData.type === 'Factura' || formData.type === 'Recibo') {
      return ['Pendiente de Pago', 'Pagado', 'Anulada'];
    }
    return Object.keys(statusConfig);
  };

  const grandTotal = calculateGrandTotal();
  const totalPaid = calculateTotalPaid();

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
      <SaleFormHeader
        formData={formData}
        onFormDataChange={handleFormDataChange}
        customers={customers || []}
        onQuickAddCustomer={onQuickAddCustomer}
        getAvailableStatuses={getAvailableStatuses}
        saleDocumentNumberMode={saleDocumentNumberMode}
      />
      
      <SaleFormItems
        saleItems={saleItems}
        handleItemChange={handleItemChange}
        removeItem={removeItem}
        addItem={addItem}
        vehicles={vehicles || []}
        onQuickAddVehicle={onQuickAddVehicle}
        customerId={formData.customer_id}
        documentType={formData.type}
        saleProducts={saleProducts || []}
        onQuickAddProduct={() => setIsProductFormOpen(true)}
      />
      
      <SaleFormPayment
        formData={formData}
        onFormDataChange={handleFormDataChange}
        grandTotal={grandTotal}
        totalPaid={totalPaid}
        payments={payments}
        paymentMethods={paymentMethods}
        handlePaymentChange={handlePaymentChange}
        addPaymentMethod={addPaymentMethod}
        removePaymentMethod={removePaymentMethod}
      />

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90">{sale ? 'Guardar Cambios' : 'Crear Documento'}</Button>
      </DialogFooter>
    </form>
    <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Producto de Venta Rápido</DialogTitle>
          <DialogDescription>Ingresa los datos del nuevo producto.</DialogDescription>
        </DialogHeader>
        <ProductForm 
          onSave={handleSaveQuickProduct} 
          onCancel={() => setIsProductFormOpen(false)} 
          productType="Venta"
        />
      </DialogContent>
    </Dialog>
    </>
  );
};

export default SaleForm;