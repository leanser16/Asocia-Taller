import React from 'react';
    import { Edit, Trash2, Printer } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
    import { Card, CardContent } from '@/components/ui/card';
    import { Badge } from "@/components/ui/badge";
    import { formatDate, formatCurrency, formatPurchaseNumber } from '@/lib/utils';
    import { motion } from 'framer-motion';

    const PurchasesTable = ({ purchases, statusConfig, onEdit, onDelete, onPrint, onSort, sortConfig }) => {
      const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? '▲' : '▼';
      };

      const renderHeader = (key, title) => (
        <TableHead onClick={() => onSort(key)} className="cursor-pointer hover:bg-muted/50">
          {title} {getSortIndicator(key)}
        </TableHead>
      );
      
      return (
        <Card className="shadow-lg glassmorphism">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {renderHeader('purchase_date', 'Fecha')}
                  <TableHead>Tipo y N°</TableHead>
                  {renderHeader('supplierName', 'Proveedor')}
                  {renderHeader('total', 'Total')}
                  <TableHead>Saldo</TableHead>
                  {renderHeader('payment_type', 'Cond. Pago')}
                  {renderHeader('status', 'Estado')}
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase, index) => {
                  const statusInfo = statusConfig[purchase.status] || { color: 'bg-gray-500' };
                  
                  return (
                  <motion.tr 
                    key={purchase.id} 
                    className="hover:bg-muted/50 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <TableCell>{formatDate(purchase.purchase_date)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{purchase.document_type}</div>
                      <div className="text-xs text-muted-foreground font-mono">{formatPurchaseNumber(purchase)}</div>
                    </TableCell>
                    <TableCell>{purchase.supplierName}</TableCell>
                    <TableCell>{formatCurrency(purchase.total)}</TableCell>
                    <TableCell>{formatCurrency(purchase.balance)}</TableCell>
                    <TableCell>{purchase.payment_type}</TableCell>
                    <TableCell>
                      <Badge className={`${statusInfo.color} text-white`}>
                        {purchase.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => onPrint && onPrint(purchase)} className="text-gray-500 hover:text-gray-700" title="Imprimir PDF">
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onEdit(purchase)} className="text-blue-500 hover:text-blue-700" title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(purchase.id)} className="text-red-500 hover:text-red-700" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                )})}
              </TableBody>
            </Table>
            {purchases.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">No se encontraron compras.</p>
            )}
          </CardContent>
        </Card>
      );
    };

    export default PurchasesTable;