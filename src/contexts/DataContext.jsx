import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from './SupabaseAuthContext';

    const DataContext = createContext();

    const TABLES = [
      'customers', 'vehicles', 'suppliers', 'sale_products', 'purchase_products',
      'work_orders', 'sales', 'purchases', 'collections', 'payments', 'checks', 'employees',
      'organizations', 'user_profiles'
    ];

    export const DataProvider = ({ children }) => {
      const { session, organization, loading: authLoading } = useAuth();
      const [data, setData] = useState({});
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);

      const fetchData = useCallback(async (orgId, isRefresh = false) => {
        if (!orgId) {
          setLoading(false);
          setData({});
          return;
        }
        if (!isRefresh) {
          setLoading(true);
        }
        setError(null);
        try {
          const fetchPromises = TABLES.map(async (table) => {
            try {
              const query = supabase.from(table).select('*');
              if (!['organizations', 'user_profiles'].includes(table)) {
                query.eq('organization_id', orgId);
              } else if (table === 'organizations') {
                query.eq('id', orgId);
              }
              const response = await query;
              if (response.error) {
                console.error(`Error fetching ${table}:`, response.error);
                return { table, data: [], error: response.error };
              }
              return { table, data: response.data };
            } catch (e) {
              console.error(`Network error fetching ${table}:`, e);
              return { table, data: [], error: e };
            }
          });

          const results = await Promise.all(fetchPromises);

          const newData = {};
          let hasError = false;
          results.forEach(result => {
            if (result.error) {
              hasError = true;
            }
            newData[result.table] = result.data;
          });

          setData(newData);
          if (hasError) {
            throw new Error("Algunos datos no se pudieron cargar. Por favor, refresca la página.");
          }

        } catch (e) {
          console.error("Error fetching data:", e);
          setError(e.message);
          setData({});
        } finally {
          if (!isRefresh) {
            setLoading(false);
          }
        }
      }, []);
      
      const refreshData = useCallback(async () => {
        if (organization) {
          await fetchData(organization.id, true);
        }
      }, [organization, fetchData]);

      useEffect(() => {
        if (authLoading) {
          setLoading(true);
          return;
        }
        if (session && organization) {
          fetchData(organization.id, false);
        } else {
          setData({});
          setLoading(false);
        }
      }, [session, organization, authLoading, fetchData]);
      
      const addData = useCallback(async (table, newData) => {
        if (!organization) throw new Error("No organization context");
        const payload = Array.isArray(newData) 
            ? newData.map(item => ({ ...item, organization_id: organization.id }))
            : { ...newData, organization_id: organization.id };
        
        const { data: result, error } = await supabase.from(table).insert(payload).select();
        if (error) throw error;
        
        await refreshData();
        return Array.isArray(result) && result.length === 1 ? result[0] : result;
      }, [organization, refreshData]);

      const updateData = useCallback(async (table, id, updatedData) => {
        const { data: result, error } = await supabase.from(table).update(updatedData).eq('id', id).select().single();
        if (error) throw error;
        await refreshData();
        return result;
      }, [refreshData]);

      const deleteData = useCallback(async (table, id) => {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
        await refreshData();
      }, [refreshData]);

      const value = useMemo(() => ({
        data,
        loading,
        error,
        fetchData: refreshData,
        addData,
        updateData,
        deleteData,
      }), [data, loading, error, refreshData, addData, updateData, deleteData]);

      return (
        <DataContext.Provider value={value}>
          {children}
        </DataContext.Provider>
      );
    };

    export const useData = () => {
      const context = useContext(DataContext);
      if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
      }
      return context;
    };