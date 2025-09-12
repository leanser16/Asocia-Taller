import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import PaymentMethodRow from '@/components/purchases/PaymentMethodRow';
import { formatCurrency } from '@/lib/utils';

const PurchaseFormPayment = ({ formData, onFormDataChange, grandTotal, totalPaid, payments, paymentMethods, handlePaymentChange, addPaymentMethod, removePaymentMethod }) => {
  const remainingAmountToPay = grandTotal - totalPaid;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md text-primary">Información de Pago</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-xl font-bold text-primary">
            Total Compra: {formatCurrency(grandTotal)}
          </div>
          <div className="text-xl font-bold text-green-500">
            Total Pagado: {formatCurrency(totalPaid)}
          </div>
        </div>

        <div>
          <Label htmlFor="paymentType">Condición de Pago</Label>
          <Select name="paymentType" value={formData.paymentType} onValueChange={(value) => onFormDataChange('paymentType', value)} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona condición" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Contado">Contado</SelectItem>
              <SelectItem value="Cuenta Corriente">Cuenta Corriente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.paymentType === 'Contado' && (
          <div className="space-y-4">
            <Label>Métodos de Pago</Label>
            {payments.map((payment, index) => (
              <PaymentMethodRow
                key={index}
                index={index}
                payment={payment}
                paymentMethods={paymentMethods}
                onPaymentChange={handlePaymentChange}
                onRemove={removePaymentMethod}
                canRemove={payments.length > 1}
                remainingAmount={remainingAmountToPay}
              />
            ))}
            <Button type="button" variant="outline" onClick={addPaymentMethod} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Agregar Medio de Pago
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PurchaseFormPayment;