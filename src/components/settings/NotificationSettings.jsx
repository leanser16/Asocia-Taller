import React from 'react';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Switch } from '@/components/ui/switch';
    import { Label } from '@/components/ui/label';
    import { Button } from '@/components/ui/button';

    const NotificationSettings = ({ settings, onChange, onSubmit }) => {
      return (
        <Card className="shadow-lg glassmorphism">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-lg font-semibold text-primary">Preferencias de Notificación</CardTitle>
            <CardDescription>Elige cómo y cuándo quieres recibir notificaciones.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between space-x-2 p-3 rounded-md border hover:bg-muted/30">
              <Label htmlFor="emailNewOrder" className="flex flex-col space-y-1">
                <span>Nueva Orden de Trabajo</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Recibir email cuando se crea una nueva orden.
                </span>
              </Label>
              <Switch id="emailNewOrder" checked={settings.emailNewOrder} onCheckedChange={() => onChange('emailNewOrder')} />
            </div>
            <div className="flex items-center justify-between space-x-2 p-3 rounded-md border hover:bg-muted/30">
              <Label htmlFor="emailCompletedOrder" className="flex flex-col space-y-1">
                <span>Orden Completada</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Recibir email cuando una orden se marca como completada.
                </span>
              </Label>
              <Switch id="emailCompletedOrder" checked={settings.emailCompletedOrder} onCheckedChange={() => onChange('emailCompletedOrder')} />
            </div>
            <div className="flex items-center justify-between space-x-2 p-3 rounded-md border hover:bg-muted/30">
              <Label htmlFor="smsLowStock" className="flex flex-col space-y-1">
                <span>Alertas de Stock Bajo (SMS)</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Recibir SMS para alertas críticas de inventario.
                </span>
              </Label>
              <Switch id="smsLowStock" checked={settings.smsLowStock} onCheckedChange={() => onChange('smsLowStock')} />
            </div>
            <Button onClick={onSubmit} className="bg-primary hover:bg-primary/90">Guardar Cambios</Button>
          </CardContent>
        </Card>
      );
    };

    export default NotificationSettings;