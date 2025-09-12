import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';
import { cn, formatDate, formatCurrency, formatPurchaseNumber } from '@/lib/utils';

const PendingPaymentsTable = ({ purchases, onPay }) => {
  const getRowClass = (days) => {
    if (days === null) return '';
    if (days < 0) return 'bg-red-500/20 hover:bg-red-500/30 text-red-800 dark:text-red-200';
    if (days <= 10) return 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-800 dark:text-yellow-200';
    return 'hover:bg-muted/50';
  };

  return (
    <>
      {purchases.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor / Tipo y N°</TableHead>
              <TableHead>Importe</TableHead>
              <TableHead>Saldo Pendiente</TableHead>
              <TableHead>Fecha Vto.</TableHead>
              <TableHead>Días Faltantes</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase) => (
              <TableRow key={purchase.id} className={cn("transition-colors", getRowClass(purchase.daysUntilDue))}>
                <TableCell>
                  <div className="font-medium">{purchase.supplierName}</div>
                  <div className="text-xs text-muted-foreground">{purchase.document_type} {formatPurchaseNumber(purchase)}</div>
                </TableCell>
                <TableCell>{formatCurrency(purchase.total)}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(purchase.balance)}</TableCell>
                <TableCell>{formatDate(purchase.due_date)}</TableCell>
                <TableCell>
                  {purchase.daysUntilDue !== null ? (
                    <Badge variant={purchase.daysUntilDue < 0 ? 'destructive' : 'outline'} className="font-bold">
                      {purchase.daysUntilDue}
                    </Badge>
                  ) : 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  <Button onClick={() => onPay(purchase)} size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                    <CreditCard className="mr-2 h-4 w-4" /> Pagar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center py-8 text-muted-foreground">
          No hay compras pendientes de pago para los filtros aplicados.
        </p>
      )}
    </>
  );
};

export default PendingPaymentsTable;