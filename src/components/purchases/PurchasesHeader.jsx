import React from 'react';
import { Search, Filter, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const PurchasesHeader = ({ searchTerm, setSearchTerm, filterStatus, setFilterStatus, statusConfig, onNewPurchase }) => {
  return (
    <Card className="shadow-lg glassmorphism">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg font-semibold text-primary">Listado de Compras</CardTitle>
                <CardDescription>Administra todas las órdenes de compra del taller.</CardDescription>
            </div>
            <Button onClick={onNewPurchase} variant="default">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nueva Compra
            </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por proveedor, ID o N° comprobante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full">
              <Filter className="mr-2 h-4 w-4 opacity-50" />
              <SelectValue placeholder="Filtrar por Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos los Estados</SelectItem>
              {Object.keys(statusConfig || {}).map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default PurchasesHeader;