// This file is being renamed to src/app/selectores/bombas-simples/page.tsx
// The content will be updated to use the new PumpSelector component.

import { PumpSelector } from '@/components/pump-selector'; // Renamed component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets } from 'lucide-react';

export default function BombasSimplesSelectorPage() { // Renamed function
  return (
    <div className="flex flex-col items-center justify-center">
      {/* Title will be handled within PumpSelector or dynamically based on brand */}
      <PumpSelector />
    </div>
  );
}
