
// No "use client" here, it's handled by the layout or the form component itself.
import { AddPumpDataForm } from '@/components/add-pump-data-form';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatabaseZap, Settings } from 'lucide-react'; // Changed icon to Settings

export default function AddPumpsPage() {
  // The password protection is now handled by ConfiguracionLayout
  return (
    // Removed outer centering div as layout might handle it or page itself should structure
    <div className="flex flex-col items-center justify-start pt-0"> 
      <Card className="w-full max-w-2xl shadow-lg rounded-lg mt-0">
        <CardHeader className="bg-primary text-primary-foreground">
          <div className="flex items-center space-x-3">
            <Settings className="h-8 w-8" />
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
