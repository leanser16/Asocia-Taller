import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AboutSection = () => {
  return (
    <Card className="shadow-lg glassmorphism">
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-lg font-semibold text-primary">Acerca de AsociaTaller</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center space-x-3">
          <img  alt="Logo AsociaTaller" class="h-12 w-12 rounded-lg" src="https://images.unsplash.com/photo-1635732346025-d0ed3500ea7e" />
          <div>
            <h2 className="text-xl font-semibold">AsociaTaller Gestión v1.0.0</h2>
            <p className="text-sm text-muted-foreground">Desarrollado por Asocia Consultora</p>
          </div>
        </div>
        <p className="text-sm">
          AsociaTaller es una solución integral para la gestión de talleres mecánicos, diseñada para optimizar tus operaciones diarias, desde la recepción de vehículos hasta la facturación y el seguimiento de clientes.
        </p>
        <p className="text-sm">
          Fecha de Compilación: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </CardContent>
    </Card>
  );
};

export default AboutSection;