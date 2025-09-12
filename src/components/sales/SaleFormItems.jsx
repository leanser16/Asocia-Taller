import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import SaleItemRow from '@/components/sales/SaleItemRow';

const SaleFormItems = ({ saleItems, handleItemChange, removeItem, addItem, vehicles, onQuickAddVehicle, customerId, documentType, saleProducts, onQuickAddProduct }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md text-primary">Items del Documento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {saleItems.map((item, index) => (
          <SaleItemRow
            key={index}
            item={item}
            index={index}
            handleItemChange={handleItemChange}
            removeItem={removeItem}
            canRemove={saleItems.length > 1}
            vehicles={vehicles}
            onQuickAddVehicle={onQuickAddVehicle}
            customerId={customerId}
            documentType={documentType}
            saleProducts={saleProducts}
            onQuickAddProduct={onQuickAddProduct}
          />
        ))}
        <Button type="button" variant="outline" onClick={addItem} className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" /> Agregar Item
        </Button>
      </CardContent>
    </Card>
  );
};

export default SaleFormItems;