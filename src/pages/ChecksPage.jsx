import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useData } from '@/contexts/DataContext';
import { formatCurrency, formatDate, getDaysUntilDue } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const statusColors = {
  en_cartera: 'bg-blue-500',
  depositado: 'bg-yellow-500',
  cobrado: 'bg-green-500',
  devuelto: 'bg-red-500',
};

const ChecksPage = () => {
  const { data, updateData, loading } = useData();
  const { checks = [] } = data;
  const { toast } = useToast();

  const receivedChecks = useMemo(() => checks.filter(c => c.type === 'recibido'), [checks]);
  const issuedChecks = useMemo(() => checks.filter(c => c.type === 'emitido'), [checks]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateData('checks', id, { status: newStatus });
      toast({ title: "Estado Actualizado", description: "El estado del cheque ha sido actualizado." });
    } catch (error) {
      toast({ title: "Error", description: `Error al actualizar el estado: ${error.message}`, variant: "destructive" });
    }
  };

  const renderChecksTable = (checksToRender, type) => {
    const availableStatuses = type === 'recibido'
      ? ['en_cartera', 'depositado', 'cobrado', 'devuelto']
      : ['en_cartera', 'cobrado', 'devuelto'];

    return (
      <div className="rounded-lg border overflow-hidden glassmorphism">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Cheque</TableHead>
              <TableHead>Banco</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Días Restantes</TableHead>
              <TableHead>Titular</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checksToRender.length > 0 ? (
              checksToRender.map((check) => {
                const daysUntilDue = getDaysUntilDue(check.due_date);
                let daysColor = 'text-gray-500';
                if (daysUntilDue !== null) {
                  if (daysUntilDue <= 0) daysColor = 'text-red-500 font-bold';
                  else if (daysUntilDue <= 7) daysColor = 'text-yellow-500';
                }
                const canChangeStatus = daysUntilDue !== null && daysUntilDue <= 0;
                
                return (
                  <TableRow key={check.id}>
                    <TableCell className="font-medium">{check.check_number}</TableCell>
                    <TableCell>{check.bank}</TableCell>
                    <TableCell>{formatCurrency(check.amount)}</TableCell>
                    <TableCell>{formatDate(check.due_date)}</TableCell>
                    <TableCell className={daysColor}>{daysUntilDue !== null ? `${daysUntilDue} días` : 'N/A'}</TableCell>
                    <TableCell>{check.holder}</TableCell>
                    <TableCell>
                      <Select 
                        value={check.status} 
                        onValueChange={(newStatus) => handleStatusChange(check.id, newStatus)}
                        disabled={!canChangeStatus && check.status === 'en_cartera'}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue>
                            <Badge className={`${statusColors[check.status]} hover:${statusColors[check.status]}`}>
                              {check.status.replace('_', ' ')}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {availableStatuses.map(status => (
                            <SelectItem 
                              key={status} 
                              value={status}
                              disabled={status !== 'en_cartera' && !canChangeStatus}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan="7" className="text-center py-8">
                  No se encontraron cheques.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Cargando cheques...</div>;
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold tracking-tight text-primary">Cartera de Cheques</h1>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received">Cheques Recibidos</TabsTrigger>
          <TabsTrigger value="issued">Cheques Emitidos</TabsTrigger>
        </TabsList>
        <TabsContent value="received" className="mt-4">
          {renderChecksTable(receivedChecks, 'recibido')}
        </TabsContent>
        <TabsContent value="issued" className="mt-4">
          {renderChecksTable(issuedChecks, 'emitido')}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default ChecksPage;