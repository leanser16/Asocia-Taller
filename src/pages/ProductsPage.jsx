import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import ProductForm from '@/components/forms/ProductForm';
import { useData } from '@/contexts/DataContext';
import { formatCurrency } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const ProductsPage = () => {
  const { data, addData, updateData, deleteData, loading, organization, updateOrganization } = useData();
  const { sale_products = [], purchase_products = [] } = data;
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [productType, setProductType] = useState('Venta');
  const [productToDelete, setProductToDelete] = useState(null);
  const { toast } = useToast();

  const [workPriceHour, setWorkPriceHour] = useState(0);

  useEffect(() => {
    if (organization?.work_price_hour !== undefined) {
      setWorkPriceHour(organization.work_price_hour);
    }
  }, [organization]);

  const handleWorkPriceHourChange = (e) => {
    const value = e.target.value;
    // Allow only numbers
    if (/^\d*\.?\d*$/.test(value)) {
      setWorkPriceHour(value);
    }
  };

  const handleWorkPriceHourBlur = async () => {
    const newPrice = parseFloat(workPriceHour) || 0;
    if (organization && newPrice !== organization.work_price_hour) {
      try {
        await updateOrganization({ work_price_hour: newPrice });
        toast({ title: "Precio por Hora Actualizado" });
      } catch (error) {
        toast({ title: "Error", description: `No se pudo actualizar el precio por hora: ${error.message}`, variant: "destructive" });
      }
    }
  };

  const handleSaveProduct = async (productData) => {
    const table = productType === 'Venta' ? 'sale_products' : 'purchase_products';
    let dataToSave;

    if (productType === 'Venta') {
      dataToSave = {
        name: productData.name,
        description: productData.description,
        category: productData.category,
        work_hours: parseFloat(productData.work_hours) || 0,
        price: parseFloat(productData.price) || 0,
      };
    } else { // Compra
      dataToSave = {
        name: productData.name,
        description: productData.description,
        category: productData.category,
        cost: parseFloat(productData.cost) || 0,
      };
    }

    try {
      if (currentProduct) {
        await updateData(table, currentProduct.id, dataToSave);
        toast({ title: "Producto Actualizado", description: `El producto ${productData.name} ha sido actualizado.` });
      } else {
        await addData(table, dataToSave);
        toast({ title: "Producto Creado", description: `El producto ${productData.name} ha sido creado.` });
      }
      setIsFormOpen(false);
      setCurrentProduct(null);
    } catch (error) {
      toast({ title: "Error", description: `Error al guardar el producto: ${error.message}`, variant: "destructive" });
    }
  };

  const openForm = (product = null, type) => {
    setCurrentProduct(product);
    setProductType(type);
    setIsFormOpen(true);
  };

  const confirmDelete = (id, type) => {
    setProductToDelete({ id, type });
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    const { id, type } = productToDelete;
    const table = type === 'Venta' ? 'sale_products' : 'purchase_products';
    try {
      await deleteData(table, id);
      toast({ title: "Producto Eliminado", description: "El producto ha sido eliminado.", variant: "destructive" });
    } catch (error) {
      toast({ title: "Error", description: `Error al eliminar el producto: ${error.message}`, variant: "destructive" });
    } finally {
      setProductToDelete(null);
    }
  };

  const renderTable = (products, type) => {
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const currentWorkPriceHour = organization?.work_price_hour || 0;

    return (
      <div className="rounded-lg border overflow-hidden glassmorphism">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              {type === 'Venta' && <TableHead>Horas</TableHead>}
              <TableHead>{type === 'Venta' ? 'Precio' : 'Costo'}</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                let price;
                if (type === 'Venta') {
                  price = product.price > 0 
                    ? product.price 
                    : (product.work_hours || 0) * currentWorkPriceHour;
                } else {
                  price = product.cost || 0;
                }
                
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    {type === 'Venta' && <TableCell>{product.work_hours || '-'}</TableCell>}
                    <TableCell>{formatCurrency(price)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openForm(product, type)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => confirmDelete(product.id, type)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={type === 'Venta' ? 5 : 4} className="text-center">
                  No se encontraron productos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Cargando productos...</div>;
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
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Productos y Servicios</h1>
        <Button onClick={() => openForm(null, productType)} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white w-full md:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" /> Nuevo
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:max-w-sm">
          <Label htmlFor="search-product">Buscar por nombre</Label>
          <Input
            id="search-product"
            placeholder="Filtrar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-auto">
          <Label htmlFor="work-price-hour">Precio Hora de Trabajo ($)</Label>
          <Input
            id="work-price-hour"
            type="text"
            value={workPriceHour}
            onChange={handleWorkPriceHourChange}
            onBlur={handleWorkPriceHourBlur}
            className="w-full md:w-40"
            placeholder="0"
          />
        </div>
      </div>

      <Tabs defaultValue="Venta" className="w-full" onValueChange={setProductType}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="Venta">Para la Venta</TabsTrigger>
          <TabsTrigger value="Compra">Para la Compra</TabsTrigger>
        </TabsList>
        <TabsContent value="Venta" className="mt-4">
          {renderTable(sale_products, 'Venta')}
        </TabsContent>
        <TabsContent value="Compra" className="mt-4">
          {renderTable(purchase_products, 'Compra')}
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setCurrentProduct(null); setIsFormOpen(isOpen); }}>
        <DialogContent className="sm:max-w-lg glassmorphism">
          <DialogHeader>
            <DialogTitle className="text-primary">{currentProduct ? 'Editar' : 'Nuevo'} {productType === 'Venta' ? 'Producto o Servicio' : 'Producto para Compra'}</DialogTitle>
            <DialogDescription>
              {currentProduct ? 'Modifica los datos del ítem.' : 'Ingresa los datos del nuevo ítem.'}
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            product={currentProduct}
            productType={productType}
            onSave={handleSaveProduct}
            onCancel={() => { setIsFormOpen(false); setCurrentProduct(null); }}
            workPriceHour={organization?.work_price_hour || 0}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el producto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default ProductsPage;
