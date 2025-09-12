import React from 'react';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
    import { Card, CardContent } from '@/components/ui/card';
    import { Badge } from '@/components/ui/badge';
    import { Button } from '@/components/ui/button';
    import { Edit, Trash2, FileText, Printer, CheckCircle, XCircle, Clock } from 'lucide-react';
    import { formatDate, formatCurrency, formatSaleNumber } from '@/lib/utils';

    const iconMap = {
        Clock,
        CheckCircle,
        XCircle,
        FileText,
    };

    const SalesTable = ({ sales, statusConfig, onApprove, onReject, onConvertToInvoice, onEdit, onDelete, onPrint }) => {
      return (
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo y N°</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => {
                  let status = sale.status;
                  if (sale.type === 'Factura' || sale.type === 'Recibo') {
                    status = parseFloat(sale.balance) === 0 ? 'Pagado' : 'Pendiente de Pago';
                  }
                  
                  const currentStatusConfig = statusConfig[status] || { color: 'bg-gray-500', icon: 'Clock' };
                  const IconComponent = iconMap[currentStatusConfig.icon] || Clock;

                  return (
                  <TableRow key={sale.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>{formatDate(sale.sale_date)}</TableCell>
                    <TableCell>{sale.customerName}</TableCell>
                    <TableCell>
                      <div className="font-medium">{sale.type}</div>
                      <div className="text-xs text-muted-foreground">{formatSaleNumber(sale)}</div>
                    </TableCell>
                    <TableCell>{formatCurrency(sale.total)}</TableCell>
                    <TableCell>{formatCurrency(sale.balance)}</TableCell>
                    <TableCell>
                      <Badge className={`${currentStatusConfig.color} text-white`}>
                        <IconComponent className="mr-1 h-3 w-3" />
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {sale.type === 'Presupuesto' && sale.status === 'Pendiente' && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => onApprove(sale.id)} className="text-green-500 hover:text-green-700" title="Aprobar Presupuesto">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                           <Button variant="ghost" size="icon" onClick={() => onReject(sale.id)} className="text-red-600 hover:text-red-700" title="Rechazar Presupuesto">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {sale.type === 'Presupuesto' && sale.status === 'Aprobado' && (
                         <Button variant="ghost" size="icon" onClick={() => onConvertToInvoice(sale)} className="text-cyan-500 hover:text-cyan-700" title="Convertir a Factura">
                           <FileText className="h-4 w-4" />
                         </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => onEdit(sale)} className="text-blue-500 hover:text-blue-700" title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(sale.id)} className="text-red-500 hover:text-red-700" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onPrint(sale)} className="text-gray-500 hover:text-gray-700" title="Imprimir PDF">
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
            {sales.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">No se encontraron documentos de venta.</p>
            )}
          </CardContent>
        </Card>
      );
    };

    export default SalesTable;