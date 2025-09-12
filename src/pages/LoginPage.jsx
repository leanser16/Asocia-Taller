import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, LogIn, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await signIn(email, password);
    setLoading(false);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          className="w-full h-full object-cover filter blur-sm brightness-75"
          alt="Interior de un taller mecánico con herramientas y vehículos" src="https://images.unsplash.com/photo-1551522435-a13afa10f103" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800/70 via-blue-600/70 to-blue-400/70"></div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        className="relative z-10"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <Card className="w-full max-w-md shadow-2xl glassmorphism border-none p-6">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center mb-4">
              <Briefcase className="h-12 w-12 text-blue-300" />
            </div>
            <CardTitle className="text-3xl font-bold text-blue-200">AsociaTaller</CardTitle>
            <CardDescription className="text-blue-100">
              Inicia sesión para administrar tu taller
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-blue-100">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-background/80 focus:bg-background text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-blue-100">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-background/80 focus:bg-background text-gray-900 dark:text-gray-100"
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-6" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" /> Ingresar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center text-xs">
            <p className="mt-4 text-blue-100">¿No tienes una cuenta? <Link to="/register" className="text-blue-50 hover:underline">Regístrate aquí</Link></p>
            <p className="mt-2 text-blue-100">&copy; {new Date().getFullYear()} AsociaTaller. Todos los derechos reservados.</p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;