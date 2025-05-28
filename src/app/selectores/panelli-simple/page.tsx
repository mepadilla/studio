
import { PanelliPumpSelector } from '@/components/panelli-pump-selector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets } from 'lucide-react'; // Icon for pumps

export default function PanelliSimpleSelectorPage() {
  return (
    <div className="flex flex-col items-center justify-center">
      <PanelliPumpSelector />
    </div>
  );
}
