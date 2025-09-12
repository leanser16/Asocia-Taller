import React, { useState, useEffect } from 'react';
    import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from "@/components/ui/label";
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
    import CheckDetailsForm from '@/components/shared/CheckDetailsForm';
    import { formatCurrency, formatPurchaseNumber } from '@/lib/utils';
    import { useToast } from "@/components/ui/use-toast";

    const paymentMethods = ["Efectivo", "Transferencia", "Tarjeta de Crédito", "Tarjeta de Débito", "Cheque", "Dolares"];

    const PaymentFormDialog = ({ isOpen, onOpenChange, payment, purchase, allPurchases, onSave }) => {
      const { toast } = useToast();
      const [selectedPurchase, setSelectedPurchase] = useState(null);
      const [paymentMethod, setPaymentMethod] = useState('Transferencia');
      const [checkDetails, setCheckDetails] = useState(null);
      const [transferDetails, setTransferDetails] = useState(null);
      const [amount, setAmount] = useState(0);
      const [dollarFields, setDollarFields] = useState({ exchangeRate: 1, quantity: 0 });
      const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
      const [supplierName, setSupplierName] = useState('');

      useEffect(() => {
        if (isOpen) {
          const initialPurchase = purchase || (payment ? allPurchases.find(p => p.id === payment.purchase_id) : null);
          setSelectedPurchase(initialPurchase);

          const initialMethod = payment?.method || 'Transferencia';
          setPaymentMethod(initialMethod);
          
          const initialAmount = payment?.amount || initialPurchase?.balance || 0;
          setAmount(initialAmount);

          setPaymentDate(payment?.payment_date || new Date().toISOString().split('T')[0]);
          setSupplierName(initialPurchase?.supplierName || payment?.supplierName || '');

          if (initialMethod === 'Cheque') {
            setCheckDetails(payment?.check_details || { checkNumber: '', dueDate: '', bank: '', isThirdParty: false, thirdPartyName: '' });
          } else {
            setCheckDetails(null);
          }
          
          if (initialMethod === 'Transferencia') {
            setTransferDetails(payment?.transfer_details || { accountHolder: '', bank: '' });
          } else {
            setTransferDetails(null);
          }

          if (initialMethod === 'Dolares' && payment?.dollardetails) {
            setDollarFields(payment.dollardetails);
          } else {
            setDollarFields({ exchangeRate: 1, quantity: 0 });
          }
        } else {
          setAmount(0);
          setSelectedPurchase(null);
          setSupplierName('');
          setPaymentMethod('Transferencia');
        }
      }, [payment, purchase, allPurchases, isOpen]);

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
        
        if (!selectedPurchase) {
          toast({ title: "Error", description: "Por favor, selecciona una compra de referencia.", variant: "destructive" });
          return;
        }
        
        const finalAmount = parseFloat(amount);
        if (isNaN(finalAmount) || finalAmount <= 0) {
          toast({ title: "Error", description: "El monto debe ser un número positivo.", variant: "destructive" });
          return;
        }

        const paymentData = {
          id: payment?.id,
          purchase_id: selectedPurchase.id,
          supplier_id: selectedPurchase.supplier_id,
          payment_date: paymentDate,
          amount: finalAmount,
          method: paymentMethod,
          check_details: paymentMethod === 'Cheque' ? checkDetails : null,
          transfer_details: paymentMethod === 'Transferencia' ? transferDetails : null,
          dollardetails: paymentMethod === 'Dolares' ? dollarFields : null,
          status: 'Pagado'
        };
        
        onSave(paymentData);
      };
      
      const pendingPurchases = Array.isArray(allPurchases) 
        ? allPurchases.filter(p => (p.status === 'Pendiente de Pago' || p.id === payment?.purchase_id))
        : [];

      return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[480px] glassmorphism">
            <DialogHeader>
              <DialogTitle className="text-primary">{payment ? 'Editar Pago' : 'Registrar Nuevo Pago'}</DialogTitle>
              <DialogDescription>
                {payment ? 'Modifica los detalles del pago.' : 'Ingresa los detalles del nuevo pago.'}
                {selectedPurchase && !payment && (
                  <span className="block mt-1 text-sm text-blue-600 dark:text-blue-400">Pagando Compra: {formatPurchaseNumber(selectedPurchase)} (Saldo: {formatCurrency(selectedPurchase.balance || 0)})</span>
                )}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input id="date" name="date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
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
                <Label htmlFor="purchaseId">Ref. Compra</Label>
                {purchase && !payment ? (
                   <Input id="purchaseId" name="purchaseId" value={formatPurchaseNumber(purchase)} readOnly />
                ) : (
                  <Select name="purchaseId" value={selectedPurchase?.id || ''} required onValueChange={(value) => {
                    const newSelectedPurchase = allPurchases.find(p => p.id === value);
                    setSelectedPurchase(newSelectedPurchase);
                    if (newSelectedPurchase) {
                      setAmount(newSelectedPurchase.balance);
                      setSupplierName(newSelectedPurchase.supplierName);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar Compra" />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingPurchases.length > 0 ? (
                        pendingPurchases.map(p => (
                          <SelectItem key={p.id} value={p.id}>{formatPurchaseNumber(p)} - {p.supplierName} ({formatCurrency(p.balance || 0)})</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-purchases" disabled>No hay compras pendientes</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierName">Proveedor</Label>
                <Input id="supplierName" name="supplierName" value={supplierName} placeholder="Nombre del proveedor" required readOnly />
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
                <Input id="amount" name="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required max={selectedPurchase?.balance || undefined} readOnly={paymentMethod === 'Dolares'} />
              </div>

              {paymentMethod === 'Cheque' && checkDetails && (
                <CheckDetailsForm 
                  checkDetails={checkDetails}
                  onCheckDetailsChange={setCheckDetails}
                  idPrefix="manual-pay-chk"
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

              {payment && (
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select name="status" defaultValue={payment?.status} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pagado">Pagado</SelectItem>
                      <SelectItem value="Anulado">Anulado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">{payment ? 'Guardar Cambios' : 'Registrar Pago'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      );
    };

    export default PaymentFormDialog;