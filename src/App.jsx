import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import AuthenticatedApp from '@/components/layout/AuthenticatedApp';
import UnauthenticatedApp from '@/components/layout/UnauthenticatedApp';
import { Toaster } from './components/ui/toaster';

function App() {
  const { session, user, loading: authLoading } = useAuth();
  const appKey = user ? user.id : 'unauthenticated';

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-primary text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <Router>
      {session && user ? <AuthenticatedAppWrapper key={appKey} /> : <UnauthenticatedApp />}
      <Toaster />
    </Router>
  );
}

// Envolvemos el componente en React.memo para evitar re-renderizados innecesarios.
const AuthenticatedAppWrapper = React.memo(() => {
    const { loading: dataLoading, error } = useData();

    if (dataLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-primary text-xl">Cargando datos del taller...</div>
            </div>
        );
    }
    
    if (error) {
       return (
            <div className="flex flex-col items-center justify-center h-screen bg-background">
                <div className="text-destructive text-xl mb-4">Error al cargar los datos.</div>
                <p className="text-muted-foreground">Por favor, intenta refrescar la página.</p>
            </div>
        );
    }

    return <AuthenticatedApp />;
});

// Es una buena práctica darle un nombre para facilitar la depuración.
AuthenticatedAppWrapper.displayName = 'AuthenticatedAppWrapper';

export default App;
