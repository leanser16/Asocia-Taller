import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import PurchaseItemRow from '@/components/purchases/PurchaseItemRow';

const PurchaseFormItems = ({ purchaseItems, handleItemChange, removeItem, addItem, purchaseProducts, onQuickAddProduct }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md text-primary">Items de la Compra</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {purchaseItems.map((item, index) => (
          <PurchaseItemRow
            key={item.id}
            item={item}
            index={index}
            handleItemChange={handleItemChange}
            removeItem={removeItem}
            canRemove={purchaseItems.length > 1}
            purchaseProducts={purchaseProducts}
            onQuickAddProduct={onQuickAddProduct}
            isCreditNote={false}
            ivaAmount={item.ivaAmount} // Pass ivaAmount here
          />
        ))}
        <Button type="button" variant="outline" onClick={addItem} className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" /> Agregar Item
        </Button>
      </CardContent>
    </Card>
  );
};

export default PurchaseFormItems;