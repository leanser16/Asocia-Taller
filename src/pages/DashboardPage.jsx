import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { DollarSign, AlertTriangle, CheckCircle, Wrench, Package, Users, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold text-lg">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="dark:fill-gray-300">{`Órdenes: ${value}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};


const DashboardPage = () => {
  const { data: appData, loading } = useData();
  const { organization } = useAuth(); // Use organization from useAuth context
  const { sales = [], purchases = [], work_orders = [] } = appData;
  const [activeIndex, setActiveIndex] = React.useState(0);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };
  
  const workshopName = organization?.name || 'tu Taller';

  const dashboardData = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const monthlySales = sales
        .filter(s => {
            const saleDate = new Date(s.sale_date + 'T00:00:00');
            return saleDate.getFullYear() === currentYear && saleDate.getMonth() === currentMonth;
        })
        .reduce((sum, s) => sum + s.total, 0);

    const monthlyPurchases = purchases
        .filter(p => {
            const purchaseDate = new Date(p.purchase_date + 'T00:00:00');
            return purchaseDate.getFullYear() === currentYear && purchaseDate.getMonth() === currentMonth;
        })
        .reduce((sum, p) => sum + p.total, 0);

    const pendingCollections = sales.filter(s => s.status === 'Pendiente de Pago');
    const pendingPayments = purchases.filter(p => p.status === 'Pendiente de Pago');

    const totalPendingCollections = pendingCollections.reduce((sum, s) => sum + s.balance, 0);
    const totalPendingPayments = pendingPayments.reduce((sum, p) => sum + p.balance, 0);

    const chartData = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return { 
            name: d.toLocaleString('es-ES', { month: 'short' }),
            month: d.getMonth(),
            year: d.getFullYear(),
            Ventas: 0,
            Compras: 0
        };
    }).reverse();

    sales.forEach(s => {
        const saleDate = new Date(s.sale_date + 'T00:00:00');
        const chartEntry = chartData.find(c => c.month === saleDate.getMonth() && c.year === saleDate.getFullYear());
        if(chartEntry) chartEntry.Ventas += s.total;
    });

    purchases.forEach(p => {
        const purchaseDate = new Date(p.purchase_date + 'T00:00:00');
        const chartEntry = chartData.find(c => c.month === purchaseDate.getMonth() && c.year === purchaseDate.getFullYear());
        if(chartEntry) chartEntry.Compras += p.total;
    });
    
    const workOrderStatusData = work_orders.reduce((acc, order) => {
        const status = order.status || 'Sin Estado';
        const existing = acc.find(item => item.name === status);
        if (existing) {
            existing.value += 1;
        } else {
            acc.push({ name: status, value: 1 });
        }
        return acc;
    }, []);

    return {
      monthlySales,
      monthlyPurchases,
      totalPendingCollections,
      totalPendingPayments,
      pendingCollectionsCount: pendingCollections.length,
      pendingPaymentsCount: pendingPayments.length,
      chartData,
      workOrderStatusData,
    };
  }, [sales, purchases, work_orders]);

  const COLORS = {
    'Ingresado': '#3b82f6', // blue-500
    'En Proceso': '#f59e0b', // amber-500
    'Finalizado': '#22c55e', // green-500
    'Cancelado': '#ef4444', // red-500
    'Sin Estado': '#a1a1aa', // zinc-400
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Cargando dashboard...</div>;
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
      <div className="flex flex-col md:flex-row items-start justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h1>
            <p className="text-muted-foreground">Bienvenido de nuevo, un resumen de <span className="font-semibold text-primary text-lg">{workshopName}</span>.</p>
          </div>
          <p className="text-sm text-muted-foreground self-center md:self-end">{formatDate(new Date())}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg hover:shadow-primary/20 transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.monthlySales)}</div>
            <p className="text-xs text-muted-foreground">Ventas totales este mes</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-primary/20 transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egresos del Mes</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.monthlyPurchases)}</div>
            <p className="text-xs text-muted-foreground">Compras totales este mes</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-primary/20 transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuentas por Cobrar</CardTitle>
            <DollarSign className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalPendingCollections)}</div>
            <p className="text-xs text-muted-foreground">{dashboardData.pendingCollectionsCount} facturas pendientes</p>
          </CardContent>
        </Card>
         <Card className="shadow-lg hover:shadow-primary/20 transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuentas por Pagar</CardTitle>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalPendingPayments)}</div>
            <p className="text-xs text-muted-foreground">{dashboardData.pendingPaymentsCount} compras pendientes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-lg glassmorphism">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-primary">Ventas vs. Compras (Últimos 6 Meses)</CardTitle>
            <CardDescription>Comparativa de ingresos por ventas y egresos por compras.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  cursor={{ fill: 'hsla(var(--primary) / 0.1)' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Ventas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Compras" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 shadow-lg glassmorphism">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-primary">Estado de Órdenes de Trabajo</CardTitle>
            <CardDescription>Distribución actual de todas las órdenes de trabajo.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={dashboardData.workOrderStatusData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={80} 
                  fill="#8884d8" 
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                >
                  {
                    dashboardData.workOrderStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />)
                  }
                </Pie>
                 <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default DashboardPage;