import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import CheckDetailsForm from '@/components/shared/CheckDetailsForm';
import { formatCurrency } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const PaymentMethodRow = ({ index, payment, paymentMethods, onPaymentChange, onRemove, canRemove, remainingAmount }) => {
    const [dollarFields, setDollarFields] = useState(payment.dollarDetails || { exchangeRate: 1, quantity: 0 });
    const [transferDetails, setTransferDetails] = useState(payment.transferDetails || { accountHolder: '', bank: '' });

    useEffect(() => {
        if(payment.method === 'Dolares'){
            setDollarFields(payment.dollarDetails || { exchangeRate: 1, quantity: 0 });
        }
        if(payment.method === 'Transferencia'){
            setTransferDetails(payment.transferDetails || { accountHolder: '', bank: '' });
        }
    }, [payment.method, payment.dollarDetails, payment.transferDetails]);

    const handleMethodChange = (value) => {
        let newCheckDetails = null;
        let newDollarDetails = null;
        let newTransferDetails = null;
        
        if (value === 'Cheque') {
            newCheckDetails = payment.checkDetails || { id: `s-chk-${Date.now()}`, checkNumber: '', dueDate: '', bank: '' };
        } else if (value === 'Dolares') {
            newDollarDetails = dollarFields;
        } else if (value === 'Transferencia') {
            newTransferDetails = transferDetails;
        }

        onPaymentChange(index, 'method', value);
        onPaymentChange(index, 'checkDetails', newCheckDetails);
        onPaymentChange(index, 'dollarDetails', newDollarDetails);
        onPaymentChange(index, 'transferDetails', newTransferDetails);
    };
    
    const handleAmountChange = (e) => {
        onPaymentChange(index, 'amount', e.target.value);
    };

    const handleCheckDetailsChange = (newDetails) => {
        onPaymentChange(index, 'checkDetails', newDetails);
    };

    const handleDollarFieldChange = (e) => {
        const { name, value } = e.target;
        const newDollarFields = { ...dollarFields, [name]: parseFloat(value) || 0 };
        setDollarFields(newDollarFields);
        const totalInPesos = newDollarFields.exchangeRate * newDollarFields.quantity;
        onPaymentChange(index, 'amount', totalInPesos);
        onPaymentChange(index, 'dollarDetails', newDollarFields);
    };

    const handleTransferDetailsChange = (e) => {
        const { name, value } = e.target;
        const newTransferDetails = { ...transferDetails, [name]: value };
        setTransferDetails(newTransferDetails);
        onPaymentChange(index, 'transferDetails', newTransferDetails);
    };

    const setMaxAmount = () => {
        const currentAmount = parseFloat(payment.amount) || 0;
        const amountToSet = remainingAmount + currentAmount;
        onPaymentChange(index, 'amount', amountToSet.toFixed(2));
    };

    return (
        <div className="p-3 border rounded-md space-y-3 relative bg-muted/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                <div className="flex flex-col">
                    <Label className="text-sm font-medium mb-1">Medio de Pago</Label>
                    <Select value={payment.method} onValueChange={handleMethodChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona método" />
                        </SelectTrigger>
                        <SelectContent>
                            {paymentMethods.map(method => (
                                <SelectItem key={method} value={method}>{method}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col">
                    <Label className="text-sm font-medium mb-1">Monto ($)</Label>
                     <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            step="0.01"
                            value={payment.amount}
                            onChange={handleAmountChange}
                            placeholder="0.00"
                            required
                            readOnly={payment.method === 'Dolares'}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={setMaxAmount} disabled={payment.method === 'Dolares'}>MAX</Button>
                    </div>
                </div>
            </div>

            {payment.method === 'Dolares' && (
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <Label htmlFor={`exchangeRate-${index}`}>Tipo Cambio</Label>
                        <Input id={`exchangeRate-${index}`} name="exchangeRate" type="number" step="0.01" value={dollarFields.exchangeRate} onChange={handleDollarFieldChange} />
                    </div>
                    <div>
                        <Label htmlFor={`quantity-${index}`}>Cant. USD</Label>
                        <Input id={`quantity-${index}`} name="quantity" type="number" step="0.01" value={dollarFields.quantity} onChange={handleDollarFieldChange} />
                    </div>
                    <div>
                        <Label>Total en Pesos</Label>
                        <Input value={formatCurrency(payment.amount)} readOnly className="font-semibold" />
                    </div>
                </div>
            )}

            {payment.method === 'Cheque' && payment.checkDetails && (
                <CheckDetailsForm
                    checkDetails={payment.checkDetails}
                    onCheckDetailsChange={handleCheckDetailsChange}
                    idPrefix={`s-chk-${index}`}
                />
            )}

            {payment.method === 'Transferencia' && payment.transferDetails && (
                <div className="space-y-2">
                    <div>
                        <Label htmlFor={`transfer-accountHolder-${index}`}>Titular de la Cuenta</Label>
                        <Input id={`transfer-accountHolder-${index}`} name="accountHolder" value={transferDetails.accountHolder} onChange={handleTransferDetailsChange} />
                    </div>
                    <div>
                        <Label htmlFor={`transfer-bank-${index}`}>Banco o Billetera Virtual</Label>
                        <Input id={`transfer-bank-${index}`} name="bank" value={transferDetails.bank} onChange={handleTransferDetailsChange} />
                    </div>
                </div>
            )}
            
            {canRemove && (
                <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => onRemove(index)}
                >
                    <Trash className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
};

export default PaymentMethodRow;