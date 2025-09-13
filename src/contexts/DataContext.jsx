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
  const { session, organization, loading: authLoading, refreshData: refreshAuthData } = useAuth();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  const orgId = organization?.id;

  const fetchData = useCallback(async (fetchOrgId, isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    }
    setError(null);
    try {
      const fetchPromises = TABLES.map(async (table) => {
        const query = supabase.from(table).select('*');
        if (!['organizations', 'user_profiles'].includes(table)) {
          query.eq('organization_id', fetchOrgId);
        } else if (table === 'organizations') {
          query.eq('id', fetchOrgId);
        }
        const { data: tableData, error: tableError } = await query;
        if (tableError) {
            console.error(`Error fetching ${table}:`, tableError);
            throw new Error(`Failed to fetch ${table}`);
        };
        return { table, data: tableData };
      });

      const results = await Promise.all(fetchPromises);
      const newData = results.reduce((acc, { table, data }) => {
        if (table === 'organizations' && data.length > 0) {
          acc[table] = data[0];
        } else {
          acc[table] = data;
        }
        return acc;
      }, {});
      
      setData(newData);
    } catch (e) {
      console.error("Error fetching data:", e);
      setError(e.message);
      setData({});
    } finally {
      if (!isRefresh) {
        setLoading(false);
        setInitialFetchDone(true);
      }
    }
  }, []);

  useEffect(() => {
    // While authentication is loading, we show a loading screen and wait.
    if (authLoading) {
      setLoading(true);
      return;
    }

    // Once auth is resolved, if we have an organization and we haven't performed the initial data fetch, we do it.
    if (orgId && !initialFetchDone) {
      fetchData(orgId, false); // This function will set loading to false and initialFetchDone to true on completion.
    }

    // If auth is resolved and there is NO session object, it means the user is logged out.
    // We reset the application state to be ready for the next login.
    // This is more robust than checking for !orgId, which might flicker during a session refresh.
    if (!session && !authLoading) {
      setLoading(false);
      setData({});
      // We only reset the flag if it was previously set, to avoid an unnecessary re-render.
      if (initialFetchDone) {
        setInitialFetchDone(false);
      }
    }
  }, [session, orgId, authLoading, initialFetchDone, fetchData]);
  
  const refreshData = useCallback(async () => {
    await refreshAuthData();
    if (orgId) {
      await fetchData(orgId, true);
    }
  }, [orgId, fetchData, refreshAuthData]);

  const addData = useCallback(async (table, newData) => {
    if (!orgId) throw new Error("No organization context");
    const payload = Array.isArray(newData) 
        ? newData.map(item => ({ ...item, organization_id: orgId }))
        : { ...newData, organization_id: orgId };
    
    const { data: result, error } = await supabase.from(table).insert(payload).select();
    if (error) throw error;
    
    await refreshData();
    return Array.isArray(result) && result.length === 1 ? result[0] : result;
  }, [orgId, refreshData]);

  const updateData = useCallback(async (table, id, updatedData) => {
    const { data: result, error } = await supabase.from(table).update(updatedData).eq('id', id).select().single();
    if (error) throw error;
    await refreshData();
    return result;
  }, [refreshData]);

  const updateOrganization = useCallback(async (updatedData) => {
    if (!orgId) throw new Error("No organization context");
    const { data: result, error } = await supabase
      .from('organizations')
      .update(updatedData)
      .eq('id', orgId)
      .select()
      .single();
    if (error) throw error;
    await refreshData();
    return result;
  }, [orgId, refreshData]);

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
    updateOrganization,
    organization: data.organizations,
  }), [data, loading, error, refreshData, addData, updateData, deleteData, updateOrganization]);

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
