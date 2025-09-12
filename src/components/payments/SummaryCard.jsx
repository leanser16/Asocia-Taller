import React from 'react';
    import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
    import { Button } from '@/components/ui/button';
    import { formatCurrency } from '@/lib/utils';
    import { FilePlus2 } from 'lucide-react';

    const SummaryCard = ({ title, value, onAction, actionLabel, icon: Icon, setFormOpen, handleSave }) => {
      const handleOpenForm = () => {
        if (title === "Registrar Nuevo Pago") {
          setFormOpen(true);
        } else {
          onAction();
        }
      };

      return (
        <Card className="glassmorphism hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            {typeof value === 'number' && (
              <div className="text-2xl font-bold text-primary">{formatCurrency(value)}</div>
            )}
          </CardContent>
          <CardFooter>
            {title === "Registrar Nuevo Pago" ? (
              <Button className="w-full" onClick={handleOpenForm}>
                <FilePlus2 className="mr-2 h-4 w-4" />
                {actionLabel}
              </Button>
            ) : (
              <Button variant="outline" className="w-full" onClick={onAction}>
                {actionLabel}
              </Button>
            )}
          </CardFooter>
        </Card>
      );
    };

    export default SummaryCard;