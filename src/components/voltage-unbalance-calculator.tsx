// @ts-nocheck - TODO: fix typings
"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { Calculator, AlertTriangle, Percent, TrendingDown, Power, Bolt, Gauge, ScanLine, FileDown } from 'lucide-react'; // Added FileDown
import jsPDF from 'jspdf'; // Added jsPDF
import autoTable from 'jspdf-autotable'; // Added autoTable
import html2canvas from 'html2canvas'; // Added html2canvas
import { format } from 'date-fns'; // Added date-fns

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
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { DeratingFactorChart } from '@/components/derating-factor-chart'; // Import chart for PDF

// Validation schema using Zod with Spanish messages
const formSchema = z.object({
  motorId: z.string().min(1, 'ID del motor es requerido'), // Added motor ID field
  vab: z.coerce // Coerce to number for validation
    .number({ invalid_type_error: 'Debe ser un número' })
    .positive('Debe ser positivo')
    .gt(0, 'Debe ser mayor que 0'),
  vbc: z.coerce
    .number({ invalid_type_error: 'Debe ser un número' })
    .positive('Debe ser positivo')
    .gt(0, 'Debe ser mayor que 0'),
  vca: z.coerce
    .number({ invalid_type_error: 'Debe ser un número' })
    .positive('Debe ser positivo')
    .gt(0, 'Debe ser mayor que 0'),
  motorHp: z.coerce // Added motor HP field
    .number({ invalid_type_error: 'Debe ser un número' })
    .positive('La potencia debe ser positiva')
    .optional()
    .or(z.literal('')), // Allow empty string
  nominalVoltage: z.coerce // Added nominal voltage field
    .number({ invalid_type_error: 'Debe ser un número' })
    .positive('El voltaje debe ser positivo')
    .optional()
    .or(z.literal('')), // Allow empty string
});

type FormData = z.infer<typeof formSchema>;

// Data points for derating factor approximation (from DeratingFactorChart)
const deratingData = [
  { desbalance: 0, factor: 1.0 },
  { desbalance: 0.5, factor: 1.0 },
  { desbalance: 1.0, factor: 1.0 },
  { desbalance: 1.5, factor: 0.98 },
  { desbalance: 2.0, factor: 0.96 },
  { desbalance: 2.5, factor: 0.93 },
  { desbalance: 3.0, factor: 0.90 },
  { desbalance: 3.5, factor: 0.87 },
  { desbalance: 4.0, factor: 0.83 },
  { desbalance: 4.5, factor: 0.80 },
  { desbalance: 5.0, factor: 0.76 },
];

// Function to calculate derating factor using linear interpolation
function calculateDeratingFactor(unbalancePercent: number): number {
  if (unbalancePercent <= 1.0) {
    return 1.0;
  }
  if (unbalancePercent >= 5.0) {
    return 0.76; // NEMA MG1 recommends not operating above 5%
  }

  // Find the two points surrounding the unbalance percentage
  let lowerPoint = deratingData[0];
  let upperPoint = deratingData[1];

  for (let i = 0; i < deratingData.length - 1; i++) {
    if (unbalancePercent >= deratingData[i].desbalance && unbalancePercent < deratingData[i + 1].desbalance) {
      lowerPoint = deratingData[i];
      upperPoint = deratingData[i + 1];
      break;
    }
  }

   // Check if the last segment should be used
   if (unbalancePercent >= deratingData[deratingData.length - 1].desbalance) {
    lowerPoint = deratingData[deratingData.length - 2];
    upperPoint = deratingData[deratingData.length - 1];
  }


  // Linear interpolation: y = y1 + ((x - x1) * (y2 - y1)) / (x2 - x1)
  const x = unbalancePercent;
  const x1 = lowerPoint.desbalance;
  const y1 = lowerPoint.factor;
  const x2 = upperPoint.desbalance;
  const y2 = upperPoint.factor;

  if (x2 === x1) return y1; // Avoid division by zero if points are the same

  const factor = y1 + ((x - x1) * (y2 - y1)) / (x2 - x1);

  // Return the calculated factor, potentially rounded
  return parseFloat(factor.toFixed(3)); // Round to 3 decimal places for precision
}

export function VoltageUnbalanceCalculator() {
  const [voltageUnbalance, setVoltageUnbalance] = React.useState<number | null>(null);
  const [deratingFactor, setDeratingFactor] = React.useState<number | null>(null);
  const [voltageDeviation, setVoltageDeviation] = React.useState<number | null>(null); // State for voltage deviation
  const [deratedPowerHp, setDeratedPowerHp] = React.useState<number | null>(null); // State for derated power
  const [showResults, setShowResults] = React.useState(false);
  const [formData, setFormData] = React.useState<FormData | null>(null); // Store form data for PDF
  const [isLoadingPdf, setIsLoadingPdf] = React.useState(false); // PDF loading state
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<HTMLDivElement>(null); // Ref for chart capture

  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      motorId: '', // Added motor ID default
      vab: '',
      vbc: '',
      vca: '',
      motorHp: '', // Added default value
      nominalVoltage: '', // Added default value
    },
    mode: 'onBlur', // Validate on blur
  });

  const calculateUnbalance = (data: FormData) => {
    const { vab, vbc, vca, nominalVoltage, motorHp } = data; // Include motorHp
    const voltages = [Number(vab), Number(vbc), Number(vca)]; // Ensure numbers

    // Calculate average voltage
    const averageVoltage = (Number(vab) + Number(vbc) + Number(vca)) / 3;

    // Calculate percentage unbalance (NEMA definition)
    let unbalancePercent = 0;
    if (averageVoltage > 0) {
         // Calculate maximum deviation from average for unbalance
         const deviationsUnbalance = voltages.map(v => Math.abs(v - averageVoltage));
         const maxDeviationUnbalance = Math.max(...deviationsUnbalance);
         unbalancePercent = (maxDeviationUnbalance / averageVoltage) * 100;
    }
    const finalUnbalancePercent = parseFloat(unbalancePercent.toFixed(2));
    setVoltageUnbalance(finalUnbalancePercent);


    // Calculate voltage deviation from nominal
    let deviationPercent: number | null = null;
    const numNominalVoltage = Number(nominalVoltage);
    if (numNominalVoltage && numNominalVoltage > 0 && averageVoltage > 0) {
        deviationPercent = ((averageVoltage - numNominalVoltage) / numNominalVoltage) * 100;
        setVoltageDeviation(parseFloat(deviationPercent.toFixed(2)));
    } else {
        setVoltageDeviation(null); // Reset if nominal voltage is not valid
    }

    // Calculate derating factor based on unbalance
    const factor = calculateDeratingFactor(finalUnbalancePercent);
    setDeratingFactor(factor);

    // Calculate derated power
    const numMotorHp = Number(motorHp);
    if (numMotorHp && numMotorHp > 0 && factor !== null) {
        const calculatedDeratedPower = numMotorHp * factor;
        setDeratedPowerHp(parseFloat(calculatedDeratedPower.toFixed(2)));
    } else {
        setDeratedPowerHp(null); // Reset if motorHp or factor is invalid
    }


    setShowResults(true);
    setFormData(data); // Store data for PDF generation

    toast({
      title: "Cálculo Exitoso",
      description: "Los índices de desbalance, desviación y potencia reclasificada se han calculado.", // Updated message
      variant: "default",
    });

    // Scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const onSubmit: SubmitHandler<FormData> = (data) => {
    console.log('Formulario Enviado:', data); // Includes new fields now
    calculateUnbalance(data);
  };

  // Function to get color based on deviation percentage
  const getDeviationColor = (deviation: number | null): string => {
      if (deviation === null) return "text-muted-foreground"; // Default color if no calculation
      const absDeviation = Math.abs(deviation);
      if (absDeviation <= 5) return "text-green-600"; // Green for +/- 5%
      if (absDeviation <= 10) return "text-yellow-600"; // Yellow for +/- 5% to +/- 10%
      return "text-destructive"; // Red for > +/- 10%
  }

  // PDF Generation Function
  const generatePDF = async () => {
    if (!formData || voltageUnbalance === null) {
      toast({
        title: "Error",
        description: "No hay datos calculados para generar el PDF. Por favor, calcula los índices primero.",
        variant: "destructive",
      });
      return;
    }
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
      const footerHeight = 15;
      const contentWidth = pageWidth - margin * 2;
      let currentY = margin;

      // --- Add Footer Function (Copied from Insulation Resistance Analyzer) ---
       const addFooter = (docInstance: jsPDF) => {
            const pageCount = docInstance.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
            docInstance.setPage(i);
            docInstance.setFontSize(7); // Smaller footer font
            docInstance.setTextColor(150);
            const footerY = pageHeight - margin + 5; // Position slightly below bottom margin

            // Left part: Copyright
            const copyrightText = "© 2025, desarrollado por ";
            docInstance.text(copyrightText, margin, footerY, { align: 'left' });

            // Middle part: Link
            const linkText = "Ing. Melvin E. Padilla";
            const linkUrl = "https://www.linkedin.com/in/melvin-padilla-3425106";
            const linkTextWidth = docInstance.getTextWidth(linkText);
            const copyrightTextWidth = docInstance.getTextWidth(copyrightText);
            const linkX = margin + copyrightTextWidth;

            // jsPDF doesn't have built-in rich text formatting for links, we simulate it
            docInstance.setTextColor(Number('0x1A'), Number('0x23'), Number('0x7E')); // Primary color
            docInstance.textWithLink(linkText, linkX, footerY, { url: linkUrl });
            // Simulate underline if textWithLink doesn't provide it
            docInstance.setDrawColor(Number('0x1A'), Number('0x23'), Number('0x7E')); // Underline color
            docInstance.line(linkX, footerY + 0.5, linkX + linkTextWidth, footerY + 0.5); // Underline

            // Right part: Period
            const periodText = ".";
            const periodX = linkX + linkTextWidth;
            docInstance.setTextColor(150); // Reset to muted color
            docInstance.text(periodText, periodX, footerY, { align: 'left' });

            // Page number (far right)
            const pageNumText = `Página ${i} de ${pageCount}`;
            docInstance.text(pageNumText, pageWidth - margin, footerY, { align: 'right' });
            }
            docInstance.setTextColor(0); // Reset text color for main content
        };

      // --- PDF Title ---
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(Number('0x1A'), Number('0x23'), Number('0x7E'));
      doc.text('Reporte de Desbalance de Voltaje y Reclasificación', pageWidth / 2, currentY, { align: 'center' });
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      currentY += 7;

      // --- Motor & Test Details Table ---
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Datos del Motor y Prueba', margin, currentY);
      currentY += 4;
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      const testDate = format(new Date(), 'dd/MM/yyyy HH:mm');
      autoTable(doc, {
        startY: currentY,
        head: [['Parámetro', 'Valor']],
        body: [
          ['ID Motor / Serial / Aplicación:', formData.motorId],
          ['Potencia Nominal (HP):', formData.motorHp ? formData.motorHp : 'N/D'],
          ['Voltaje Nominal (V):', formData.nominalVoltage ? formData.nominalVoltage : 'N/D'],
          ['Fecha de la Prueba:', testDate],
        ],
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.2 },
        headStyles: { fillColor: [245, 245, 245], textColor: [50, 50, 50], fontStyle: 'bold', fontSize: 8 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: contentWidth - 60 } },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => { currentY = data.cursor?.y ?? currentY; }
      });
      currentY = (doc as any).lastAutoTable.finalY + 6;

      // --- Measured Voltages Table ---
      if (currentY + 25 > pageHeight - margin - footerHeight) { doc.addPage(); currentY = margin; }
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Voltajes Medidos (Línea a Línea)', margin, currentY);
      currentY += 4;
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      autoTable(doc, {
        startY: currentY,
        head: [['Fase', 'Voltaje (V)']],
        body: [
          ['Vab', formData.vab],
          ['Vbc', formData.vbc],
          ['Vca', formData.vca],
          ['Promedio', ((Number(formData.vab) + Number(formData.vbc) + Number(formData.vca)) / 3).toFixed(2)],
        ],
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.2 },
        headStyles: { fillColor: [245, 245, 245], textColor: [50, 50, 50], fontStyle: 'bold', fontSize: 8 },
        columnStyles: {
             0: { fontStyle: 'bold', cellWidth: 60 },
             1: { cellWidth: contentWidth - 60, halign: 'center' } // Center align Voltaje column
         },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => { currentY = data.cursor?.y ?? currentY; }
      });
      currentY = (doc as any).lastAutoTable.finalY + 6;

      // --- Calculated Results Table ---
      if (currentY + 35 > pageHeight - margin - footerHeight) { doc.addPage(); currentY = margin; }
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Resultados Calculados', margin, currentY);
      currentY += 4;
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      const resultsBody = [
        ['% Desbalance de Voltaje (NEMA):', `${voltageUnbalance !== null ? voltageUnbalance.toFixed(2) : 'N/D'} %`],
        ['Factor de Reclasificación (Fr):', deratingFactor !== null ? deratingFactor.toFixed(3) : 'N/D'],
        ['% Desviación de Voltaje Nominal:', `${voltageDeviation !== null ? voltageDeviation.toFixed(2) : 'N/D'} %`],
        ['Potencia Reclasificada (HP):', `${deratedPowerHp !== null ? deratedPowerHp.toFixed(2) : 'N/D'}`],
      ];
       // Add warnings if applicable
       if (voltageUnbalance !== null && voltageUnbalance > 5) {
           resultsBody.push([{ content: 'Advertencia Desbalance > 5% (No recomendable operar según NEMA MG1)', colSpan: 2, styles: { textColor: [220, 53, 69], fontStyle: 'italic', fontSize: 7 } }]);
       }
       if (voltageDeviation !== null && Math.abs(voltageDeviation) > 10) {
            resultsBody.push([{ content: 'Advertencia Desviación Voltaje > +/-10% (Afecta rendimiento y vida útil)', colSpan: 2, styles: { textColor: [220, 53, 69], fontStyle: 'italic', fontSize: 7 } }]);
       }
       if (deratedPowerHp === null && (formData.motorHp === '' || !formData.motorHp)) {
           resultsBody.push([{ content: 'Nota: Introducir HP nominal para calcular potencia reclasificada.', colSpan: 2, styles: { textColor: [108, 117, 125], fontStyle: 'italic', fontSize: 7 } }]);
       }
       if (voltageDeviation === null && (formData.nominalVoltage === '' || !formData.nominalVoltage)) {
            resultsBody.push([{ content: 'Nota: Introducir Voltaje nominal para calcular desviación.', colSpan: 2, styles: { textColor: [108, 117, 125], fontStyle: 'italic', fontSize: 7 } }]);
       }


      autoTable(doc, {
        startY: currentY,
        head: [['Índice', 'Valor']],
        body: resultsBody,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.2 },
        headStyles: { fillColor: [245, 245, 245], textColor: [50, 50, 50], fontStyle: 'bold', fontSize: 8 },
         columnStyles: {
             0: { fontStyle: 'bold', cellWidth: 60 },
             1: { cellWidth: contentWidth - 60, halign: 'center' } // Center align Valor column
         },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => { currentY = data.cursor?.y ?? currentY; }
      });
      currentY = (doc as any).lastAutoTable.finalY + 6;

      // --- Derating Factor Chart ---
      const chartElement = chartRef.current;
      if (chartElement) {
          const chartTitleY = currentY;
          if (chartTitleY + 55 > pageHeight - margin - footerHeight) { doc.addPage(); currentY = margin; }
          doc.setFontSize(10); doc.setFont(undefined, 'bold');
          doc.text('Curva de Factor de Reclasificación (NEMA MG1)', margin, currentY);
          currentY += 4;
          doc.setFontSize(8); doc.setFont(undefined, 'normal');

          try {
             // Add a small delay to ensure chart rendering completes before canvas capture
              await new Promise(resolve => setTimeout(resolve, 300));
              const canvas = await html2canvas(chartElement, { scale: 1.6, backgroundColor: '#ffffff', logging: false, useCORS: true });
              const imgData = canvas.toDataURL('image/png');
              const imgProps = doc.getImageProperties(imgData);
              const pdfChartWidth = contentWidth * 0.7; // Adjust chart width as needed
              const pdfChartHeight = (imgProps.height * pdfChartWidth) / imgProps.width;
              const chartX = (pageWidth - pdfChartWidth) / 2; // Center the chart

              if (currentY + pdfChartHeight > pageHeight - margin - footerHeight) {
                  doc.addPage();
                  currentY = margin;
                  doc.setFontSize(10); doc.setFont(undefined, 'bold');
                  doc.text('Curva de Factor de Reclasificación (NEMA MG1)', margin, currentY); currentY += 4;
                  doc.setFontSize(8); doc.setFont(undefined, 'normal');
              }

              doc.addImage(imgData, 'PNG', chartX, currentY, pdfChartWidth, pdfChartHeight);
              currentY += pdfChartHeight + 4;
          } catch (error) {
              console.error("Error generando imagen del gráfico:", error);
              if (currentY + 8 > pageHeight - margin - footerHeight) { doc.addPage(); currentY = margin; }
              doc.setTextColor(255, 0, 0);
              doc.setFontSize(8);
              doc.text('Error generando imagen del gráfico.', margin, currentY);
              currentY += 6;
              doc.setTextColor(0, 0, 0);
              toast({ title: "Error de Gráfico", description: "No se pudo generar la imagen del gráfico para el PDF.", variant: "destructive" });
          }
      }

      // --- Explanatory Note ---
      if (currentY + 25 > pageHeight - margin - footerHeight) { doc.addPage(); currentY = margin; }
      doc.setFontSize(8);
      doc.setFont(undefined, 'italic');
      doc.setTextColor(100, 100, 100);
      const noteText = `Nota: El desbalance de voltaje afecta el calentamiento y la eficiencia del motor. El factor de reclasificación (Fr) se usa para determinar la potencia máxima segura (Potencia Reclasificada = Potencia Nominal * Fr) bajo desbalance. La desviación del voltaje nominal afecta el par y la corriente. Consulte NEMA MG1 y las recomendaciones del fabricante.`;
      const splitNotes = doc.splitTextToSize(noteText, contentWidth);
      doc.text(splitNotes, margin, currentY);
      currentY += (splitNotes.length * 3.5) + 4; // Adjust spacing based on lines

      // --- Footer ---
      addFooter(doc);

      // --- Save PDF ---
      doc.save(`Reporte_Desbalance_Voltaje_${formData.motorId || 'Motor'}.pdf`);
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
      <Toaster />
      <Card className="w-full max-w-lg shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-2xl font-bold flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6" />
            Calculadora de Desbalance y Desviación de Voltaje (NEMA)
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Introduce los datos del motor y los voltajes de línea para calcular el % de desbalance, el factor de reclasificación, la desviación del voltaje nominal y la potencia reclasificada.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-secondary/30">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Motor Details Section */}
               <Card className="bg-card shadow-md rounded-md">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary">Datos del Motor</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <FormField
                      control={form.control}
                      name="motorId"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80 flex items-center">
                            <ScanLine className="mr-1 h-4 w-4"/> ID del Motor / Serial / Aplicacion
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Ej: Bomba Pozo 1"
                              {...field}
                              className={cn("rounded-md", fieldState.error && "border-destructive focus-visible:ring-destructive")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="motorHp"
                      render={({ field, fieldState }) => (
                        <FormItem>
                           <FormLabel className="text-foreground/80 flex items-center">
                             <Power className="mr-1 h-4 w-4"/> Potencia Nominal (HP) <span className="text-muted-foreground/80 ml-1 text-xs">(Opcional)</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="any"
                              placeholder="Ej: 100"
                              {...field}
                              value={field.value === null ? '' : field.value} // Handle null for controlled input
                              className={cn("rounded-md", fieldState.error && "border-destructive focus-visible:ring-destructive")}
                            />
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nominalVoltage"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80 flex items-center">
                             <Bolt className="mr-1 h-4 w-4"/> Voltaje Nominal (V) <span className="text-muted-foreground/80 ml-1 text-xs">(Opcional)</span>
                           </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="any"
                              placeholder="Ej: 480"
                              {...field}
                               value={field.value === null ? '' : field.value} // Handle null for controlled input
                              className={cn("rounded-md", fieldState.error && "border-destructive focus-visible:ring-destructive")}
                            />
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
               </Card>


              {/* Voltage Inputs Section */}
              <Card className="bg-card shadow-md rounded-md">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">Voltajes Medidos Línea a Línea (V)</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="vab"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80">Vab</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="Voltaje A-B"
                            {...field}
                            className={cn("rounded-md", fieldState.error && "border-destructive focus-visible:ring-destructive")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vbc"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80">Vbc</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="Voltaje B-C"
                            {...field}
                             className={cn("rounded-md", fieldState.error && "border-destructive focus-visible:ring-destructive")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vca"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80">Vca</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="Voltaje C-A"
                            {...field}
                             className={cn("rounded-md", fieldState.error && "border-destructive focus-visible:ring-destructive")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground pt-4 flex items-center">
                  <AlertTriangle className="mr-1 h-3 w-3 text-muted-foreground/70" /> Introduce los voltajes RMS medidos entre las fases.
                 </CardFooter>
              </Card>

              <Separator className="bg-border my-4" />

               {/* Action Buttons */}
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
                    Calcular Índices
                  </Button>
               </div>
            </form>
          </Form>

          {/* Results Section - Conditionally Rendered */}
          <div ref={resultsRef}>
            {showResults && (voltageUnbalance !== null || deratingFactor !== null || voltageDeviation !== null || deratedPowerHp !== null) && (
              <>
                <Separator className="my-6 bg-border" />
                <Card className="bg-card shadow-md rounded-md">
                   <CardHeader>
                      <CardTitle className="text-lg text-primary">Resultados Calculados</CardTitle>
                   </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Voltage Unbalance */}
                    {voltageUnbalance !== null && (
                        <div className="flex justify-between items-center p-3 bg-background rounded-md border">
                          <div className="flex items-center">
                              <Percent className="mr-2 h-5 w-5 text-primary" />
                              <span className="font-medium text-foreground">Porcentaje de Desbalance:</span>
                          </div>
                          <span className={cn(
                             "text-xl font-bold",
                             voltageUnbalance > 5 ? "text-destructive" : "text-primary"
                          )}>
                             {voltageUnbalance.toFixed(2)} %
                           </span>
                        </div>
                    )}
                     {voltageUnbalance !== null && voltageUnbalance > 5 && (
                        <p className="text-sm text-destructive flex items-center mt-1">
                          <AlertTriangle className="mr-1 h-4 w-4"/>
                           ¡Advertencia! El desbalance supera el 5%. No se recomienda operar el motor en estas condiciones según NEMA MG1.
                        </p>
                      )}

                    {/* Derating Factor */}
                    {deratingFactor !== null && (
                        <div className="flex justify-between items-center p-3 bg-background rounded-md border">
                           <div className="flex items-center">
                              <TrendingDown className="mr-2 h-5 w-5 text-primary" />
                              <span className="font-medium text-foreground">Factor de Reclasificación (Fr):</span>
                           </div>
                          <span className={cn(
                            "text-xl font-bold",
                            deratingFactor < 0.8 ? "text-destructive" : "text-primary" // Example threshold
                          )}>
                            {deratingFactor.toFixed(3)}
                          </span>
                        </div>
                    )}

                     {/* Derated Power */}
                      <div className="flex justify-between items-center p-3 bg-background rounded-md border">
                          <div className="flex items-center">
                             <Power className="mr-2 h-5 w-5 text-primary" />
                             <span className="font-medium text-foreground">Potencia Reclasificada (HP):</span>
                          </div>
                           <span className={cn(
                               "text-xl font-bold",
                               deratedPowerHp !== null && form.getValues().motorHp && deratedPowerHp < (Number(form.getValues().motorHp) * 0.8) ? "text-destructive" : "text-primary" // Example threshold: if derated power is less than 80% of nominal
                           )}>
                               {deratedPowerHp !== null ? deratedPowerHp.toFixed(2) : 'N/D'}
                           </span>
                        </div>
                        {deratedPowerHp === null && (form.getValues().motorHp === '' || !form.getValues().motorHp) && ( // Check if motorHp is empty or undefined/null
                             <p className="text-xs text-muted-foreground mt-1">
                                Introduce la potencia nominal (HP) del motor para calcular la potencia reclasificada.
                             </p>
                        )}

                     {/* Voltage Deviation */}
                     <div className="flex justify-between items-center p-3 bg-background rounded-md border">
                        <div className="flex items-center">
                            <Gauge className="mr-2 h-5 w-5 text-primary" />
                            <span className="font-medium text-foreground">Desviación de Voltaje Nominal:</span>
                        </div>
                        <span className={cn(
                             "text-xl font-bold",
                             getDeviationColor(voltageDeviation) // Use helper for color
                         )}>
                             {voltageDeviation !== null ? `${voltageDeviation.toFixed(2)} %` : 'N/D'}
                         </span>
                      </div>
                      {voltageDeviation === null && (form.getValues().nominalVoltage === '' || !form.getValues().nominalVoltage) && ( // Check if nominalVoltage is empty or undefined/null
                           <p className="text-xs text-muted-foreground mt-1">
                              Introduce el voltaje nominal del motor para calcular la desviación.
                           </p>
                      )}
                       {voltageDeviation !== null && Math.abs(voltageDeviation) > 10 && (
                          <p className="text-sm text-destructive flex items-center mt-1">
                            <AlertTriangle className="mr-1 h-4 w-4"/>
                             ¡Advertencia! La desviación del voltaje nominal supera el +/-10%. Esto puede afectar el rendimiento y la vida útil del motor.
                          </p>
                       )}


                     <p className="text-xs text-muted-foreground pt-2">
                        El desbalance afecta el calentamiento y la eficiencia. La desviación del voltaje nominal afecta el par y la corriente. Consulta la{' '}
                        <Link href="/documentation/technical-standards/voltage-derating-nema-mg1" className="text-primary underline hover:text-primary/80">
                          documentación de NEMA MG1
                        </Link>
                        {' '}y las recomendaciones del fabricante.
                      </p>
                      {/* Hidden Chart for PDF Generation */}
                       <div className="absolute -left-[9999px] top-0 w-[500px]" aria-hidden="true">
                           <div ref={chartRef} className="bg-white p-4">
                             <DeratingFactorChart />
                           </div>
                        </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-secondary/30 p-4 border-t">
           <div className="container text-center text-xs text-muted-foreground">
             © 2025, desarrollado por{' '}
             <a
               href="https://www.linkedin.com/in/melvin-padilla-3425106"
               target="_blank"
               rel="noopener noreferrer"
               className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
             >
               Ing. Melvin E. Padilla
             </a>
             .
           </div>
         </CardFooter>
      </Card>
    </>
  );
}

