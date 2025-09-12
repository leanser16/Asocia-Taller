import React, { useState, useMemo } from 'react';
    import { motion } from 'framer-motion';
    import { BarChart2, Calendar, Sliders } from 'lucide-react';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
    import { formatCurrency } from '@/lib/utils';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { useData } from '@/contexts/DataContext';

    const pageVariants = {
      initial: { opacity: 0, y: 20 },
      in: { opacity: 1, y: 0 },
      out: { opacity: 0, y: -20 },
    };

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const ResultsPage = () => {
      const { data: appData, loading } = useData();
      const { sales = [], purchases = [], collections = [], payments = [], sale_products = [], purchase_products = [] } = appData;

      const [viewType, setViewType] = useState('paymentMethod');
      const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
      const [selectedQuarter, setSelectedQuarter] = useState('all');

      const allCollectionsAndPayments = useMemo(() => {
        const allCollections = [
          ...collections,
          ...sales.filter(s => s.payment_type === 'Contado').flatMap(s => 
              (s.payment_methods || []).map(pm => ({
                  isVirtual: true,
                  id: `${s.id}-${pm.method}`,
                  collection_date: s.sale_date,
                  amount: parseFloat(pm.amount) || 0,
                  method: pm.method,
                  sale_id: s.id
              }))
          )
        ];

        const allPayments = [
            ...payments,
            ...purchases.filter(p => p.payment_type === 'Contado').flatMap(p => 
                (p.payment_methods || []).map(pm => ({
                    isVirtual: true,
                    id: `${p.id}-${pm.method}`,
                    payment_date: p.purchase_date,
                    amount: parseFloat(pm.amount) || 0,
                    method: pm.method,
                    purchase_id: p.id,
                }))
            )
        ];
        
        return { allCollections, allPayments };
      }, [collections, sales, payments, purchases]);
      

      const availableYears = useMemo(() => {
        const { allCollections, allPayments } = allCollectionsAndPayments;
        const allDates = [...allCollections.map(c => c.collection_date), ...allPayments.map(p => p.payment_date)];
        if (allDates.length === 0) return [new Date().getFullYear()];
        const years = new Set(allDates.filter(Boolean).map(d => new Date(d + 'T00:00:00').getFullYear()));
        return Array.from(years).sort((a, b) => b - a);
      }, [allCollectionsAndPayments]);

      const filteredMonths = useMemo(() => {
        if (selectedQuarter === 'all') return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        const q = parseInt(selectedQuarter, 10);
        return Array.from({ length: 3 }, (_, i) => (q - 1) * 3 + i);
      }, [selectedQuarter]);
      
      const data = useMemo(() => {
        const { allCollections, allPayments } = allCollectionsAndPayments;
        const monthlyData = Array.from({ length: 12 }, () => ({
            salesByCategory: {},
            purchasesByCategory: {},
            salesByPayment: {},
            purchasesByPayment: {},
        }));
    
        allCollections.forEach(collection => {
            if (!collection.collection_date) return;
            const date = new Date(collection.collection_date + 'T00:00:00');
            const year = date.getFullYear();
            const month = date.getMonth();
    
            if (year === selectedYear) {
                const method = collection.method || 'No especificado';
                if (!monthlyData[month].salesByPayment[method]) {
                    monthlyData[month].salesByPayment[method] = 0;
                }
                monthlyData[month].salesByPayment[method] += (collection.amount || 0);
                
                const sale = sales.find(s => s.id === collection.sale_id);
                if (sale && sale.items) {
                    const totalSaleAmount = sale.items.reduce((sum, item) => sum + (item.total || 0), 0);
                    if (totalSaleAmount > 0) {
                        const proportion = (collection.amount || 0) / totalSaleAmount;
                        sale.items.forEach(item => {
                            const product = sale_products.find(p => p.id === item.productId);
                            const category = product?.category || 'Sin Categoría';
                            if (category && category !== 'Sin Categoría') {
                                if (!monthlyData[month].salesByCategory[category]) {
                                    monthlyData[month].salesByCategory[category] = 0;
                                }
                                monthlyData[month].salesByCategory[category] += (item.total || 0) * proportion;
                            }
                        });
                    }
                }
            }
        });
    
        allPayments.forEach(payment => {
            if (!payment.payment_date) return;
            const date = new Date(payment.payment_date + 'T00:00:00');
            const year = date.getFullYear();
            const month = date.getMonth();
    
            if (year === selectedYear) {
                const method = payment.method || 'No especificado';
                if (!monthlyData[month].purchasesByPayment[method]) {
                    monthlyData[month].purchasesByPayment[method] = 0;
                }
                monthlyData[month].purchasesByPayment[method] += (payment.amount || 0);
    
                const purchase = purchases.find(p => p.id === payment.purchase_id);
                if (purchase && purchase.items) {
                    const totalPurchaseAmount = purchase.items.reduce((sum, item) => sum + (item.total || 0), 0);
                    if (totalPurchaseAmount > 0) {
                        const proportion = (payment.amount || 0) / totalPurchaseAmount;
                        purchase.items.forEach(item => {
                            const product = purchase_products.find(p => p.id === item.productId);
                            const category = product?.category || 'Sin Categoría';
                            if (category && category !== 'Sin Categoría') {
                                if (!monthlyData[month].purchasesByCategory[category]) {
                                    monthlyData[month].purchasesByCategory[category] = 0;
                                }
                                monthlyData[month].purchasesByCategory[category] += (item.total || 0) * proportion;
                            }
                        });
                    }
                }
            }
        });
    
        return monthlyData;
    }, [allCollectionsAndPayments, sales, purchases, selectedYear, sale_products, purchase_products]);


      const saleCategories = useMemo(() => {
        const cats = new Set();
        data.forEach(month => Object.keys(month.salesByCategory).forEach(cat => cats.add(cat)));
        return Array.from(cats).sort();
      }, [data]);
      
      const purchaseCategories = useMemo(() => {
        const cats = new Set();
        data.forEach(month => Object.keys(month.purchasesByCategory).forEach(cat => cats.add(cat)));
        return Array.from(cats).sort();
      }, [data]);

      const salePaymentMethods = useMemo(() => {
        const methods = new Set();
        data.forEach(month => Object.keys(month.salesByPayment).forEach(method => methods.add(method)));
        return Array.from(methods).sort();
      }, [data]);

      const purchasePaymentMethods = useMemo(() => {
        const methods = new Set();
        data.forEach(month => Object.keys(month.purchasesByPayment).forEach(method => methods.add(method)));
        return Array.from(methods).sort();
      }, [data]);


      const totals = useMemo(() => {
        const monthlyTotals = data.map((monthData) => {
          const totalSalesCat = Object.values(monthData.salesByCategory).reduce((a, b) => a + b, 0);
          const totalPurchasesCat = Object.values(monthData.purchasesByCategory).reduce((a, b) => a + b, 0);
          const totalSalesPay = Object.values(monthData.salesByPayment).reduce((a, b) => a + b, 0);
          const totalPurchasesPay = Object.values(monthData.purchasesByPayment).reduce((a, b) => a + b, 0);
          return { totalSalesCat, totalPurchasesCat, totalSalesPay, totalPurchasesPay };
        });
        
        const getAnnualTotal = (key) => monthlyTotals.reduce((acc, curr, index) => filteredMonths.includes(index) ? acc + curr[key] : acc, 0);

        return { 
          monthlyTotals, 
          annualSalesCat: getAnnualTotal('totalSalesCat'),
          annualPurchasesCat: getAnnualTotal('totalPurchasesCat'),
          annualSalesPay: getAnnualTotal('totalSalesPay'),
          annualPurchasesPay: getAnnualTotal('totalPurchasesPay'),
        };
      }, [data, filteredMonths]);
      
      const renderTable = (type) => {
        const isCategoryView = type === 'category';
        const incomeHeader = isCategoryView ? 'Categoría' : 'Medio de Pago';
        
        const incomeRows = (isCategoryView ? saleCategories : salePaymentMethods).map(name => {
            const monthlyValues = filteredMonths.map(monthIndex => data[monthIndex][isCategoryView ? 'salesByCategory' : 'salesByPayment'][name] || 0);
            return { name, monthlyValues, total: monthlyValues.reduce((a, b) => a + b, 0) };
        });
        
        const expenseRows = (isCategoryView ? purchaseCategories : purchasePaymentMethods).map(name => {
            const monthlyValues = filteredMonths.map(monthIndex => data[monthIndex][isCategoryView ? 'purchasesByCategory' : 'purchasesByPayment'][name] || 0);
            return { name, monthlyValues, total: monthlyValues.reduce((a, b) => a + b, 0) };
        });

        const totalSalesKey = isCategoryView ? 'totalSalesCat' : 'totalSalesPay';
        const totalPurchasesKey = isCategoryView ? 'totalPurchasesCat' : 'totalPurchasesPay';
        const annualSales = isCategoryView ? totals.annualSalesCat : totals.annualSalesPay;
        const annualPurchases = isCategoryView ? totals.annualPurchasesCat : totals.annualPurchasesPay;

        const renderSection = (title, rows, total, monthlyTotalsKey, color) => (
            <>
                <TableRow className={`bg-${color}-100 dark:bg-${color}-900/30`}>
                    <TableCell className={`font-bold text-${color}-800 dark:text-${color}-300 sticky left-0 bg-${color}-100 dark:bg-${color}-900/30 z-10`}>{title}</TableCell>
                    <TableCell colSpan={filteredMonths.length + 1}></TableCell>
                </TableRow>
                {rows.length > 0 ? rows.map(item => (
                    <TableRow key={`${title}-${item.name}`}>
                        <TableCell className="pl-8 sticky left-0 bg-background z-10">{item.name}</TableCell>
                        {item.monthlyValues.map((value, i) => <TableCell key={i} className="text-right">{formatCurrency(value)}</TableCell>)}
                        <TableCell className="text-right font-bold">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={filteredMonths.length + 2} className="text-center text-muted-foreground py-4">No hay datos de {title.toLowerCase()} para mostrar.</TableCell>
                    </TableRow>
                )}
                <TableRow className={`bg-${color}-200 dark:bg-${color}-800/40 font-bold`}>
                    <TableCell className={`text-${color}-900 dark:text-${color}-200 sticky left-0 bg-${color}-200 dark:bg-${color}-800/40 z-10`}>SubTotal {title}</TableCell>
                    {filteredMonths.map(monthIndex => (
                        <TableCell key={monthIndex} className="text-right">{formatCurrency(totals.monthlyTotals[monthIndex][monthlyTotalsKey])}</TableCell>
                    ))}
                    <TableCell className={`text-right text-${color}-900 dark:text-${color}-200`}>{formatCurrency(total)}</TableCell>
                </TableRow>
            </>
        );

        return (
            <Table className="w-full border-collapse">
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="w-1/6 font-bold text-primary sticky left-0 bg-muted/50 z-10">{incomeHeader}</TableHead>
                        {filteredMonths.map(monthIndex => <TableHead key={monthIndex} className="text-right">{monthNames[monthIndex]}</TableHead>)}
                        <TableHead className="text-right font-bold text-primary">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {renderSection('INGRESOS', incomeRows, annualSales, totalSalesKey, 'green')}
                    {renderSection('COMPRAS Y GASTOS', expenseRows, annualPurchases, totalPurchasesKey, 'red')}
                    <TableRow className="bg-blue-200 dark:bg-blue-800/40 font-bold">
                        <TableCell className="text-blue-900 dark:text-blue-200 sticky left-0 bg-blue-200 dark:bg-blue-800/40 z-10">Resultado Bruto</TableCell>
                        {filteredMonths.map(monthIndex => (
                            <TableCell key={monthIndex} className="text-right">{formatCurrency(totals.monthlyTotals[monthIndex][totalSalesKey] - totals.monthlyTotals[monthIndex][totalPurchasesKey])}</TableCell>
                        ))}
                        <TableCell className="text-right text-blue-900 dark:text-blue-200">{formatCurrency(annualSales - annualPurchases)}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        );
      };
      
      if (loading) {
        return <div className="flex items-center justify-center h-full">Cargando resultados...</div>;
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
            <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2"><BarChart2 className="h-8 w-8"/>Resultados</h1>
            <div className="flex items-center space-x-2">
              <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                <SelectTrigger className="w-[120px] bg-card">
                  <Calendar className="mr-2 h-4 w-4 opacity-50" />
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                <SelectTrigger className="w-[150px] bg-card">
                  <Sliders className="mr-2 h-4 w-4 opacity-50" />
                  <SelectValue placeholder="Trimestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo el Año</SelectItem>
                  <SelectItem value="1">1er Trimestre</SelectItem>
                  <SelectItem value="2">2do Trimestre</SelectItem>
                  <SelectItem value="3">3er Trimestre</SelectItem>
                  <SelectItem value="4">4to Trimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={viewType} onValueChange={setViewType} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="paymentMethod">Vista por Medio de Pago</TabsTrigger>
              <TabsTrigger value="category">Vista por Categoría</TabsTrigger>
            </TabsList>
            <TabsContent value="category">
              <Card className="shadow-lg mt-4 glassmorphism">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-primary">Resultados por Categoría de Producto</CardTitle>
                  <CardDescription>Análisis de ingresos y egresos agrupados por categoría.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {renderTable('category')}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="paymentMethod">
              <Card className="shadow-lg mt-4 glassmorphism">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-primary">Resultados por Medio de Pago</CardTitle>
                  <CardDescription>Análisis de ingresos y egresos agrupados por medio de pago/cobro.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                   {renderTable('paymentMethod')}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      );
    };

    export default ResultsPage;