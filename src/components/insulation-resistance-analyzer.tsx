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
  const innerChartRef = React.useRef<HTMLDivElement>(null); // Ref for the inner chart container used in PDF

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
                resistance: isNaN(resistanceValue) ? 0 : resistanceValue, // Use 0 for now if not a number
            };
       })
      .filter(point => !isNaN(point.resistance)); // Filter out any potential NaN

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
         doc.setFontSize(16); // Slightly smaller title
         doc.setFont(undefined, 'bold');
         doc.setTextColor(Number('0x1A'), Number('0x23'), Number('0x7E')); // Primary color (Dark Blue)
         doc.text('Reporte de Resistencia de Aislamiento', pageWidth / 2, currentY, { align: 'center' });
         doc.setFont(undefined, 'normal');
         doc.setTextColor(0, 0, 0); // Reset color
         currentY += 8; // Reduced space after title

        // --- Test Details Section ---
         doc.setFontSize(12); // Slightly smaller section title
         doc.setFont(undefined, 'bold');
         doc.text('Detalles de la Prueba', margin, currentY);
         currentY += 5; // Reduced space
         doc.setFontSize(9); // Smaller table font
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
           styles: { fontSize: 9, cellPadding: 1.5 }, // Reduced padding
           headStyles: { fillColor: [245, 245, 245], textColor: [50, 50, 50], fontStyle: 'bold', fontSize: 9 }, // Smaller head font
           columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 }, 1: { cellWidth: contentWidth - 45} }, // Adjusted width
           margin: { left: margin, right: margin },
           didDrawPage: (data) => { currentY = data.cursor?.y ?? currentY; }
         });
         currentY = (doc as any).lastAutoTable.finalY + 8; // Reduced space


         // --- Resistance Readings Section (4 columns) ---
         if (currentY + 50 > pageHeight) { doc.addPage(); currentY = margin; } // Estimate height check
         doc.setFontSize(12); // Section title
         doc.setFont(undefined, 'bold');
         doc.text('Lecturas de Resistencia de Aislamiento', margin, currentY); // Title without units here
         currentY += 5; // Reduced space
         doc.setFontSize(9); // Smaller table font
         doc.setFont(undefined, 'normal');

         // Prepare body data for the 4-column layout
         const readingsBody4Col: (string | number)[][] = [];
         const numRows = Math.ceil(timePoints.length / 2); // 7 rows for 13 points split in half

         for (let i = 0; i < numRows; i++) {
           const row: (string | number)[] = [];
           // Column 1 & 2 (index i) - Max 6 rows, so index 0 to 5
           const point1Index = i;
            if (point1Index < 6) { // Only fill first 6 rows for the first pair of columns
               const point1 = timePoints[point1Index];
               if (point1) {
                 row.push(point1.label);
                 row.push(formData.readings[`t${point1.value}`] ?? 'N/D');
               } else {
                 row.push(''); // Should not happen with current logic but good practice
                 row.push('');
               }
           } else {
                row.push(''); // Empty cells for row 7 in first two columns
                row.push('');
           }


           // Column 3 & 4 (index i + 6) - Indices 6 to 12
           const point2Index = i + 6; // Start from 4 min (index 6)
           const point2 = timePoints[point2Index];
           if (point2) {
              row.push(point2.label);
              row.push(formData.readings[`t${point2.value}`] ?? 'N/D');
           } else {
              row.push(''); // Empty cell if no data (e.g., if fewer than 13 points)
              row.push('');
           }
           readingsBody4Col.push(row);
         }

         autoTable(doc, {
           startY: currentY,
           head: [['Tiempo', 'Resistencia (G-OHM)', 'Tiempo', 'Resistencia (G-OHM)']], // Updated Header
           body: readingsBody4Col,
           theme: 'grid',
           styles: { fontSize: 8, cellPadding: 1, halign: 'center' }, // Smaller font, reduced padding
           headStyles: { fillColor: [245, 245, 245], textColor: [50, 50, 50], fontStyle: 'bold', halign: 'center', fontSize: 8.5 }, // Smaller head font
           columnStyles: {
             0: { cellWidth: 'auto', halign: 'left' },
             1: { cellWidth: 'auto', halign: 'center' }, // Center resistance column 1
             2: { cellWidth: 'auto', halign: 'left' },
             3: { cellWidth: 'auto', halign: 'center' }, // Center resistance column 2
           },
           margin: { left: margin, right: margin },
           didDrawPage: (data) => { currentY = data.cursor?.y ?? currentY; }
         });
         currentY = (doc as any).lastAutoTable.finalY + 8; // Reduced space


        // --- Results Section (Indices, Chart, Reference Tables) ---
        // Layout similar to the HTML view (Chart left, Indices/Reference right)
        const resultsStartY = currentY;
        const leftColX = margin;
        const rightColX = margin + contentWidth / 2 + 4; // Reduced gap
        const colWidth = contentWidth / 2 - 4; // Adjust col width for gap

        // --- Column 1: Chart ---
        const chartElement = innerChartRef.current; // Use the inner chart ref here
        let leftColEndY = resultsStartY;
        if (chartElement && chartData.length > 0) {
            const chartTitleY = currentY;
            if (chartTitleY + 60 > pageHeight) { doc.addPage(); currentY = margin; } // Estimate height + title
            doc.setFontSize(11); // Smaller chart title
            doc.setFont(undefined, 'bold');
            doc.text('Gráfico Resistencia vs. Tiempo', leftColX, currentY);
            currentY += 5; // Reduced space
            doc.setFontSize(9); // Reset font size
            doc.setFont(undefined, 'normal');

            try {
                // Ensure the chart is rendered before capturing
                await new Promise(resolve => setTimeout(resolve, 300)); // Small delay might be needed
                const canvas = await html2canvas(chartElement, {
                    scale: 1.8, // Slightly reduced scale for resolution vs size
                    backgroundColor: '#ffffff', // Ensure background is white for PDF
                     logging: false, // Reduce console noise
                     useCORS: true // If using external resources in chart (unlikely here)
                 });
                const imgData = canvas.toDataURL('image/png');
                const imgProps = doc.getImageProperties(imgData);
                const pdfChartWidth = colWidth;
                const pdfChartHeight = (imgProps.height * pdfChartWidth) / imgProps.width;

                if (currentY + pdfChartHeight > pageHeight - 30) { // Check height against page end, leave room for potential signatures
                  doc.addPage();
                  currentY = margin;
                  // Redraw title if needed on new page
                  doc.setFontSize(11); doc.setFont(undefined, 'bold');
                  doc.text('Gráfico Resistencia vs. Tiempo', leftColX, currentY); currentY += 5;
                  doc.setFontSize(9); doc.setFont(undefined, 'normal');
                }

                doc.addImage(imgData, 'PNG', leftColX, currentY, pdfChartWidth, pdfChartHeight);
                currentY += pdfChartHeight + 3; // Reduced padding below chart
            } catch (error) {
                console.error("Error generando imagen del gráfico:", error);
                 if (currentY + 10 > pageHeight) { doc.addPage(); currentY = margin; }
                 doc.setTextColor(255, 0, 0); // Red for error
                 doc.setFontSize(9);
                 doc.text('Error generando imagen del gráfico.', leftColX, currentY);
                 currentY += 8;
                 doc.setTextColor(0, 0, 0); // Reset color
                 toast({
                    title: "Error de Gráfico",
                    description: "No se pudo generar la imagen del gráfico para el PDF.",
                    variant: "destructive",
                 });
            }
             leftColEndY = currentY;
        } else {
            if (currentY + 8 > pageHeight) { doc.addPage(); currentY = margin; }
             doc.setFontSize(9);
            doc.text('Gráfico no disponible.', leftColX, currentY); currentY += 8;
            leftColEndY = currentY;
        }


        // --- Column 2: Indices & Reference ---
        currentY = resultsStartY; // Reset Y to start of results section for the right column
        let rightColEndY = resultsStartY;

        // Indices Results Card (Mimicking UI)
        if (polarizationIndex !== null || dielectricAbsorptionRatio !== null) {
             if (currentY + 35 > pageHeight) { doc.addPage(); currentY = margin; } // Estimate height

             // Card Box (optional visual cue)
             doc.setDrawColor(Number('0xD1'), Number('0xD5'), Number('0xDB')); // Border color approx
             doc.roundedRect(rightColX - 1, currentY - 1, colWidth + 2, 32, 1.5, 1.5, 'S'); // Smaller rounding, adjusted height
             currentY += 1.5; // Padding top

             doc.setFontSize(11); doc.setFont(undefined, 'bold');
             doc.text('Índices Calculados', rightColX + 2, currentY + 3); currentY += 6; // Title with padding
             doc.setFontSize(9); doc.setFont(undefined, 'normal'); // Smaller base font

             const piValue = polarizationIndex !== null ? (isFinite(polarizationIndex) ? polarizationIndex.toFixed(2) : '∞') : 'N/D';
             const piCondition = polarizationIndex !== null ? getCondition(polarizationIndex, 'PI') : 'N/D';
             const darValue = dielectricAbsorptionRatio !== null ? (isFinite(dielectricAbsorptionRatio) ? dielectricAbsorptionRatio.toFixed(2) : '∞') : 'N/D';
             const darCondition = dielectricAbsorptionRatio !== null ? getCondition(dielectricAbsorptionRatio, 'DAR') : 'N/D';

             // Draw Index Row Function
             const drawIndexRow = (label: string, value: string, condition: string, y: number): number => {
                const labelX = rightColX + 2; // Left padding
                const valueX = rightColX + colWidth - 26; // Position value right aligned before badge
                const badgeX = rightColX + colWidth - 24; // Badge start position (right padding)
                const badgeWidth = 22; // Smaller badge width
                const badgeHeight = 5; // Smaller badge height

                doc.setFontSize(9);
                doc.setFont(undefined, 'medium'); // Slightly bolder than normal
                doc.text(label, labelX, y + 3); // Vertically center text
                doc.setFont(undefined, 'bold'); // Bold value
                doc.text(value, valueX, y + 3, { align: 'right' });

                // Badge Drawing
                let fillColor: [number, number, number] = [220, 220, 220]; // Default outline/gray
                let textColor: [number, number, number] = [50, 50, 50]; // Default dark text
                switch (condition.toLowerCase()) {
                   case 'excelente': fillColor = [26, 35, 126]; textColor = [255, 255, 255]; break; // Primary (Dark Blue) approx
                   case 'bueno': fillColor = [0, 150, 136]; textColor = [255, 255, 255]; break; // Accent (Teal) approx
                   case 'cuestionable': fillColor = [224, 224, 224]; textColor = [50, 50, 50]; break; // Secondary (Light Gray) approx
                   case 'malo':
                   case 'peligroso': fillColor = [220, 53, 69]; textColor = [255, 255, 255]; break; // Destructive (Red) approx
                }
                doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
                doc.setDrawColor(fillColor[0], fillColor[1], fillColor[2]); // Border same as fill
                doc.roundedRect(badgeX, y, badgeWidth, badgeHeight, 1.5, 1.5, 'FD'); // Smaller rounding

                // Badge Text
                doc.setFontSize(7); // Smaller badge text
                doc.setFont(undefined, 'semibold'); // Semibold badge text
                doc.setTextColor(textColor[0], textColor[1], textColor[2]);
                doc.text(condition, badgeX + badgeWidth / 2, y + badgeHeight / 2 + 0.5, { align: 'center', baseline: 'middle' });
                doc.setTextColor(0, 0, 0); // Reset text color

                return y + badgeHeight + 3; // Return next Y pos (reduced row padding)
             }

             currentY = drawIndexRow('Índice de Polarización (PI):', piValue, piCondition, currentY);
             currentY = drawIndexRow('Ratio Absorción Dieléctrica (DAR):', darValue, darCondition, currentY);
             currentY += 4; // Reduced padding after indices "card"
        }

        // Reference Tables Card (Mimicking UI)
        if (currentY + 70 > pageHeight) { doc.addPage(); currentY = margin; } // Check space for reference title + tables

        // Card Box (optional)
        const refCardStartY = currentY;
        doc.setDrawColor(Number('0xD1'), Number('0xD5'), Number('0xDB')); // Border color approx
        // Calculate height later based on tables

        currentY += 1.5; // Padding top

        doc.setFontSize(11); doc.setFont(undefined, 'bold');
        doc.text('Valores de Referencia (IEEE Std 43-2013)', rightColX + 2, currentY + 3); currentY += 7; // Title with padding
        doc.setFontSize(9); doc.setFont(undefined, 'normal'); // Base font size

        const tableConfig = {
          theme: 'grid' as const,
          styles: { fontSize: 8, cellPadding: 1, halign: 'left' }, // Smaller font, reduced padding
          headStyles: { fillColor: [245, 245, 245], textColor: [50, 50, 50], fontStyle: 'bold', halign: 'center', fontSize: 8.5 }, // Smaller head font
          tableWidth: colWidth,
          margin: { left: rightColX }, // Position table in the right column
          didDrawPage: (data) => { currentY = data.cursor?.y ?? currentY; }
        };

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
          ...tableConfig,
          columnStyles: { 0: { halign: 'center' }, 1: { halign: 'left' } }, // Center first column
          // Add a caption below the table
          didDrawTable: (data) => {
            doc.setFontSize(7); // Smaller caption
            doc.setTextColor(100, 100, 100); // Muted text color
            doc.text("Referencia Índice de Polarización (PI)", rightColX + colWidth/2 , data.cursor.y + 3, { align: 'center' });
            currentY = data.cursor.y + 6; // Update Y pos after caption
          },
        });
        // currentY += 3; // Reduced space between tables // Handled in didDrawTable

        // DAR Reference
        if (currentY + 35 > pageHeight) { doc.addPage(); currentY = margin; } // Check space for DAR table
        autoTable(doc, {
          startY: currentY,
          head: [['Valor DAR', 'Condición']],
          body: [
            ['< 1.0', 'Malo'],
            ['1.0 - 1.25', 'Cuestionable'],
            ['1.25 - 1.6', 'Bueno'],
            ['> 1.6', 'Excelente'],
          ],
          ...tableConfig,
           columnStyles: { 0: { halign: 'center' }, 1: { halign: 'left' } }, // Center first column
           didDrawTable: (data) => {
            doc.setFontSize(7); // Smaller caption
            doc.setTextColor(100, 100, 100); // Muted text color
            doc.text("Referencia Ratio de Absorción Dieléctrica (DAR)", rightColX + colWidth/2, data.cursor.y + 3, { align: 'center' });
            currentY = data.cursor.y + 6; // Update Y pos after caption
          },
        });

        // Draw the reference card border now that we know the height
        doc.roundedRect(rightColX - 1, refCardStartY - 1, colWidth + 2, currentY - refCardStartY + 1, 1.5, 1.5, 'S'); // Adjusted height, smaller rounding

        rightColEndY = currentY + 3; // Update end Y for the right column


        // --- Move Y to below the longest column before adding signatures ---
        currentY = Math.max(leftColEndY, rightColEndY) + 10; // Reduced space before signatures


        // --- Signature Section ---
        if (currentY + 25 > pageHeight) { doc.addPage(); currentY = margin; } // Check space for signatures
        doc.setFontSize(9); // Smaller signature font
        const signatureY = currentY;
        const signatureXStart = margin;
        const signatureXEnd = pageWidth - margin;
        const signatureLineLength = 55; // Slightly shorter line

        // Tester Signature
        doc.text('Firma del Técnico:', signatureXStart, signatureY);
        doc.line(signatureXStart, signatureY + 4, signatureXStart + signatureLineLength, signatureY + 4);
        doc.text(formData.testerName, signatureXStart, signatureY + 8); // Add name below line

        // Supervisor Signature (Aligned Right)
        const supervisorXStart = signatureXEnd - signatureLineLength;
        doc.text('Firma del Supervisor:', supervisorXStart, signatureY);
        doc.line(supervisorXStart, signatureY + 4, supervisorXStart + signatureLineLength, signatureY + 4);


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
    <Card className="w-full max-w-4xl shadow-lg rounded-lg overflow-hidden">
      <CardHeader className="bg-primary text-primary-foreground">
        <CardTitle className="text-2xl font-bold flex items-center">
          <Thermometer className="mr-2 h-6 w-6" />
          Analizador de Resistencia de Aislamiento
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Introduce los detalles de la prueba y las lecturas de resistencia para calcular PI y DAR.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-secondary/30">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Test Details Section */}
            <Card className="bg-card shadow-md rounded-md">
              <CardHeader>
                <CardTitle className="text-lg text-primary">Detalles de la Prueba</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="testerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Nombre del Técnico</FormLabel>
                      <FormControl>
                        <Input placeholder="Introduce el nombre" {...field} className="rounded-md" />
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
                      <FormLabel className="text-foreground/80">ID del Motor</FormLabel>
                      <FormControl>
                        <Input placeholder="Introduce el ID del motor" {...field} className="rounded-md"/>
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
                      <FormLabel className="text-foreground/80">Nro. de Serie del Motor</FormLabel>
                      <FormControl>
                        <Input placeholder="Introduce el Nro. de Serie" {...field} className="rounded-md"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Separator className="bg-border my-4" />

            {/* Resistance Readings Section */}
            <Card className="bg-card shadow-md rounded-md">
              <CardHeader>
                <CardTitle className="text-lg text-primary">
                  Lecturas de Resistencia de Aislamiento (G-OHM) {/* Changed unit here */}
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
                        <FormLabel className="text-foreground/80">{point.label}</FormLabel>
                        <FormControl>
                          <Input
                             type="number"
                             step="any"
                             placeholder="G-OHM" // Changed placeholder
                             {...field}
                             className={cn("rounded-md",fieldState.error && "border-destructive focus-visible:ring-destructive")}
                           />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </CardContent>
                 <CardFooter className="text-xs text-muted-foreground pt-4 flex items-center">
                     <AlertCircle className="mr-1 h-3 w-3 text-muted-foreground/70" /> Introduce las lecturas en Gigaohmios (G-OHM). Introduce 0 si la lectura es 0. {/* Changed unit here */}
                 </CardFooter>
            </Card>

             <Separator className="bg-border my-4"/>


            <div className="flex flex-col md:flex-row justify-end space-y-2 md:space-y-0 md:space-x-4 pt-4">
               <Button
                type="button"
                onClick={generatePDF}
                disabled={!formData || isLoadingPdf} // Disable if no data OR loading
                variant="outline"
                className="rounded-md border-primary text-primary hover:bg-primary/10"
               >
                <FileDown className="mr-2 h-4 w-4" />
                 {isLoadingPdf ? 'Generando PDF...' : 'Descargar Reporte PDF'}
               </Button>
              <Button type="submit" variant="default" className="bg-accent hover:bg-accent/90 rounded-md text-accent-foreground">
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
            <Separator className="my-6 bg-border" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
               {/* Chart Card - Spanning 3 columns */}
               <div className="md:col-span-3"> {/* Outer div for layout */}
                  <Card className="bg-card shadow-md rounded-md h-full">
                      <CardHeader>
                         <CardTitle className="text-lg text-primary">Resistencia vs. Tiempo</CardTitle>
                      </CardHeader>
                      {/* Move the ref to the direct parent of ResistanceChart for PDF capture */}
                      <CardContent ref={innerChartRef} className="pr-6 pt-4 min-h-[320px]"> {/* Set min-height */}
                         {chartData.length > 0 ? (
                             <ResistanceChart data={chartData} />
                          ) : (
                             <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                 Datos insuficientes para mostrar el gráfico.
                             </div>
                          )}
                      </CardContent>
                   </Card>
                </div>

               {/* Indices and Reference - Spanning 2 columns */}
               <div className="space-y-4 md:col-span-2">
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
