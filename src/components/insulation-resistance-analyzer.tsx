// @ts-nocheck - TODO: fix typings
"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { Calculator, FileText, Thermometer, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ResistanceChart } from '@/components/resistance-chart';
import { IndexResults } from '@/components/index-results';
import { IndexReferenceTable } from '@/components/index-reference-table';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { useToast } from '@/hooks/use-toast'; // Import useToast

// Define time points for resistance readings
const timePoints = [
  { label: '0s', value: 0 },
  { label: '10s', value: 10 },
  { label: '30s', value: 30 },
  { label: '1 min', value: 60 },
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
  { label: '4 min', value: 240 },
  { label: '5 min', value: 300 },
  { label: '6 min', value: 360 },
  { label: '7 min', value: 420 },
  { label: '8 min', value: 480 },
  { label: '9 min', value: 540 },
  { label: '10 min', value: 600 },
];

// Validation schema using Zod with Spanish messages
const formSchema = z.object({
  testerName: z.string().min(1, 'Nombre del técnico es requerido'),
  motorId: z.string().min(1, 'ID del motor es requerido'),
  motorSerial: z.string().min(1, 'Número de serie del motor es requerido'),
  readings: z.object(
    timePoints.reduce((acc, point) => {
      acc[`t${point.value}`] = z.coerce
        .number({ invalid_type_error: 'Debe ser un número' })
        .positive('Debe ser positivo')
        .gt(0, 'Debe ser mayor que 0');
      return acc;
    }, {} as Record<string, z.ZodNumber>)
  ),
});

type FormData = z.infer<typeof formSchema>;

type ResistanceDataPoint = { time: number; resistance: number };

// Helper: Returns condition based on value and type in Spanish
function getCondition(value: number, type: 'PI' | 'DAR'): string {
    if (type === 'PI') {
      if (value < 1.0) return 'Peligroso';
      if (value >= 1.0 && value < 2.0) return 'Cuestionable';
      if (value >= 2.0 && value <= 4.0) return 'Bueno';
      if (value > 4.0) return 'Excelente';
    } else if (type === 'DAR') {
      if (value < 1.0) return 'Malo';
      if (value >= 1.0 && value < 1.25) return 'Cuestionable';
      if (value >= 1.25 && value <= 1.6) return 'Bueno';
      if (value > 1.6) return 'Excelente';
    }
    return 'N/D'; // No Disponible
}


export function InsulationResistanceAnalyzer() {
  const [polarizationIndex, setPolarizationIndex] = React.useState<
    number | null
  >(null);
  const [dielectricAbsorptionRatio, setDielectricAbsorptionRatio] =
    React.useState<number | null>(null);
  const [chartData, setChartData] = React.useState<ResistanceDataPoint[]>([]);
  const [formData, setFormData] = React.useState<FormData | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = React.useState(false);
  const { toast } = useToast(); // Initialize toast

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      testerName: '',
      motorId: '',
      motorSerial: '',
      readings: timePoints.reduce((acc, point) => {
        acc[`t${point.value}`] = '' as any; // Initialize with empty string for input control
        return acc;
      }, {} as Record<string, any>),
    },
  });

  const calculateIndices = (readings: FormData['readings']) => {
    const r10min = readings['t600'];
    const r1min = readings['t60'];
    const r30sec = readings['t30'];

    let pi = null;
    let dar = null;

    if (r1min > 0 && r10min > 0) { // Ensure both are positive for PI
        pi = parseFloat((r10min / r1min).toFixed(2));
    } else if (r1min === 0 && r10min > 0) {
        pi = Infinity; // Handle division by zero if 1min reading is 0 but 10min is not
    }
     setPolarizationIndex(pi);


    if (r30sec > 0 && r1min > 0) { // Ensure both are positive for DAR
      dar = parseFloat((r1min / r30sec).toFixed(2));
    } else if (r30sec === 0 && r1min > 0) {
        dar = Infinity; // Handle division by zero if 30sec reading is 0 but 1min is not
    }
    setDielectricAbsorptionRatio(dar);


    // Prepare data for the chart
    const data: ResistanceDataPoint[] = timePoints.map((point) => ({
      time: point.value / 60, // Convert seconds to minutes for the chart x-axis
      resistance: readings[`t${point.value}`],
    }));
    setChartData(data);

     // Show success toast
    toast({
      title: "Cálculo Exitoso",
      description: "Los índices PI y DAR se han calculado.",
      variant: "default", // or "success" if you have that variant
    });
  };

  const onSubmit: SubmitHandler<FormData> = (data) => {
    console.log('Formulario Enviado:', data);
    setFormData(data); // Store form data for PDF generation
    calculateIndices(data.readings);
  };

   const generatePDF = async () => {
     if (!formData) {
        toast({
            title: "Error",
            description: "No hay datos para generar el PDF. Por favor, calcula los índices primero.",
            variant: "destructive",
        });
        return;
     };
     setIsLoadingPdf(true);
     toast({
        title: "Generando PDF...",
        description: "Por favor espera.",
     });

     try {
         const doc = new jsPDF();
         const pageHeight = doc.internal.pageSize.height;
         const pageWidth = doc.internal.pageSize.width;
         let currentY = 15; // Start Y position

         // Title
         doc.setFontSize(18);
         doc.text('Reporte de Prueba de Resistencia de Aislamiento', pageWidth / 2, currentY, { align: 'center' });
         currentY += 10;

         // Test Details Table
         autoTable(doc, {
           startY: currentY,
           head: [['Parámetro de Prueba', 'Valor']],
           body: [
             ['Nombre del Técnico', formData.testerName],
             ['ID del Motor', formData.motorId],
             ['Número de Serie del Motor', formData.motorSerial],
           ],
           theme: 'grid',
           headStyles: { fillColor: [26, 35, 126] }, // Dark Blue
           margin: { left: 14, right: 14 },
           didDrawPage: (data) => { currentY = data.cursor?.y ?? currentY; }
         });
         currentY = (doc as any).lastAutoTable.finalY + 10;

        // Check if we need a new page for readings table
        if (currentY + 80 > pageHeight) { // Estimate height needed for readings table
            doc.addPage();
            currentY = 15;
        }

         // Readings Table
         doc.setFontSize(12);
         doc.text('Lecturas de Resistencia de Aislamiento', 14, currentY);
         currentY += 6;
         const readingsBody = timePoints.map((point) => [
           point.label,
           `${formData.readings[`t${point.value}`]} GΩ`,
         ]);
         autoTable(doc, {
           startY: currentY,
           head: [['Tiempo', 'Resistencia (GΩ)']],
           body: readingsBody,
           theme: 'grid',
           headStyles: { fillColor: [26, 35, 126] },
           margin: { left: 14, right: 14 },
           didDrawPage: (data) => { currentY = data.cursor?.y ?? currentY; }
         });
         currentY = (doc as any).lastAutoTable.finalY + 10;

         // Indices Results Table
         if (polarizationIndex !== null || dielectricAbsorptionRatio !== null) {
             // Check space for indices
            if (currentY + 30 > pageHeight) { // Estimate height needed for indices
                doc.addPage();
                currentY = 15;
            }

           doc.setFontSize(12);
           doc.text('Índices Calculados', 14, currentY);
           currentY += 6;
           autoTable(doc, {
             startY: currentY,
             head: [['Índice', 'Valor', 'Condición']],
             body: [
               [
                 'Índice de Polarización (PI)',
                 polarizationIndex !== null ? (isFinite(polarizationIndex) ? polarizationIndex.toFixed(2) : '∞') : 'N/D',
                 polarizationIndex !== null ? getCondition(polarizationIndex, 'PI') : 'N/D',
               ],
               [
                 'Ratio de Absorción Dieléctrica (DAR)',
                 dielectricAbsorptionRatio !== null ? (isFinite(dielectricAbsorptionRatio) ? dielectricAbsorptionRatio.toFixed(2) : '∞') : 'N/D',
                 dielectricAbsorptionRatio !== null ? getCondition(dielectricAbsorptionRatio, 'DAR') : 'N/D',
               ],
             ],
             theme: 'grid',
             headStyles: { fillColor: [26, 35, 126] },
             margin: { left: 14, right: 14 },
             didDrawPage: (data) => { currentY = data.cursor?.y ?? currentY; }
           });
           currentY = (doc as any).lastAutoTable.finalY + 10;
         }

        // Check space for chart
        const chartElement = document.getElementById('resistance-chart-pdf');
        if (chartElement) {
            const chartHeightEstimate = 80; // Estimate chart height in mm
            if (currentY + chartHeightEstimate > pageHeight) {
                doc.addPage();
                currentY = 15;
            }

            doc.setFontSize(12);
            doc.text('Gráfico Resistencia vs. Tiempo', 14, currentY);
            currentY += 6;

            try {
                // Ensure the chart is rendered before capturing
                await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
                const canvas = await html2canvas(chartElement, { scale: 2 }); // Increase scale for better resolution
                const imgData = canvas.toDataURL('image/png');
                const imgProps = doc.getImageProperties(imgData);
                const pdfWidth = pageWidth - 28; // Page width minus margins
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                doc.addImage(imgData, 'PNG', 14, currentY, pdfWidth, pdfHeight);
                currentY += pdfHeight + 10;
            } catch (error) {
                console.error("Error generando imagen del gráfico:", error);
                 doc.text('Error generando imagen del gráfico.', 14, currentY);
                 currentY += 10;
                 toast({
                    title: "Error de Gráfico",
                    description: "No se pudo generar la imagen del gráfico para el PDF.",
                    variant: "destructive",
                 });
            }
        }


         // Check space for reference tables
        const referenceTableHeightEstimate = 60; // Estimate combined height
        if (currentY + referenceTableHeightEstimate > pageHeight) {
            doc.addPage();
            currentY = 15;
        }

         // Reference Tables
         doc.setFontSize(12);
         doc.text('Valores de Referencia (IEEE Std 43-2013)', 14, currentY);
         currentY += 6;
         // PI Reference
         autoTable(doc, {
           startY: currentY,
           head: [['Índice de Polarización (PI)', 'Condición']],
           body: [
             ['< 1.0', 'Peligroso'],
             ['1.0 - 2.0', 'Cuestionable'],
             ['2.0 - 4.0', 'Bueno'],
             ['> 4.0', 'Excelente'],
           ],
           theme: 'grid',
           headStyles: { fillColor: [128, 128, 128] }, // Gray header
           margin: { left: 14, right: 14 },
           didDrawPage: (data) => { currentY = data.cursor?.y ?? currentY; }
         });
         currentY = (doc as any).lastAutoTable.finalY + 5;
         // DAR Reference
         autoTable(doc, {
           startY: currentY,
           head: [['Ratio de Absorción Dieléctrica (DAR)', 'Condición']],
           body: [
             ['< 1.0', 'Malo'],
             ['1.0 - 1.25', 'Cuestionable'],
             ['1.25 - 1.6', 'Bueno'],
             ['> 1.6', 'Excelente'],
           ],
           theme: 'grid',
           headStyles: { fillColor: [128, 128, 128] },
           margin: { left: 14, right: 14 },
           didDrawPage: (data) => { currentY = data.cursor?.y ?? currentY; }
         });
         currentY = (doc as any).lastAutoTable.finalY + 15;


        // Check space for signatures
        const signatureHeightEstimate = 40; // Estimate height needed
        if (currentY + signatureHeightEstimate > pageHeight) {
            doc.addPage();
            currentY = 20; // Start signatures closer to top on new page
        }

         // Signature Sections
         doc.setFontSize(10);
         const signatureY = currentY;
         const signatureXStart = 30;
         const signatureXEnd = pageWidth - 30;
         const signatureLineLength = 60;

         // Tester Signature
         doc.text('Firma del Técnico:', signatureXStart, signatureY);
         doc.line(signatureXStart, signatureY + 5, signatureXStart + signatureLineLength, signatureY + 5);

         // Supervisor Signature
         const supervisorXStart = signatureXEnd - signatureLineLength;
         doc.text('Firma del Supervisor:', supervisorXStart, signatureY);
         doc.line(supervisorXStart, signatureY + 5, supervisorXStart + signatureLineLength, signatureY + 5);

         // Save the PDF
         doc.save(`Reporte_Resistencia_Aislamiento_${formData.motorId}.pdf`);
         toast({
             title: "PDF Generado",
             description: "El reporte se ha descargado exitosamente.",
             variant: "default",
         });

     } catch (error) {
         console.error("Error generando PDF:", error);
         toast({
             title: "Error al Generar PDF",
             description: "Ocurrió un error inesperado. Revisa la consola.",
             variant: "destructive",
         });
     } finally {
         setIsLoadingPdf(false);
     }
   };


  return (
    <>
     <Toaster /> {/* Add Toaster component here */}
    <Card className="w-full max-w-4xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary flex items-center">
          <Thermometer className="mr-2 h-6 w-6" />
          Analizador de Resistencia de Aislamiento
        </CardTitle>
        <CardDescription>
          Introduce los detalles de la prueba y las lecturas de resistencia para calcular PI y DAR.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Test Details Section */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Detalles de la Prueba</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="testerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Técnico</FormLabel>
                      <FormControl>
                        <Input placeholder="Introduce el nombre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="motorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID del Motor</FormLabel>
                      <FormControl>
                        <Input placeholder="Introduce el ID del motor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="motorSerial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nro. de Serie del Motor</FormLabel>
                      <FormControl>
                        <Input placeholder="Introduce el Nro. de Serie" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Separator />

            {/* Resistance Readings Section */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg">
                  Lecturas de Resistencia de Aislamiento (GΩ)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {timePoints.map((point) => (
                  <FormField
                    key={point.value}
                    control={form.control}
                    name={`readings.t${point.value}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{point.label}</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" placeholder="GΩ" {...field} value={field.value === '' ? '' : field.value} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </CardContent>
            </Card>

            <Separator />

            <div className="flex flex-col md:flex-row justify-end space-y-2 md:space-y-0 md:space-x-4">
               <Button
                type="button"
                onClick={generatePDF}
                disabled={!formData || isLoadingPdf}
                variant="outline"
               >
                <FileDown className="mr-2 h-4 w-4" />
                 {isLoadingPdf ? 'Generando PDF...' : 'Descargar Reporte PDF'}
               </Button>
              <Button type="submit" variant="default" className="bg-accent hover:bg-accent/90">
                <Calculator className="mr-2 h-4 w-4" />
                Calcular Índices y Mostrar Gráfico
              </Button>
            </div>
          </form>
        </Form>

        {/* Results Section */}
        {(polarizationIndex !== null || dielectricAbsorptionRatio !== null) && (
          <>
            <Separator className="my-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Chart Card - Hidden for PDF, visible on screen */}
              <Card id="resistance-chart-pdf" className="bg-card">
                  <CardHeader>
                     <CardTitle className="text-lg">Resistencia vs. Tiempo</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <ResistanceChart data={chartData} />
                  </CardContent>
               </Card>


               <div className="space-y-4">
                 <IndexResults
                   pi={polarizationIndex}
                   dar={dielectricAbsorptionRatio}
                   getCondition={getCondition}
                 />
                 <IndexReferenceTable />
               </div>
            </div>


          </>
        )}
      </CardContent>
    </Card>
   </>
  );
}
