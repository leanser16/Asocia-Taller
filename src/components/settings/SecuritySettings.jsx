import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const SecuritySettings = ({ onSubmit }) => {
  return (
    <Card className="shadow-lg glassmorphism">
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-lg font-semibold text-primary">Seguridad de la Cuenta</CardTitle>
        <CardDescription>Administra la seguridad de tu cuenta.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Contraseña Actual</Label>
          <Input id="currentPassword" type="password" placeholder="••••••••" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">Nueva Contraseña</Label>
          <Input id="newPassword" type="password" placeholder="••••••••" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
          <Input id="confirmPassword" type="password" placeholder="••••••••" />
        </div>
        <Button onClick={onSubmit} className="bg-primary hover:bg-primary/90">Cambiar Contraseña</Button>
      </CardContent>
    </Card>
  );
};

export default SecuritySettings;