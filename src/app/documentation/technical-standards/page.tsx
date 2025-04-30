import { Construction } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TechnicalStandardsPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"> {/* Adjust min-height as needed */}
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center">
          <Construction className="h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl font-bold text-primary">Normas Técnicas (En Construcción)</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>Estamos trabajando en esta sección con información sobre normas técnicas relevantes. ¡Vuelve pronto!</p>
        </CardContent>
      </Card>
    </div>
  );
}
