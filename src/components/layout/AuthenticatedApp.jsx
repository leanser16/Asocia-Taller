import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import DashboardPage from '@/pages/DashboardPage';
import CustomersPage from '@/pages/CustomersPage';
import VehiclesPage from '@/pages/VehiclesPage';
import SuppliersPage from '@/pages/SuppliersPage';
import PurchasesPage from '@/pages/PurchasesPage';
import PaymentsPage from '@/pages/PaymentsPage';
import SalesPage from '@/pages/SalesPage';
import CollectionsPage from '@/pages/CollectionsPage';
import WorkOrdersPage from '@/pages/WorkOrdersPage';
import ChecksPage from '@/pages/ChecksPage';
import ProductsPage from '@/pages/ProductsPage';
import EmployeesPage from '@/pages/EmployeesPage';
import ResultsPage from '@/pages/ResultsPage';
import SettingsPage from '@/pages/SettingsPage';

const AuthenticatedApp = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/purchases" element={<PurchasesPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/work-orders" element={<WorkOrdersPage />} />
        <Route path="/checks" element={<ChecksPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
};

export default AuthenticatedApp;