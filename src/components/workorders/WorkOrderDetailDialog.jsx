import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Printer } from 'lucide-react';
import { generateWorkOrderPDF } from '@/lib/pdfGenerator';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const parseNumber = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(',', '.'));
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

const ItemDetailCard = ({ item, type }) => {
    const price = parseNumber(item.price);
    const quantity = parseNumber(item.quantity);
    const vat = parseNumber(item.vat);
    const discount = parseNumber(item.discount);
    const calculatedTotal = (price * (1 - discount / 100)) * quantity * (1 + vat / 100);

    return (
        <div className="p-3 border rounded-md bg-muted/30 text-sm">
            <p className="font-semibold text-primary/90">{item.description || (type === 'service' ? 'Servicio sin descripción' : 'Producto sin descripción')}</p>
            {item.details && <p className="text-xs text-muted-foreground italic pl-2">{item.details}</p>}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mt-2 text-xs">
                <p><strong className="text-muted-foreground/80">Cant:</strong> {quantity}</p>
                <p><strong className="text-muted-foreground/80">P. Unit:</strong> {formatCurrency(price)}</p>
                <p><strong className="text-muted-foreground/80">IVA:</strong> {vat}%</p>
                <p><strong className="text-muted-foreground/80">Dto:</strong> {discount}%</p>
            </div>
            <p className="text-right font-bold mt-2 text-primary/90">
                Total Item: {formatCurrency(calculatedTotal)}
            </p>
        </div>
    );
};

const WorkOrderDetailDialog = ({ isOpen, onOpenChange, workOrder, statusColors }) => {
  const { data } = useData();
  const { user, organization } = useAuth();
  const { customers = [], vehicles = [] } = data;

  if (!workOrder) return null;

  const separator = '---DATA---';
  const separatorIndex = (workOrder.notes || '').indexOf(separator);
  let userNotes = '';
  let extraData = {};

  if (separatorIndex !== -1) {
      userNotes = (workOrder.notes.substring(0, separatorIndex)).trim();
      const dataString = workOrder.notes.substring(separatorIndex + separator.length);
      try {
          extraData = JSON.parse(dataString);
      } catch (e) {
          console.error("Error parsing extra data from notes:", e);
          userNotes = workOrder.notes || '';
      }
  } else {
      userNotes = workOrder.notes || '';
  }

  const serviceItems = extraData.service_items || [];
  const productItems = extraData.product_items || [];

  const totalGeneral = [...serviceItems, ...productItems].reduce((sum, item) => {
    const price = parseNumber(item.price);
    const quantity = parseNumber(item.quantity);
    const vat = parseNumber(item.vat);
    const discount = parseNumber(item.discount);
    const itemTotal = (price * (1 - discount / 100)) * quantity * (1 + vat / 100);
    return sum + itemTotal;
  }, 0);

  const handlePrint = () => {
    const customer = customers.find(c => c.id === workOrder.customer_id);
    const vehicle = vehicles.find(v => v.id === workOrder.vehicle_id);
    generateWorkOrderPDF(workOrder, customer, vehicle, organization, user, extraData, totalGeneral);
  };

  const dialogTitleId = `work-order-detail-title-${workOrder.id}`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl glassmorphism" aria-labelledby={dialogTitleId}>
        <DialogHeader>
          <DialogTitle id={dialogTitleId} className="text-primary">Detalles de Orden de Trabajo</DialogTitle>
          <DialogDescription>Referencia: #{workOrder.order_number}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh] p-1 pr-4">
          <div className="py-4 space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 p-3 rounded-lg bg-card/50">
              <p><strong className="text-muted-foreground">Cliente:</strong> {workOrder.customerName}</p>
              <p><strong className="text-muted-foreground">Vehículo:</strong> {workOrder.vehicleInfo}</p>
              <p><strong className="text-muted-foreground">Fecha Ingreso:</strong> {formatDate(workOrder.creation_date)}</p>
              {extraData.exit_date && <p><strong className="text-muted-foreground">Fecha Salida:</strong> {formatDate(extraData.exit_date)}</p>}
              {extraData.mileage && <p><strong className="text-muted-foreground">Kilometraje:</strong> {extraData.mileage} km</p>}
            </div>

            {serviceItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-muted-foreground mt-3">Items de Servicio</h4>
                <div className="space-y-2">
                    {serviceItems.map((item, index) => <ItemDetailCard key={`service-${index}`} item={item} type="service" />)}
                </div>
              </div>
            )}

            {productItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-muted-foreground mt-3">Items de Producto</h4>
                <div className="space-y-2">
                    {productItems.map((item, index) => <ItemDetailCard key={`product-${index}`} item={item} type="product" />)}
                </div>
              </div>
            )}

            {totalGeneral > 0 && 
              <div className="text-right text-xl font-bold text-primary pr-2 pt-3">
                Total General: {formatCurrency(totalGeneral)}
              </div>
            }
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 p-3 rounded-lg bg-card/50 mt-4">
              <p><strong className="text-muted-foreground">Asignado a:</strong> {workOrder.assigned_to || 'Sin Asignar'}</p>
              <p><strong className="text-muted-foreground">Estado:</strong> <Badge className={`${statusColors[workOrder.status]} text-white`}>{workOrder.status}</Badge></p>
            </div>

            {userNotes && (
              <div>
                <strong className="text-muted-foreground">Notas Adicionales:</strong>
                <p className="mt-1 text-sm bg-muted/30 p-2 rounded-md whitespace-pre-wrap">{userNotes}</p>
              </div>
            )}

          </div>
        </ScrollArea>
        <DialogFooter className="sm:justify-between justify-center pt-4">
          <Button variant="outline" onClick={handlePrint} className="w-full sm:w-auto">
            <Printer className="mr-2 h-4 w-4" /> Imprimir / PDF
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkOrderDetailDialog;
