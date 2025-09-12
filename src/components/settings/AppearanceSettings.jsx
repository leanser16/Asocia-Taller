import React from 'react';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Switch } from '@/components/ui/switch';
    import { Label } from '@/components/ui/label';
    import { Button } from '@/components/ui/button';

    const AppearanceSettings = ({ settings, onChange, onSubmit }) => {
      return (
        <Card className="shadow-lg glassmorphism">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-lg font-semibold text-primary">Apariencia y Personalización</CardTitle>
            <CardDescription>Personaliza la interfaz de la aplicación.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between space-x-2 p-3 rounded-md border hover:bg-muted/30">
              <Label htmlFor="darkMode" className="flex flex-col space-y-1">
                <span>Modo Oscuro</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Activa el tema oscuro para una mejor visualización nocturna.
                </span>
              </Label>
              <Switch id="darkMode" checked={settings.darkMode} onCheckedChange={(checked) => onChange('darkMode', checked)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <select 
                id="language" 
                name="language" 
                value={settings.language} 
                onChange={(e) => onChange('language', e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
            <Button onClick={onSubmit} className="bg-primary hover:bg-primary/90">Guardar Cambios</Button>
          </CardContent>
        </Card>
      );
    };

    export default AppearanceSettings;