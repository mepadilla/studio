import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Zap, Droplet } from 'lucide-react'; // Import relevant icons

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-lg shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6 text-center">
          <div className="flex justify-center space-x-4 mb-4">
             <Wrench className="h-10 w-10" />
             <Zap className="h-10 w-10" />
             <Droplet className="h-10 w-10" />
           </div>
          <CardTitle className="text-3xl font-bold">Bienvenido a Herramientas de Diagnóstico</CardTitle>
           <CardDescription className="text-primary-foreground/90 mt-2 text-lg">
             Su asistente para el mantenimiento predictivo y correctivo.
           </CardDescription>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <p className="text-lg text-foreground mb-6">
            Esta aplicación está diseñada para ofrecer herramientas prácticas y eficientes para el diagnóstico de motores eléctricos y bombas de agua.
          </p>
          <p className="text-md text-muted-foreground">
            Navegue por el menú superior para acceder a las diferentes herramientas y documentación disponible.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
