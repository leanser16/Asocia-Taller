import React, { useState, useEffect, useCallback } from 'react';
        import { Button } from '@/components/ui/button';
        import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
        import PurchaseFormHeader from '@/components/purchases/PurchaseFormHeader';
        import PurchaseFormItems from '@/components/purchases/PurchaseFormItems';
        import PurchaseFormPayment from '@/components/purchases/PurchaseFormPayment';
        import ProductForm from '@/components/forms/ProductForm';
        import { useData } from '@/contexts/DataContext';
        import { formatCurrency } from '@/lib/utils';
        import { ScrollArea } from '@/components/ui/scroll-area';

        const paymentMethods = ["Efectivo", "Transferencia", "Tarjeta de Crédito", "Tarjeta de Débito", "Cheque", "Dolares"];

        const getNewItem = () => ({
          id: `temp-${Date.now()}-${Math.random()}`,
          productId: '',
          description: '',
          quantity: 1,
          unitPrice: 0,
          iva: 21,
          ivaAmount: 0,
          total: 0,
          calculationMode: 'net'
        });
        
        const getNewPayment = () => ({
            id: `pay-temp-${Date.now()}`,
            method: 'Efectivo',
            amount: 0,
            checkDetails: null,
            dollarDetails: null,
            transferDetails: null
        });

        const PurchaseForm = ({ purchase, onSave, onCancel, onQuickAddSupplier, toast }) => {
          const { data, addData } = useData();
          const { suppliers, purchase_products: purchaseProducts } = data;

          const getInitialFormData = useCallback((purchase) => {
            const defaultState = {
              supplierId: '',
              date: new Date().toISOString().split('T')[0],
              dueDate: new Date().toISOString().split('T')[0],
              documentType: 'Factura',
              paymentType: 'Contado',
              document_number_parts: {
                letter: 'A',
                pointOfSale: '0001',
                number: ''
              }
            };

            if (purchase) {
              return {
                supplierId: purchase.supplier_id || '',
                date: purchase.purchase_date || defaultState.date,
                dueDate: purchase.due_date || defaultState.dueDate,
                documentType: purchase.document_type || defaultState.documentType,
                paymentType: purchase.payment_type || defaultState.paymentType,
                document_number_parts: purchase.document_number_parts || defaultState.document_number_parts,
              };
            }
            return defaultState;
          }, []);

          const getInitialItems = (purchase) => {
            if (purchase?.items && purchase.items.length > 0) {
              return purchase.items.map((item, index) => ({
                id: `item-${index}-${Date.now()}`,
                ...item,
                calculationMode: 'net',
              }));
            }
            return [getNewItem()];
          };
          
          const getInitialPayments = (purchase) => {
            if (purchase?.payment_methods && purchase.payment_methods.length > 0) {
                return purchase.payment_methods.map(p => ({ ...p, id: p.id || `pay-temp-${Date.now()}-${Math.random()}` }));
            }
            return [getNewPayment()];
          };

          const [formData, setFormData] = useState(getInitialFormData(purchase));
          const [purchaseItems, setPurchaseItems] = useState(getInitialItems(purchase));
          const [payments, setPayments] = useState(getInitialPayments(purchase));
          const [isProductFormOpen, setIsProductFormOpen] = useState(false);

          useEffect(() => {
            if (purchase) {
              setFormData(getInitialFormData(purchase));
              setPurchaseItems(getInitialItems(purchase));
              setPayments(getInitialPayments(purchase));
            } else {
              setFormData(getInitialFormData(null));
              setPurchaseItems([getNewItem()]);
              setPayments([getNewPayment()]);
            }
          }, [purchase, getInitialFormData]);

          const handleFormDataChange = useCallback((name, value) => {
            setFormData(prev => ({ ...prev, [name]: value }));
          }, []);

          const handleItemChange = (index, field, value) => {
            setPurchaseItems(prevItems => {
                const newItems = [...prevItems];
                const currentItem = { ...newItems[index] };
                currentItem[field] = value;

                if (field === 'productId') {
                    const selectedProduct = purchaseProducts.find(p => p.id === value);
                    if (selectedProduct) {
                        currentItem.description = selectedProduct.name;
                        currentItem.unitPrice = selectedProduct.cost;
                         if (currentItem.calculationMode === 'total') {
                           currentItem.calculationMode = 'net'; 
                        }
                    }
                }
                
                const quantity = parseFloat(currentItem.quantity) || 0;
                const ivaPercent = parseFloat(currentItem.iva) || 0;
                
                if (currentItem.calculationMode === 'net') {
                    const unitPrice = parseFloat(currentItem.unitPrice) || 0;
                    const subtotal = quantity * unitPrice;
                    currentItem.ivaAmount = subtotal * (ivaPercent / 100);
                    currentItem.total = subtotal + currentItem.ivaAmount;
                } else { // calculationMode === 'total'
                    const total = parseFloat(currentItem.total) || 0;
                    const subtotal = total / (1 + ivaPercent / 100);
                    currentItem.ivaAmount = total - subtotal;
                    currentItem.unitPrice = quantity > 0 ? subtotal / quantity : 0;
                }
                
                newItems[index] = currentItem;
                return newItems;
            });
          };

          const addItem = () => {
            setPurchaseItems([...purchaseItems, getNewItem()]);
          };

          const removeItem = (index) => {
            const newItems = purchaseItems.filter((_, i) => i !== index);
            setPurchaseItems(newItems);
          };

          const calculateGrandTotal = () => {
            return purchaseItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
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
            setPayments([...payments, getNewPayment()]);
          };

          const removePaymentMethod = (index) => {
            const newPayments = payments.filter((_, i) => i !== index);
            setPayments(newPayments);
          };

          const handleSubmit = (e) => {
            e.preventDefault();
            
            const validPayments = payments.filter(p => parseFloat(p.amount) > 0.009);
            const grandTotal = calculateGrandTotal();
            const totalPaid = validPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
            const difference = totalPaid - grandTotal;

            if (formData.paymentType === 'Contado' && Math.abs(difference) > 0.01) {
              toast({
                variant: "destructive",
                title: "Error en el Monto del Pago",
                description: `El monto pagado (${formatCurrency(totalPaid)}) no coincide con el total (${formatCurrency(grandTotal)}). ${difference > 0 ? 'Sobra' : 'Falta'} ${formatCurrency(Math.abs(difference))}.`,
              });
              return;
            }

            const purchaseDataToSave = {
              ...formData,
              items: purchaseItems.map(item => ({
                productId: item.productId,
                description: item.description,
                quantity: parseFloat(item.quantity) || 0,
                unitPrice: parseFloat(item.unitPrice) || 0,
                iva: parseFloat(item.iva) || 0,
                ivaAmount: parseFloat(item.ivaAmount) || 0,
                total: parseFloat(item.total) || 0,
              })),
              total: grandTotal,
              payment_methods: validPayments,
              balance: formData.paymentType === 'Contado' ? 0 : grandTotal - totalPaid,
            };

            onSave(purchaseDataToSave);
          };

          const handleSaveQuickProduct = async (productData) => {
            try {
              const dataToSave = {
                name: productData.name,
                description: productData.description,
                category: productData.category,
                cost: parseFloat(productData.cost) || 0,
              };
              await addData('purchase_products', dataToSave);
              toast({ title: "Producto Creado", description: `El producto ${productData.name} ha sido creado.` });
              setIsProductFormOpen(false);
            } catch (error) {
              toast({ title: "Error", description: `Error al crear producto: ${error.message}`, variant: "destructive" });
            }
          };

          const grandTotal = calculateGrandTotal();
          const totalPaid = calculateTotalPaid();

          return (
            <>
              <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                <ScrollArea className="flex-grow pr-6 -mr-6">
                    <div className="space-y-6 py-4">
                        <PurchaseFormHeader
                          formData={formData}
                          onFormDataChange={handleFormDataChange}
                          suppliers={suppliers || []}
                          onQuickAddSupplier={onQuickAddSupplier}
                        />
                        
                        <PurchaseFormItems
                          purchaseItems={purchaseItems}
                          handleItemChange={handleItemChange}
                          removeItem={removeItem}
                          addItem={addItem}
                          purchaseProducts={purchaseProducts || []}
                          onQuickAddProduct={() => setIsProductFormOpen(true)}
                        />
                        
                        <PurchaseFormPayment
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
                    </div>
                </ScrollArea>
                <DialogFooter className="pt-4 mt-auto flex-shrink-0 bg-background">
                  <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90">{purchase ? 'Guardar Cambios' : 'Crear Compra'}</Button>
                </DialogFooter>
              </form>
              <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nuevo Producto de Compra Rápido</DialogTitle>
                    <DialogDescription>Ingresa los datos del nuevo producto.</DialogDescription>
                  </DialogHeader>
                  <ProductForm 
                    onSave={handleSaveQuickProduct} 
                    onCancel={() => setIsProductFormOpen(false)} 
                    productType="Compra"
                  />
                </DialogContent>
              </Dialog>
            </>
          );
        };

        export default PurchaseForm;