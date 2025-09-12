import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, MailCheck } from 'lucide-react';

const VerifyEmailPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    toast({
      title: "¡Correo verificado!",
      description: "Tu cuenta ha sido verificada con éxito. Serás redirigido al inicio de sesión.",
      className: "bg-green-500 text-white",
    });

    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 text-white p-4">
      <MailCheck className="h-24 w-24 text-green-300 mb-6 animate-bounce" />
      <h1 className="text-4xl font-bold mb-2">¡Verificación Exitosa!</h1>
      <p className="text-lg text-blue-100 mb-6 text-center">
        Gracias por confirmar tu correo. ¡Ya casi estás listo para empezar!
      </p>
      <div className="flex items-center space-x-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-md">Redirigiendo al inicio de sesión...</p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;