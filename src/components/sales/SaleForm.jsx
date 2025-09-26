import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import SaleFormHeader from '@/components/sales/SaleFormHeader';
import SaleFormItems from '@/components/sales/SaleFormItems';
import SaleFormPayment from '@/components/sales/SaleFormPayment';
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

const SaleForm = ({ sale, onSave, onCancel, onQuickAddCustomer, onQuickAddVehicle, onQuickAddProduct, statusConfig, paymentMethods, toast }) => {
  const { data } = useData();
  const { customers, vehicles, sale_products: saleProducts, sales: allSales } = data;
  const { organization } = useAuth();
  const workPriceHour = organization?.work_price_hour || 0;
  const saleDocumentNumberMode = organization?.sale_document_number_mode || 'automatic';

  const getInitialIva = (type) => {
    if (type === 'Recibo') return 0;
    return 21;
  };

  const calculateItemIvaAmount = (item) => {
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
  }

  const getInitialItem = (type) => ({
    productId: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    iva: getInitialIva(type),
    ivaAmount: 0,
    discount: 0,
    calculationMode: 'net',
    total: 0
  });

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
      vehicle_id: sale?.vehicle_id || null,
      type: type,
      payment_type: sale?.payment_type || (type === 'Presupuesto' ? 'N/A' : 'Contado'),
      status: sale?.status || '',
      sale_number_parts: sale?.sale_number_parts || {
        letter: letterOptions[type]?.[0] || 'X',
        pointOfSale: '0001',
        number: '00000001'
      }
    };
  };

  const [formData, setFormData] = useState(getInitialFormData(sale));
  const [saleItems, setSaleItems] = useState(sale?.items ? sale.items.map(item => ({...getInitialItem(formData.type), ...item, ivaAmount: calculateItemIvaAmount(item)})) : [getInitialItem(formData.type)]);
  const [payments, setPayments] = useState(() => getInitialPaymentMethods(sale));
  const [isFormValid, setIsFormValid] = useState(false);

  const handleFormDataChange = useCallback((name, value) => {
    setFormData(prev => {
      const newFormData = { ...prev, [name]: value };
      if (name === 'type') {
          const newLetterOptions = letterOptions[value] || letterOptions.default;
          newFormData.sale_number_parts = { ...newFormData.sale_number_parts, letter: newLetterOptions[0]};
      }
      if (name === 'customer_id') {
          newFormData.vehicle_id = null;
      }
      return newFormData;
    });
  }, []);

  useEffect(() => {
    if (sale) {
        setFormData(getInitialFormData(sale));
        const items = Array.isArray(sale.items) ? sale.items : [getInitialItem(sale.type)];
        setSaleItems(items.map(({ vehicleId, ...item }) => ({...getInitialItem(sale.type), ...item, ivaAmount: calculateItemIvaAmount(item)})));
        setPayments(getInitialPaymentMethods(sale));
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
  }, [formData.type, formData.payment_type, payments.length]);

  useEffect(() => {
      const newIva = getInitialIva(formData.type);
      setSaleItems(items => items.map(item => {
        const newItem = { ...item, iva: newIva };
        const updatedItem = { ...newItem, ivaAmount: calculateItemIvaAmount(newItem) }; // Recalculate ivaAmount
        return { ...updatedItem, total: calculateItemTotal(updatedItem) };
      }))
  }, [formData.type]);

  const calculateItemTotal = (item) => {
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
    const ivaAmount = subtotalAfterDiscount * (iva / 100);

    return subtotalAfterDiscount + ivaAmount;
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...saleItems];
    const item = { ...newItems[index], [field]: value };

    if (field === 'productId') {
        const selectedProduct = saleProducts.find(p => p.id === value);
        if (selectedProduct) {
            item.description = selectedProduct.name;
            const calculatedPrice = (selectedProduct.work_hours || 0) * workPriceHour;
            const basePrice = calculatedPrice > 0 ? calculatedPrice : (selectedProduct.price || 0);

            if (item.calculationMode === 'total') {
                item.unitPrice = basePrice * (1 + (item.iva / 100));
            } else {
                item.unitPrice = basePrice;
            }
        }
    }

    if (field === 'calculationMode') {
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const iva = parseFloat(item.iva) || 0;
        const previousMode = newItems[index].calculationMode;

        if (value === 'total' && previousMode === 'net') {
            item.unitPrice = unitPrice * (1 + (iva / 100));
        } else if (value === 'net' && previousMode === 'total') {
            item.unitPrice = unitPrice / (1 + (iva / 100));
        }
    }

    item.ivaAmount = calculateItemIvaAmount(item); // Recalculate ivaAmount
    item.total = calculateItemTotal(item);

    newItems[index] = item;
    setSaleItems(newItems);
  };

  const addItem = () => {
    setSaleItems([...saleItems, getInitialItem(formData.type)]);
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

  useEffect(() => {
    const grandTotal = calculateGrandTotal();
    const totalPaid = calculateTotalPaid();
    const difference = totalPaid - grandTotal;

    let formIsValid = true;

    if (!formData.customer_id) {
        formIsValid = false;
    }

    if (formData.payment_type === 'Contado' && Math.abs(difference) > 0.01) {
        formIsValid = false;
    }

    setIsFormValid(formIsValid);
  }, [formData.customer_id, formData.payment_type, payments, saleItems, calculateGrandTotal, calculateTotalPaid]);


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
    
    // The button is disabled if not valid, so these toasts are not strictly necessary for preventing submission,
    // but can be re-added for immediate feedback if desired.
    // if (!formData.customer_id) {
    //     toast({
    //         variant: "destructive",
    //         title: "Falta el Cliente",
    //         description: "Por favor, selecciona un cliente antes de guardar.",
    //     });
    //     return;
    // }

    const grandTotal = calculateGrandTotal();
    const totalPaid = calculateTotalPaid();
    // No need to check difference here as button is disabled if not valid

    const saleNumberParts = {
      letter: formData.sale_number_parts.letter,
      pointOfSale: formData.sale_number_parts.pointOfSale,
      number: formData.sale_number_parts.number,
    };

    const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id);

    const saleDataToSave = {
      ...formData,
      customer_id: formData.customer_id || null,
      vehicle_id: formData.vehicle_id || null,
      vehicleName: selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.plate})` : 'N/A',
      sale_number_parts: saleNumberParts,
      sale_number: `${saleNumberParts.letter}-${saleNumberParts.pointOfSale}-${saleNumberParts.number}`,
      items: saleItems.map(item => {
        const { vehicleId, ...rest } = item;
        return {
          ...rest,
          quantity: parseFloat(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          iva: parseFloat(item.iva) || 0,
          ivaAmount: parseFloat(item.ivaAmount) || 0, // Ensure ivaAmount is saved
          discount: parseFloat(item.discount) || 0,
          total: parseFloat(item.total) || 0,
        }
      }),
      total: grandTotal,
      payment_methods: payments
    };

    if (sale?.id) {
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
    <form onSubmit={handleSubmit} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
      <SaleFormHeader
        formData={formData}
        onFormDataChange={handleFormDataChange}
        customers={customers || []}
        onQuickAddCustomer={onQuickAddCustomer}
        vehicles={vehicles || []}
        onQuickAddVehicle={onQuickAddVehicle}
        getAvailableStatuses={getAvailableStatuses}
        saleDocumentNumberMode={saleDocumentNumberMode}
      />

      <SaleFormItems
        saleItems={saleItems}
        handleItemChange={handleItemChange}
        removeItem={removeItem}
        addItem={addItem}
        documentType={formData.type}
        saleProducts={saleProducts || []}
        onQuickAddProduct={onQuickAddProduct}
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
        <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={!isFormValid}>{sale?.isNew ? 'Crear Documento' : 'Guardar Cambios'}</Button>
      </DialogFooter>
    </form>
  );
};

export default SaleForm;