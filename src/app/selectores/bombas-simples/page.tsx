
import { PumpSelector } from '@/components/pump-selector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets } from 'lucide-react';

export default function BombasSimplesSelectorPage() {
  return (
    <div className="flex flex-col items-center justify-center">
      <PumpSelector />
    </div>
  );
}
