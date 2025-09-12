import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload } from 'lucide-react';

const ProfileSettings = ({ data, onChange, onLogoUpload, onSubmit }) => {
  const logoInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleLogoClick = () => {
    logoInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      await onLogoUpload(file);
      setIsUploading(false);
    }
  };

  return (
    <Card className="shadow-lg glassmorphism">
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-lg font-semibold text-primary">Información General</CardTitle>
        <CardDescription>Actualiza los datos de tu taller y configura las opciones de venta.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-md font-medium text-foreground">Datos del Taller y Titular</h3>
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <Avatar className="h-20 w-20 border-2 border-primary/20">
                  <AvatarImage src={data.logo_url} alt="Logo del Taller" />
                  <AvatarFallback className="text-2xl bg-muted">{data.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div 
                  className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={handleLogoClick}
                  role="button"
                  tabIndex={0}
                  aria-label="Cambiar logo"
                >
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <Input 
                  ref={logoInputRef}
                  type="file"
                  className="hidden"
                  accept="image/png, image/jpeg, image/gif"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="logo-upload">Logo del Taller</Label>
                <p className="text-xs text-muted-foreground">
                  {isUploading ? 'Subiendo logo...' : 'Haz clic en la imagen para cambiarlo. Se recomienda formato PNG.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Taller</Label>
                <Input id="name" name="name" value={data.name || ''} onChange={onChange} placeholder="Tu taller" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner_name">Nombre y Apellido (Titular)</Label>
                <Input id="owner_name" name="owner_name" value={data.owner_name || ''} onChange={onChange} placeholder="Ej: Juan Pérez" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Domicilio del Taller</Label>
                <Input id="address" name="address" value={data.address || ''} onChange={onChange} placeholder="Ej: Av. Siempre Viva 742" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" name="phone" value={data.phone || ''} onChange={onChange} placeholder="Ej: 11-2233-4455" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_id">CUIT / DNI</Label>
                <Input id="tax_id" name="tax_id" value={data.tax_id || ''} onChange={onChange} placeholder="Ej: 20-12345678-9" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico (Cuenta)</Label>
                <Input id="email" name="email" type="email" value={data.email || ''} disabled className="cursor-not-allowed bg-muted/50" />
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-md font-medium text-foreground">Configuración de Ventas</h3>
            <div className="space-y-2">
              <Label htmlFor="sale_document_number_mode">Numeración de Comprobantes</Label>
               <Select
                name="sale_document_number_mode"
                value={data.sale_document_number_mode || 'automatic'}
                onValueChange={(value) => onChange({ target: { name: 'sale_document_number_mode', value } })}
              >
                <SelectTrigger id="sale_document_number_mode">
                  <SelectValue placeholder="Selecciona un modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automático Correlativo</SelectItem>
                  <SelectItem value="manual">Manual Editable</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Elige si el número de factura/presupuesto se genera automáticamente o lo ingresas manualmente.
              </p>
            </div>
          </div>

          <Button type="submit" className="bg-primary hover:bg-primary/90">Guardar Cambios</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;