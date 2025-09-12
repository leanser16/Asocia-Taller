import React from 'react';
    import { motion } from 'framer-motion';
    import { BarChart2, Download, Calendar, Filter as FilterIcon } from 'lucide-react';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
    import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

    const pageVariants = {
      initial: { opacity: 0, y: 20 },
      in: { opacity: 1, y: 0 },
      out: { opacity: 0, y: -20 },
    };
    
    const cardVariants = {
      hover: { scale: 1.02, boxShadow: "0px 8px 16px rgba(0,0,0,0.1)" },
      tap: { scale: 0.99 }
    };

    const monthlySalesData = [
      { month: 'Ene', sales: 12000, expenses: 7000 }, { month: 'Feb', sales: 15000, expenses: 8000 },
      { month: 'Mar', sales: 13000, expenses: 7500 }, { month: 'Abr', sales: 17000, expenses: 9000 },
      { month: 'May', sales: 18000, expenses: 9500 }, { month: 'Jun', sales: 16000, expenses: 8500 },
    ];

    const servicePopularityData = [
      { name: 'Cambio Aceite', value: 400 }, { name: 'Frenos', value: 300 },
      { name: 'Diagnóstico', value: 200 }, { name: 'Alineación', value: 150 },
      { name: 'Otros', value: 100 },
    ];
    const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

    const customerSatisfactionData = [
      { name: 'Muy Satisfecho', value: 65 }, { name: 'Satisfecho', value: 25 },
      { name: 'Neutral', value: 5 }, { name: 'Insatisfecho', value: 5 },
    ];
    const SATISFACTION_COLORS = ['#22c55e', '#84cc16', '#facc15', '#ef4444'];


    const ReportsPage = () => {
      const [timeRange, setTimeRange] = React.useState('last6months');
      const [reportType, setReportType] = React.useState('sales_overview');

      const handleDownloadReport = () => {
        alert(`Descargando informe: ${reportType} para ${timeRange}`);
      };

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
            <h1 className="text-3xl font-bold tracking-tight text-primary">Informes y Analíticas</h1>
            <div className="flex items-center space-x-2">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-[180px] bg-card">
                  <SelectValue placeholder="Tipo de Informe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales_overview">Ventas Generales</SelectItem>
                  <SelectItem value="service_performance">Rendimiento Servicios</SelectItem>
                  <SelectItem value="customer_insights">Análisis Clientes</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px] bg-card">
                  <Calendar className="mr-2 h-4 w-4 opacity-50" />
                  <SelectValue placeholder="Rango de Tiempo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7days">Últimos 7 días</SelectItem>
                  <SelectItem value="last30days">Últimos 30 días</SelectItem>
                  <SelectItem value="last6months">Últimos 6 meses</SelectItem>
                  <SelectItem value="thisyear">Este Año</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleDownloadReport} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-500/90 hover:to-emerald-600/90 text-white">
                <Download className="mr-2 h-4 w-4" /> Descargar
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <motion.div variants={cardVariants} whileHover="hover" whileTap="tap">
              <Card className="shadow-lg glassmorphism">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-lg font-semibold text-primary">Ventas vs Gastos Mensuales</CardTitle>
                  <CardDescription>Comparativa de ingresos y egresos.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlySalesData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
                      <Bar dataKey="sales" name="Ventas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Gastos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={cardVariants} whileHover="hover" whileTap="tap">
              <Card className="shadow-lg glassmorphism">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-lg font-semibold text-primary">Popularidad de Servicios</CardTitle>
                  <CardDescription>Servicios más solicitados por los clientes.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] pt-4 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={servicePopularityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {servicePopularityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                       <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          <motion.div variants={cardVariants} whileHover="hover" whileTap="tap">
            <Card className="shadow-lg glassmorphism">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg font-semibold text-primary">Satisfacción del Cliente</CardTitle>
                <CardDescription>Nivel de satisfacción general de los clientes.</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={customerSatisfactionData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
                    <Bar dataKey="value" name="Clientes" radius={[0, 4, 4, 0]}>
                      {customerSatisfactionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SATISFACTION_COLORS[index % SATISFACTION_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

        </motion.div>
      );
    };

    export default ReportsPage;