import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ListFilter, Filter } from 'lucide-react';

const SalesHeader = ({ searchTerm, setSearchTerm, filterType, setFilterType, filterStatus, setFilterStatus, statusConfig }) => {
  return (
    <Card className="shadow-lg glassmorphism">
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-lg font-semibold text-primary">Listado de Documentos de Venta</CardTitle>
        <CardDescription>Administra presupuestos, recibos y facturas.</CardDescription>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="relative flex-grow md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por cliente, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-auto">
              <ListFilter className="mr-2 h-4 w-4 opacity-50" />
              <SelectValue placeholder="Filtrar por Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos los Tipos</SelectItem>
              <SelectItem value="Presupuesto">Presupuesto</SelectItem>
              <SelectItem value="Recibo">Recibo</SelectItem>
              <SelectItem value="Factura">Factura</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-auto">
              <Filter className="mr-2 h-4 w-4 opacity-50" />
              <SelectValue placeholder="Filtrar por Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos los Estados</SelectItem>
              {Object.keys(statusConfig).map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
    </Card>
  );
};

export default SalesHeader;