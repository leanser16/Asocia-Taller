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

const WorkOrderDetailDialog = ({ isOpen, onOpenChange, workOrder, statusColors }) => {
  const { data } = useData();
  const { user, organization } = useAuth();
  const { customers = [], vehicles = [] } = data;

  if (!workOrder) return null;

  // --- Robust Parsing Logic ---
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
      }
  } else {
      // Fallback for notes that might not have user-written text, just the data blob
      try {
          const possibleData = JSON.parse(workOrder.notes || '{}');
          if (possibleData && typeof possibleData === 'object') {
              if (possibleData.exit_date || possibleData.mileage || possibleData.service_items || possibleData.product_items) {
                  extraData = possibleData;
                  userNotes = ''; // It was all data
              }
          } else {
            userNotes = workOrder.notes || '';
          }
      } catch (e) {
          // It's not a JSON, so it's just user notes.
          userNotes = workOrder.notes || '';
      }
  }

  const serviceItems = extraData.service_items || [];
  const productItems = extraData.product_items || [];
  const allItems = [...serviceItems, ...productItems];

  const calculateTotal = () => {
    return allItems.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        const discount = Number(item.discount) || 0;
        const vat = Number(item.vat) || 0;
        const itemTotal = (price * quantity * (1 - discount / 100)) * (1 + vat / 100);
        return sum + itemTotal;
    }, 0);
  };

  const handlePrint = () => {
    const customer = customers.find(c => c.id === workOrder.customer_id);
    const vehicle = vehicles.find(v => v.id === workOrder.vehicle_id);
    generateWorkOrderPDF(workOrder, customer, vehicle, organization, user, extraData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg glassmorphism">
        <DialogHeader>
          <DialogTitle className="text-primary">Detalles de Orden de Trabajo</DialogTitle>
          <DialogDescription>Referencia: #{workOrder.order_number}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-1 pr-3">
          <div className="py-4 space-y-3">
            <p><strong className="text-muted-foreground">Cliente:</strong> {workOrder.customerName}</p>
            <p><strong className="text-muted-foreground">Vehículo:</strong> {workOrder.vehicleInfo}</p>
            <p><strong className="text-muted-foreground">Fecha Ingreso:</strong> {formatDate(workOrder.creation_date)}</p>
            {extraData.exit_date && <p><strong className="text-muted-foreground">Fecha Salida:</strong> {formatDate(extraData.exit_date)}</p>}
            {extraData.mileage && <p><strong className="text-muted-foreground">Kilometraje:</strong> {extraData.mileage} km</p>}
            <p><strong className="text-muted-foreground">Servicio/Descripción:</strong></p>
            <p className="pl-2 text-sm bg-muted/30 p-2 rounded-md">{workOrder.description}</p>
            
            {allItems.length > 0 && (
              <div>
                <strong className="text-muted-foreground">Servicios / Materiales:</strong>
                <ul className="list-disc pl-6 space-y-1 mt-1 text-sm">
                  {allItems.map((item, index) => (
                    <li key={index}>
                        {item.description} (x{item.quantity}) - {formatCurrency(item.price)} c/u
                        {item.discount > 0 && ` con ${item.discount}% dto.`}
                        = {formatCurrency((item.price * item.quantity) * (1 - (item.discount || 0) / 100))}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-right text-lg font-bold text-primary">Total (IVA Incl.): {formatCurrency(calculateTotal())}</p>

            <p><strong className="text-muted-foreground">Asignado a:</strong> {workOrder.assigned_to || 'Sin Asignar'}</p>
            <p><strong className="text-muted-foreground">Estado:</strong> <Badge className={`${statusColors[workOrder.status]} text-white`}>{workOrder.status}</Badge></p>
            
            {userNotes && (
              <div>
                <strong className="text-muted-foreground">Notas Adicionales:</strong>
                <p className="pl-2 text-sm bg-muted/30 p-2 rounded-md whitespace-pre-wrap">{userNotes}</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="justify-between">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir PDF
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkOrderDetailDialog;
