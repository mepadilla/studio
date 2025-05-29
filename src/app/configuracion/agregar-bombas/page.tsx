
import { AddPumpDataForm } from '@/components/add-pump-data-form';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatabaseZap } from 'lucide-react';

export default function AddPumpsPage() {
  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="w-full max-w-2xl shadow-lg rounded-lg">
        <CardHeader className="bg-primary text-primary-foreground">
          <div className="flex items-center space-x-3">
            <DatabaseZap className="h-8 w-8" />
            <CardTitle className="text-2xl font-bold">Agregar Nuevos Datos de Bombas</CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/90 mt-2">
            Utilice este formulario para generar el código necesario para agregar nuevas marcas o series de bombas a la aplicación.
          </CardDescription>
        </CardHeader>
        <AddPumpDataForm />
      </Card>
    </div>
  );
}
