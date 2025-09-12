import React from 'react';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
    import { Button } from '@/components/ui/button';
    import { Edit, Trash2 } from 'lucide-react';
    import { formatDate, formatCurrency } from '@/lib/utils';

    const PaymentsHistoryTable = ({ payments, onEdit, onDelete }) => {
      return (
        <>
          {payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Ref. Compra</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    <TableCell>{payment.purchaseFormattedNumber}</TableCell>
                    <TableCell>{payment.supplierName}</TableCell>
                    <TableCell>{formatCurrency(payment.amount || 0)}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onEdit(payment)} 
                        className="text-blue-500 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" 
                        title="Editar"
                        disabled={payment.isVirtual}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onDelete(payment)} 
                        className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed" 
                        title="Eliminar"
                        disabled={payment.isVirtual}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No se encontraron pagos para los filtros aplicados.</p>
          )}
        </>
      );
    };

    export default PaymentsHistoryTable;