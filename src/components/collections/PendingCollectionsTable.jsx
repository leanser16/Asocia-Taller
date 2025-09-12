import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';
import { cn, formatDate, formatCurrency, formatSaleNumber } from '@/lib/utils';

const PendingCollectionsTable = ({ sales, onCollect }) => {
  const getRowClass = (days) => {
    if (days === null) return '';
    if (days < 0) return 'bg-red-500/20 hover:bg-red-500/30 text-red-800 dark:text-red-200';
    if (days <= 10) return 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-800 dark:text-yellow-200';
    return 'hover:bg-muted/50';
  };

  return (
    <>
      {sales.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente / Tipo y N°</TableHead>
              <TableHead>Importe</TableHead>
              <TableHead>Saldo Pendiente</TableHead>
              <TableHead>Fecha Vto.</TableHead>
              <TableHead>Días Faltantes</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id} className={cn("transition-colors", getRowClass(sale.daysUntilDue))}>
                <TableCell>
                  <div className="font-medium">{sale.customerName}</div>
                  <div className="text-xs text-muted-foreground">{sale.type} {formatSaleNumber(sale)}</div>
                </TableCell>
                <TableCell>{formatCurrency(sale.total)}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(sale.balance)}</TableCell>
                <TableCell>{formatDate(sale.due_date)}</TableCell>
                <TableCell>
                  {sale.daysUntilDue !== null ? (
                    <Badge variant={sale.daysUntilDue < 0 ? 'destructive' : 'outline'} className="font-bold">
                      {sale.daysUntilDue}
                    </Badge>
                  ) : 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  <Button onClick={() => onCollect(sale)} size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                    <CreditCard className="mr-2 h-4 w-4" /> Cobrar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center py-8 text-muted-foreground">
          No hay cuentas pendientes de cobro para los filtros aplicados.
        </p>
      )}
    </>
  );
};

export default PendingCollectionsTable;