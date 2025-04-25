// @ts-nocheck - TODO: fix typings
"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { Calculator, FileText, Thermometer, FileDown, AlertCircle } from 'lucide-react';
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
import { cn } from '@/lib/utils'; // Import cn for conditional classes

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
      // Allow empty string initially, but validate as positive number on submit
       acc[`t${point.value}`] = z.union([
          z.literal(''), // Allow empty string
           z.coerce // Coerce to number for validation
             .number({ invalid_type_error: 'Debe ser un número' })
             .positive('Debe ser positivo')
             .gt(0, 'Debe ser mayor que 0')
       ]).refine(val => val !== '', { message: 'Lectura requerida' }); // Ensure not empty on submit
      return acc;
    }, {} as Record<string, z.ZodUnion<[z.ZodLiteral<''>, z.ZodNumber]>>) // Adjust type here
  ),
});


type FormData = z.infer<typeof formSchema>;

type ResistanceDataPoint = { time: number; resistance: number };

// Helper: Returns condition based on value and type in Spanish
function getCondition(value: number | typeof Infinity, type: 'PI' | 'DAR'): string {
   if (!isFinite(value)) {
       return 'Excelente'; // Consider Infinity as Excellent
   }
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
    number | null | typeof Infinity // Allow Infinity
  >(null);
  const [dielectricAbsorptionRatio, setDielectricAbsorptionRatio] =
    React.useState<number | null | typeof Infinity>(null); // Allow Infinity
  const [chartData, setChartData] = React.useState<ResistanceDataPoint[]>([]);
  const [formData, setFormData] = React.useState<FormData | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false); // State to control results visibility
  const resultsRef = React.useRef<HTMLDivElement>(null); // Ref for scrolling

  const { toast } = useToast(); // Initialize toast

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      testerName: '',
      motorId: '',
      motorSerial: '',
      readings: timePoints.reduce((acc, point) => {
        acc[`t${point.value}`] = ''; // Initialize with empty string for input control
        return acc;
      }, {} as any), // Use 'as any' here, Zod handles type coercion
    },
     mode: 'onBlur', // Validate on blur
  });


  const calculateIndices = (readings: FormData['readings']) => {
    // Ensure readings are numbers before calculation
    const r10min = Number(readings['t600']);
    const r1min = Number(readings['t60']);
    const r30sec = Number(readings['t30']);

    let pi: number | null | typeof Infinity = null;
    let dar: number | null | typeof Infinity = null;

    if (!isNaN(r1min) && !isNaN(r10min)) {
      if (r1min > 0) {
        pi = parseFloat((r10min / r1min).toFixed(2));
      } else if (r1min === 0 && r10min > 0) {
        pi = Infinity;
      } else if (r1min === 0 && r10min === 0) {
        pi = null; // Or handle as undefined/error case? NaN? For now, null.
      }
    }
    setPolarizationIndex(pi);


    if (!isNaN(r30sec) && !isNaN(r1min)) {
        if (r30sec > 0) {
             dar = parseFloat((r1min / r30sec).toFixed(2));
        } else if (r30sec === 0 && r1min > 0) {
            dar = Infinity;
        } else if (r30sec === 0 && r1min === 0) {
             dar = null; // Or handle as undefined/error case? NaN? For now, null.
        }
    }
    setDielectricAbsorptionRatio(dar);


    // Prepare data for the chart, converting valid numbers
    const data: ResistanceDataPoint[] = timePoints
       .map((point) => {
            const resistanceValue = Number(readings[`t${point.value}`]);
            return {
                time: point.value / 60, // Convert seconds to minutes
                resistance: isNaN(resistanceValue) ? 0 : resistanceValue, // Use 0 or null for invalid numbers? Let's use 0 for now.
            };
       })
      .filter(point => !isNaN(point.resistance)); // Filter out any potential NaN if needed, though coercion handles most

    setChartData(data);
    setShowResults(true); // Show results section

     // Show success toast
    toast({
      title: "Cálculo Exitoso",
      description: "Los índices PI y DAR se han calculado.",
      variant: "default", // or "success" if you have that variant
    });

    // Scroll to results after a short delay to allow rendering
    setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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
         const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
         const pageHeight = doc.internal.pageSize.height;
         const pageWidth = doc.internal.pageSize.width;
         const margin = 15;
         const contentWidth = pageWidth - margin * 2;
         let currentY = margin; // Start Y position

         // Title
         doc.setFontSize(18);
         doc.setFont(undefined, 'bold');
         doc.setTextColor(Number('0x1A'), Number('0x23'), Number('0x7E')); // Primary color (Dark Blue)
         doc.text('Reporte de Resistencia de Aislamiento', pageWidth / 2, currentY, { align: 'center' });
         doc.setFont(undefined, 'normal');
         doc.setTextColor(0, 0, 0); // Reset color
         currentY += 10;

        // --- Test Details Section ---
         doc.setFontSize(14);
         doc.setFont(undefined, 'bold');
         doc.text('Detalles de la Prueba', margin, currentY);
         currentY += 6;
         doc.setFontSize(10);
         doc.setFont(undefined, 'normal');
         autoTable(doc, {
           startY: currentY,
           head: [['Parámetro', 'Valor']],
           body: [
             ['Nombre del Técnico:', formData.testerName],
             ['ID del Motor:', formData.motorId],
             ['Nro. de Serie del Motor:', formData.motorSerial],
           ],
           theme: 'grid',
           styles: { fontSize: 10, cellPadding: 2 },
           headStyles: { fillColor: [245, 245, 245], textColor: [50, 50, 50], fontStyle: 'bold' }, // Light Gray Header
           columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: contentWidth - 50} },
           margin: { left: margin, right: margin },
           didDrawPage: (data) => { currentY = data.cursor?.y ?? currentY; }
         });
         currentY = (doc as any).lastAutoTable.finalY + 10;


        // --- Resistance Readings Section ---
        if (currentY + 80 > pageHeight) { doc.addPage(); currentY = margin; } // New page check
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Lecturas de Resistencia de Aislamiento (GΩ)', margin, currentY);
        currentY += 6;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const readingsBody = timePoints.map((point) => [
           point.label,
           `${formData.readings[`t${point.value}`]}`,
         ]);
        autoTable(doc, {
           startY: currentY,
           head: [['Tiempo', 'Resistencia (GΩ)']],
           body: readingsBody,
           theme: 'grid',
           styles: { fontSize: 9, cellPadding: 1.5, halign: 'center' },
           headStyles: { fillColor: [245, 245, 245], textColor: [50, 50, 50], fontStyle: 'bold' },
           columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: contentWidth - 30 } },
           margin: { left: margin, right: margin },
           didDrawPage: (data) => { currentY = data.cursor?.y ?? currentY; }
         });
         currentY = (doc as any).lastAutoTable.finalY + 10;


        // --- Results Section (Indices, Chart, Reference Tables) ---
        const resultsStartY = currentY;
        const leftColX = margin;
        const rightColX = margin + contentWidth / 2 + 5; // Add some gap
        const colWidth = contentWidth / 2 - 5; // Adjust col width for gap

        // --- Column 1: Chart ---
        const chartElement = document.getElementById('resistance-chart-container-pdf'); // Use a dedicated container
        if (chartElement) {
            const chartTitleY = currentY;
            if (chartTitleY + 70 > pageHeight) { doc.addPage(); currentY = margin; } // Estimate height + title
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Gráfico Resistencia vs. Tiempo', leftColX, currentY);
            currentY += 6;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');

            try {
                // Ensure the chart is rendered before capturing
                await new Promise(resolve => setTimeout(resolve, 300)); // Small delay might be needed
                const canvas = await html2canvas(chartElement, {
                    scale: 2, // Increase scale for better resolution
                    backgroundColor: '#ffffff', // Ensure background is white for PDF
                     logging: false, // Reduce console noise
                     useCORS: true // If using external resources in chart (unlikely here)
                 });
                const imgData = canvas.toDataURL('image/png');
                const imgProps = doc.getImageProperties(imgData);
                const pdfChartWidth = colWidth;
                const pdfChartHeight = (imgProps.height * pdfChartWidth) / imgProps.width;

                if (currentY + pdfChartHeight > pageHeight) { // Check height again after getting dimensions
                  doc.addPage();
                  currentY = margin;
                  // Redraw title if needed on new page
                  doc.setFontSize(12); doc.setFont(undefined, 'bold');
                  doc.text('Gráfico Resistencia vs. Tiempo', leftColX, currentY); currentY += 6;
                  doc.setFontSize(10); doc.setFont(undefined, 'normal');
                }

                doc.addImage(imgData, 'PNG', leftColX, currentY, pdfChartWidth, pdfChartHeight);
                currentY += pdfChartHeight + 5; // Add some padding below chart
            } catch (error) {
                console.error("Error generando imagen del gráfico:", error);
                 if (currentY + 10 > pageHeight) { doc.addPage(); currentY = margin; }
                 doc.setTextColor(255, 0, 0); // Red for error
                 doc.text('Error generando imagen del gráfico.', leftColX, currentY);
                 currentY += 10;
                 doc.setTextColor(0, 0, 0); // Reset color
                 toast({
                    title: "Error de Gráfico",
                    description: "No se pudo generar la imagen del gráfico para el PDF.",
                    variant: "destructive",
                 });
            }
        } else {
             if (currentY + 10 > pageHeight) { doc.addPage(); currentY = margin; }
             doc.text('Elemento del gráfico no encontrado.', leftColX, currentY); currentY += 10;
        }
        const leftColEndY = currentY;


        // --- Column 2: Indices & Reference ---
        currentY = resultsStartY; // Reset Y to start of results section for the right column
        // Indices Results
        if (polarizationIndex !== null || dielectricAbsorptionRatio !== null) {
             if (currentY + 40 > pageHeight) { doc.addPage(); currentY = margin; } // Estimate height + title
             doc.setFontSize(12); doc.setFont(undefined, 'bold');
             doc.text('Índices Calculados', rightColX, currentY); currentY += 6;
             doc.setFontSize(10); doc.setFont(undefined, 'normal');

             const piValue = polarizationIndex !== null ? (isFinite(polarizationIndex) ? polarizationIndex.toFixed(2) : '∞') : 'N/D';
             const piCondition = polarizationIndex !== null ? getCondition(polarizationIndex, 'PI') : 'N/D';
             const darValue = dielectricAbsorptionRatio !== null ? (isFinite(dielectricAbsorptionRatio) ? dielectricAbsorptionRatio.toFixed(2) : '∞') : 'N/D';
             const darCondition = dielectricAbsorptionRatio !== null ? getCondition(dielectricAbsorptionRatio, 'DAR') : 'N/D';

            // Custom drawing for indices to mimic badge style
             const drawIndex = (label: string, value: string, condition: string, y: number): number => {
                 const labelX = rightColX;
                 const valueX = rightColX + colWidth - 35; // Position value right aligned before badge
                 const badgeX = rightColX + colWidth - 25; // Badge start position
                 const badgeWidth = 25;
                 const badgeHeight = 6;

                 doc.setFontSize(10);
                 doc.setFont(undefined, 'bold');
                 doc.text(label, labelX, y + 4); // Vertically center text a bit
                 doc.setFont(undefined, 'normal');
                 doc.text(value, valueX, y + 4, { align: 'right' });

                 // Draw Badge Background
                 let fillColor: [number, number, number] = [220, 220, 220]; // Default outline/gray
                 let textColor: [number, number, number] = [50, 50, 50]; // Default dark text
                 switch (condition.toLowerCase()) {
                     case 'excelente':
                     case 'bueno':
                         fillColor = [0, 150, 136]; textColor = [255, 255, 255]; // Teal (Accent) - Approximate
                         break;
                     case 'cuestionable':
                         fillColor = [240, 240, 240]; textColor = [50, 50, 50]; // Secondary/Light Gray
                         break;
                     case 'malo':
                     case 'peligroso':
                         fillColor = [220, 53, 69]; textColor = [255, 255, 255]; // Destructive/Red
                         break;
                 }
                 doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
                 doc.setDrawColor(fillColor[0], fillColor[1], fillColor[2]); // Border same as fill
                 doc.roundedRect(badgeX, y, badgeWidth, badgeHeight, 2, 2, 'FD'); // Fill and draw rounded rect

                 // Draw Badge Text
                 doc.setFontSize(8);
                 doc.setTextColor(textColor[0], textColor[1], textColor[2]);
                 doc.text(condition, badgeX + badgeWidth / 2, y + badgeHeight / 2 + 1, { align: 'center', baseline: 'middle' });
                 doc.setTextColor(0, 0, 0); // Reset text color

                 return y + badgeHeight + 4; // Return next Y pos
             }

             currentY = drawIndex('Índice de Polarización (PI):', piValue, piCondition, currentY);
             currentY = drawIndex('Ratio Absorción Dieléctrica (DAR):', darValue, darCondition, currentY);
             currentY += 5; // Add padding after indices

        }

        // Reference Tables
         if (currentY + 60 > pageHeight) { doc.addPage(); currentY = margin; } // Check space for reference title + tables
         doc.setFontSize(12); doc.setFont(undefined, 'bold');
         doc.text('Valores de Referencia (IEEE Std 43-2013)', rightColX, currentY); currentY += 6;
         doc.setFontSize(10); doc.setFont(undefined, 'normal');

         // PI Reference
         autoTable(doc, {
           startY: currentY,
           head: [['Valor PI', 'Condición']],
           body: [
             ['< 1.0', 'Peligroso'],
             ['1.0 - 2.0', 'Cuestionable'],
             ['2.0 - 4.0', 'Bueno'],
             ['> 4.0', 'Excelente'],
           ],
           theme: 'grid',
           styles: { fontSize: 9, cellPadding: 1.5 },
           headStyles: { fillColor: [220, 220, 220], textColor: [80, 80, 80], fontStyle: 'bold' }, // Muted Header
           tableWidth: colWidth,
           margin: { left: rightColX }, // Position table in the right column
           didDrawPage: (data) => { currentY = data.cursor?.y ?? currentY; }
         });
         currentY = (doc as any).lastAutoTable.finalY + 5;

        // DAR Reference
         if (currentY + 40 > pageHeight) { doc.addPage(); currentY = margin; } // Check space for DAR table
         autoTable(doc, {
           startY: currentY,
           head: [['Valor DAR', 'Condición']],
           body: [
             ['< 1.0', 'Malo'],
             ['1.0 - 1.25', 'Cuestionable'],
             ['1.25 - 1.6', 'Bueno'],
             ['> 1.6', 'Excelente'],
           ],
           theme: 'grid',
           styles: { fontSize: 9, cellPadding: 1.5 },
           headStyles: { fillColor: [220, 220, 220], textColor: [80, 80, 80], fontStyle: 'bold' },
           tableWidth: colWidth,
           margin: { left: rightColX }, // Position table in the right column
           didDrawPage: (data) => { currentY = data.cursor?.y ?? currentY; }
         });
         currentY = (doc as any).lastAutoTable.finalY + 5;

        const rightColEndY = currentY;

        // --- Move Y to below the longest column before adding signatures ---
        currentY = Math.max(leftColEndY, rightColEndY) + 15;


        // --- Signature Section ---
        if (currentY + 30 > pageHeight) { doc.addPage(); currentY = margin; } // Check space for signatures
        doc.setFontSize(10);
        const signatureY = currentY;
        const signatureXStart = margin;
        const signatureXEnd = pageWidth - margin;
        const signatureLineLength = 60;

        // Tester Signature
        doc.text('Firma del Técnico:', signatureXStart, signatureY);
        doc.line(signatureXStart, signatureY + 5, signatureXStart + signatureLineLength, signatureY + 5);

        // Supervisor Signature (Aligned Right)
        const supervisorXStart = signatureXEnd - signatureLineLength;
        doc.text('Firma del Supervisor:', supervisorXStart, signatureY);
        doc.line(supervisorXStart, signatureY + 5, supervisorXStart + signatureLineLength, signatureY + 5);


         // Save the PDF
         doc.save(`Reporte_Resistencia_Aislamiento_${formData.motorId || 'Motor'}.pdf`);
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
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>{point.label}</FormLabel>
                        <FormControl>
                          <Input
                             type="number"
                             step="any"
                             placeholder="GΩ"
                             {...field}
                             className={cn(fieldState.error && "border-destructive focus-visible:ring-destructive")}
                           />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </CardContent>
                 <CardFooter className="text-xs text-muted-foreground pt-4">
                     <AlertCircle className="mr-1 h-3 w-3" /> Introduce las lecturas en Gigaohmios (GΩ). Introduce 0 si la lectura es 0.
                 </CardFooter>
            </Card>

            <Separator />

            <div className="flex flex-col md:flex-row justify-end space-y-2 md:space-y-0 md:space-x-4">
               <Button
                type="button"
                onClick={generatePDF}
                disabled={!formData || isLoadingPdf} // Disable if no data OR loading
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

        {/* Results Section - Conditionally Rendered */}
        <div ref={resultsRef}> {/* Add ref here */}
         {showResults && (polarizationIndex !== null || dielectricAbsorptionRatio !== null) && (
          <>
            <Separator className="my-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Chart Card - Visible on screen */}
               {/* Add a dedicated container for PDF rendering */}
               <div id="resistance-chart-container-pdf" className="md:col-span-1">
                  <Card className="bg-card h-full">
                      <CardHeader>
                         <CardTitle className="text-lg">Resistencia vs. Tiempo</CardTitle>
                      </CardHeader>
                      <CardContent>
                         <ResistanceChart data={chartData} />
                      </CardContent>
                   </Card>
                </div>


               <div className="space-y-4 md:col-span-1">
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
       </div>
      </CardContent>
    </Card>
   </>
  );
}
