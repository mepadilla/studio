
import { MotorRequestSheetForm } from '@/components/motor-request-sheet-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function MotorRequestSheetPage() {
  return (
    <div className="flex flex-col items-center justify-center">
       <MotorRequestSheetForm />
    </div>
  );
}
