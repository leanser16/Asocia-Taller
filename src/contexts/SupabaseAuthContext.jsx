import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const { toast } = useToast();
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchOrganization = useCallback(async (userId) => {
        if (!userId) return null;
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('organization_id')
            .eq('user_id', userId)
            .single();

        if (profileError || !profile) {
            console.error('Error fetching user profile:', profileError);
            return null;
        }

        const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', profile.organization_id)
            .single();

        if (orgError) {
            console.error('Error fetching organization:', orgError);
            return null;
        }
        return orgData;
    }, []);

    const refreshData = useCallback(async () => {
        if (user?.id) {
            const orgData = await fetchOrganization(user.id);
            if (orgData) {
                setOrganization(orgData);
            }
        }
    }, [user, fetchOrganization]);

    useEffect(() => {
        const getSessionAndOrg = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            setSession(currentSession);
            const currentUser = currentSession?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                const orgData = await fetchOrganization(currentUser.id);
                setOrganization(orgData);
            }
            setLoading(false);
        };
        
        getSessionAndOrg();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session);
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                if (currentUser) {
                    const orgData = await fetchOrganization(currentUser.id);
                    setOrganization(orgData);
                } else {
                    setOrganization(null);
                }
            }
        );

        return () => {
            subscription?.unsubscribe();
        };
    }, [fetchOrganization]);

    const signUp = useCallback(async (email, password, options) => {
        const { error } = await supabase.auth.signUp({ email, password, options });
        if (error) {
            toast({
                variant: "destructive",
                title: "Error en el registro",
                description: error.message || "Ocurrió un error inesperado.",
            });
        }
        return { error };
    }, [toast]);

    const signIn = useCallback(async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            toast({
                variant: "destructive",
                title: "Error al iniciar sesión",
                description: error.message || "Credenciales incorrectas.",
            });
        }
        return { error };
    }, [toast]);

    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast({
                variant: "destructive",
                title: "Error al cerrar sesión",
                description: error.message || "Ocurrió un error inesperado.",
            });
        }
        return { error };
    }, [toast]);

    const value = useMemo(() => ({
        session,
        user,
        organization,
        loading,
        refreshData,
        signUp,
        signIn,
        signOut,
    }), [session, user, organization, loading, refreshData, signUp, signIn, signOut]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};