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

          const calculateTotal = () => {
            return workOrder.parts?.reduce((sum, part) => sum + (part.quantity * part.price), 0) || 0;
          };

          const handlePrint = () => {
            const customer = customers.find(c => c.id === workOrder.customer_id);
            const vehicle = vehicles.find(v => v.id === workOrder.vehicle_id);
            generateWorkOrderPDF(workOrder, customer, vehicle, organization, user);
          };

          return (
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
              <DialogContent className="sm:max-w-lg glassmorphism">
                <DialogHeader>
                  <DialogTitle className="text-primary">Detalles de Orden de Trabajo</DialogTitle>
                  <DialogDescription>Referencia: #{workOrder.order_number}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] p-1 pr-3">
                  <div className="py-4 space-y-3">
                    <p><strong className="text-muted-foreground">Cliente:</strong> {workOrder.customerName}</p>
                    <p><strong className="text-muted-foreground">Vehículo:</strong> {workOrder.vehicleInfo}</p>
                    <p><strong className="text-muted-foreground">Fecha:</strong> {formatDate(workOrder.creation_date)}</p>
                    <p><strong className="text-muted-foreground">Servicio/Descripción:</strong></p>
                    <p className="pl-2 text-sm bg-muted/30 p-2 rounded-md">{workOrder.description}</p>
                    
                    {workOrder.parts && workOrder.parts.length > 0 && (
                      <div>
                        <strong className="text-muted-foreground">Servicios / Materiales:</strong>
                        <ul className="list-disc pl-6 space-y-1 mt-1 text-sm">
                          {workOrder.parts.map((part, index) => (
                            <li key={index}>{part.name} (x{part.quantity}) - {formatCurrency(part.price)} c/u = {formatCurrency(part.quantity * part.price)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="text-right text-lg font-bold text-primary">Total: {formatCurrency(calculateTotal())}</p>

                    <p><strong className="text-muted-foreground">Asignado a:</strong> {workOrder.assigned_to}</p>
                    <p><strong className="text-muted-foreground">Estado:</strong> <Badge className={`${statusColors[workOrder.status]} text-white`}>{workOrder.status}</Badge></p>
                    {workOrder.notes && (
                      <div>
                        <strong className="text-muted-foreground">Notas Adicionales:</strong>
                        <p className="pl-2 text-sm bg-muted/30 p-2 rounded-md">{workOrder.notes}</p>
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