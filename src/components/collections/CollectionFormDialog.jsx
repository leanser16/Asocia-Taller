import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CheckDetailsForm from '@/components/shared/CheckDetailsForm';
import { formatCurrency, formatSaleNumber } from '@/lib/utils';
import { useToast } from "@/components/ui/use-toast";

const paymentMethods = ["Efectivo", "Transferencia", "Tarjeta de Crédito", "Tarjeta de Débito", "Cheque", "Dolares"];

const CollectionFormDialog = ({ isOpen, onOpenChange, collection, sale, allSales, onSave }) => {
  const { toast } = useToast();
  const [selectedSale, setSelectedSale] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [checkDetails, setCheckDetails] = useState(null);
  const [transferDetails, setTransferDetails] = useState(null);
  const [amount, setAmount] = useState(0);
  const [dollarFields, setDollarFields] = useState({ exchangeRate: 1, quantity: 0 });
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    if (isOpen) {
      const initialSale = sale || (collection ? allSales.find(s => s.id === collection.sale_id) : null);
      setSelectedSale(initialSale);
      
      const initialMethod = collection?.method || 'Efectivo';
      setPaymentMethod(initialMethod);

      const initialAmount = collection?.amount || initialSale?.balance || 0;
      setAmount(initialAmount);

      setCollectionDate(collection?.collection_date || new Date().toISOString().split('T')[0]);
      
      setCustomerName(initialSale?.customerName || collection?.customerName || '');

      if (initialMethod === 'Cheque') {
        setCheckDetails(collection?.check_details || { checkNumber: '', dueDate: '', bank: '', isThirdParty: false, thirdPartyName: '' });
      } else {
        setCheckDetails(null);
      }
      
      if (initialMethod === 'Transferencia') {
        setTransferDetails(collection?.transfer_details || { accountHolder: '', bank: '' });
      } else {
        setTransferDetails(null);
      }

      if (initialMethod === 'Dolares' && collection?.dollardetails) {
        setDollarFields(collection.dollardetails);
      } else {
        setDollarFields({ exchangeRate: 1, quantity: 0 });
      }
    } else {
      setAmount(0);
      setSelectedSale(null);
      setCustomerName('');
      setPaymentMethod('Efectivo');
    }
  }, [collection, sale, allSales, isOpen]);

  const handleMethodChange = (value) => {
    setPaymentMethod(value);
    setCheckDetails(value === 'Cheque' ? { checkNumber: '', dueDate: '', bank: '', isThirdParty: false, thirdPartyName: '' } : null);
    setTransferDetails(value === 'Transferencia' ? { accountHolder: '', bank: '' } : null);
    if (value !== 'Dolares') {
      setDollarFields({ exchangeRate: 1, quantity: 0 });
    }
  };

  const handleDollarFieldChange = (e) => {
    const { name, value } = e.target;
    const newDollarFields = { ...dollarFields, [name]: parseFloat(value) || 0 };
    setDollarFields(newDollarFields);
    const totalInPesos = newDollarFields.exchangeRate * newDollarFields.quantity;
    setAmount(totalInPesos);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedSale) {
      toast({ title: "Error", description: "Por favor, selecciona una venta de referencia.", variant: "destructive" });
      return;
    }
    
    const finalAmount = parseFloat(amount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      toast({ title: "Error", description: "El monto debe ser un número positivo.", variant: "destructive" });
      return;
    }

    const collectionData = {
      id: collection?.id,
      sale_id: selectedSale.id,
      customer_id: selectedSale.customer_id,
      collection_date: collectionDate,
      amount: finalAmount,
      method: paymentMethod,
      check_details: paymentMethod === 'Cheque' ? checkDetails : null,
      transfer_details: paymentMethod === 'Transferencia' ? transferDetails : null,
      dollardetails: paymentMethod === 'Dolares' ? dollarFields : null,
    };
    
    onSave(collectionData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] glassmorphism">
        <DialogHeader>
          <DialogTitle className="text-primary">{collection ? 'Editar Cobro' : 'Registrar Nuevo Cobro'}</DialogTitle>
          <DialogDescription>
            {collection ? 'Modifica los detalles del cobro.' : 'Ingresa los detalles del nuevo cobro.'}
            {selectedSale && !collection && (
              <span className="block mt-1 text-sm text-blue-600 dark:text-blue-400">Cobrando Factura: {formatSaleNumber(selectedSale)} (Saldo: {formatCurrency(selectedSale.balance || 0)})</span>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" name="date" type="date" value={collectionDate} onChange={(e) => setCollectionDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Método</Label>
              <Select name="method" value={paymentMethod} onValueChange={handleMethodChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona método de pago" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="saleId">Ref. Venta</Label>
            {sale && !collection ? (
               <Input id="saleId" name="saleId" value={formatSaleNumber(sale)} readOnly />
            ) : (
              <Select name="saleId" value={selectedSale?.id || ''} required onValueChange={(value) => {
                const newSelectedSale = allSales.find(s => s.id === value);
                setSelectedSale(newSelectedSale);
                if (newSelectedSale) {
                  setAmount(newSelectedSale.balance);
                  setCustomerName(newSelectedSale.customerName);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar Venta" />
                </SelectTrigger>
                <SelectContent>
                  {allSales.filter(s => (s.type === 'Factura' || s.type === 'Recibo') && (s.status === 'Pendiente de Pago' || s.id === collection?.sale_id)).map(s => (
                    <SelectItem key={s.id} value={s.id}>{formatSaleNumber(s)} - {s.customerName} ({formatCurrency(s.balance || 0)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerName">Cliente</Label>
            <Input id="customerName" name="customerName" value={customerName} placeholder="Nombre del cliente" required readOnly />
          </div>
          
          {paymentMethod === 'Dolares' && (
            <div className="p-3 border rounded-md space-y-3 bg-muted/20">
              <div className="grid grid-cols-3 gap-3">
                  <div>
                      <Label htmlFor="exchangeRate">Tipo Cambio</Label>
                      <Input id="exchangeRate" name="exchangeRate" type="number" step="0.01" value={dollarFields.exchangeRate} onChange={handleDollarFieldChange} />
                  </div>
                  <div>
                      <Label htmlFor="quantity">Cant. USD</Label>
                      <Input id="quantity" name="quantity" type="number" step="0.01" value={dollarFields.quantity} onChange={handleDollarFieldChange} />
                  </div>
                   <div>
                      <Label>Total en Pesos</Label>
                      <Input value={formatCurrency(amount)} readOnly className="font-semibold" />
                  </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Monto ($)</Label>
            <Input id="amount" name="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required max={selectedSale?.balance} readOnly={paymentMethod === 'Dolares'} />
          </div>
          
          {paymentMethod === 'Cheque' && checkDetails && (
            <CheckDetailsForm 
              checkDetails={checkDetails}
              onCheckDetailsChange={setCheckDetails}
              idPrefix="manual-coll-chk"
            />
          )}

          {paymentMethod === 'Transferencia' && transferDetails && (
            <div className="p-3 border rounded-md space-y-3 bg-muted/20">
              <div>
                <Label htmlFor="transfer-account-holder">Titular de la Cuenta</Label>
                <Input id="transfer-account-holder" value={transferDetails.accountHolder} onChange={(e) => setTransferDetails({...transferDetails, accountHolder: e.target.value})} />
              </div>
              <div>
                <Label htmlFor="transfer-bank">Banco o Billetera Virtual</Label>
                <Input id="transfer-bank" value={transferDetails.bank} onChange={(e) => setTransferDetails({...transferDetails, bank: e.target.value})} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">{collection ? 'Guardar Cambios' : 'Registrar Cobro'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CollectionFormDialog;