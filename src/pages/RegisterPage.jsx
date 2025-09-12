import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, UserPlus, Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const RegisterPage = () => {
  const { signUp, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [workshopName, setWorkshopName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      });
      return;
    }
    
    if (!workshopName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del taller es obligatorio.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await signUp(email, password, workshopName);

    if (!error) {
        setTimeout(() => {
            navigate('/login');
        }, 2000);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          className="w-full h-full object-cover filter blur-sm brightness-75"
          alt="Interior de un taller mecánico con herramientas y vehículos"
         src="https://images.unsplash.com/photo-1623029994649-3d19389f4175" />
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
            <CardTitle className="text-3xl font-bold text-blue-200">Crea tu Cuenta</CardTitle>
            <CardDescription className="text-blue-100">
              Únete a AsociaTaller y lleva la gestión de tu negocio al siguiente nivel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workshopName" className="text-blue-100">Nombre del Taller</Label>
                <Input
                  id="workshopName"
                  type="text"
                  placeholder="Mi Taller Genial"
                  value={workshopName}
                  onChange={(e) => setWorkshopName(e.target.value)}
                  required
                  className="bg-background/80 focus:bg-background text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-blue-100">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/80 focus:bg-background text-gray-900"
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
                  className="bg-background/80 focus:bg-background text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-blue-100">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-background/80 focus:bg-background text-gray-900"
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-6 mt-4" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-5 w-5" />
                )}
                {loading ? 'Registrando...' : 'Registrarse'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center text-xs">
            <p className="mt-4 text-blue-100">¿Ya tienes una cuenta? <Link to="/login" className="text-blue-50 hover:underline">Inicia sesión aquí</Link></p>
            <p className="mt-2 text-blue-100">&copy; {new Date().getFullYear()} AsociaTaller. Todos los derechos reservados.</p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegisterPage;