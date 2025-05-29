
"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { Droplets, Search, AlertCircle, CheckCircle2, FileDown, User, Briefcase, FileText as FileTextIcon, Edit3, Layers } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ALL_BRANDS_DATA, type BrandData } from '@/lib/pump-data'; // Updated import
import type { PumpSeriesData, PumpModelData } from '@/lib/pump-data/pump-data.types';
import { PanelliPerformanceChart, type PanelliChartModelData } from '@/components/panelli-performance-chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const formSchema = z.object({
  brandName: z.string().min(1, "Seleccione una marca"),
  solicitante: z.string().optional(),
  proyecto: z.string().optional(),
  responsableCalculo: z.string().optional(),
  caudal: z.coerce
    .number({ invalid_type_error: 'Debe ser un número' })
    .positive('El caudal debe ser positivo'),
  presion: z.coerce
    .number({ invalid_type_error: 'Debe ser un número' })
    .positive('La presión debe ser positiva'),
  notasAdicionales: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SelectionResult {
  seriesName: string;
  modelName: string;
  hp: string;
  deliveredFlow: number;
  deliveredPressure: number;
  flowUnit: string;
  pressureUnit: string;
  brandName: string;
}

export function PumpSelector() {
  const [selectionResults, setSelectionResults] = React.useState<SelectionResult[]>([]);
  const [showResults, setShowResults] = React.useState(false);
  const [submittedCaudal, setSubmittedCaudal] = React.useState<number | null>(null);
  const [submittedPresion, setSubmittedPresion] = React.useState<number | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = React.useState(false);
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<HTMLDivElement>(null);
  const [pdfFormData, setPdfFormData] = React.useState<FormData | null>(null);
  const [selectedBrand, setSelectedBrand] = React.useState<BrandData | null>(
    ALL_BRANDS_DATA.length > 0 ? ALL_BRANDS_DATA[0] : null
  );

  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brandName: ALL_BRANDS_DATA.length > 0 ? ALL_BRANDS_DATA[0].brandName : "",
      solicitante: '',
      proyecto: '',
      responsableCalculo: '',
      caudal: undefined,
      presion: undefined,
      notasAdicionales: '',
    },
    mode: 'onBlur',
  });

  const watchedBrandName = form.watch("brandName");

  React.useEffect(() => {
    if (watchedBrandName) {
      const brand = ALL_BRANDS_DATA.find(b => b.brandName === watchedBrandName);
      setSelectedBrand(brand || null);
    } else if (ALL_BRANDS_DATA.length > 0 && !selectedBrand) {
        // If no brandName is set in form (e.g. on initial load and brandName is empty string)
        // and selectedBrand is not yet set, default to the first brand.
        form.setValue("brandName", ALL_BRANDS_DATA[0].brandName);
        setSelectedBrand(ALL_BRANDS_DATA[0]);
    }
  }, [watchedBrandName, form, selectedBrand]);


  const findSuitablePumps = (data: FormData) => {
    if (!selectedBrand) {
      toast({ title: "Error de Selección", description: "Por favor, seleccione una marca de bomba.", variant: "destructive" });
      return;
    }

    const requestedCaudal = data.caudal;
    const requestedPresion = data.presion;
    setSubmittedCaudal(requestedCaudal);
    setSubmittedPresion(requestedPresion);
    setPdfFormData(data);
    const suitablePumps: SelectionResult[] = [];

    selectedBrand.series.forEach((series) => {
      if (requestedCaudal >= series.minFlow && requestedCaudal <= series.maxFlow) {
        let targetFlowRateDisplayIndex = -1;
        
        for (let m = 0; m < series.flowRates.length; m++) {
          if (series.flowRates[m] >= requestedCaudal) {
            targetFlowRateDisplayIndex = m;
            break;
          }
        }

        if (targetFlowRateDisplayIndex === -1 && series.flowRates.length > 0) {
            targetFlowRateDisplayIndex = series.flowRates.length - 1;
        }
        
        if (targetFlowRateDisplayIndex === -1) {
          return;
        }

        for (let modelIndex = 0; modelIndex < series.models.length; modelIndex++) {
          const currentModel = series.models[modelIndex];
          if (currentModel.pressures.length > targetFlowRateDisplayIndex) {
            const pressureAtTargetFlow = currentModel.pressures[targetFlowRateDisplayIndex];
            if (requestedPresion <= pressureAtTargetFlow) {
              suitablePumps.push({
                seriesName: series.seriesName,
                modelName: currentModel.modelName,
                hp: currentModel.hp,
                deliveredFlow: series.flowRates[targetFlowRateDisplayIndex],
                deliveredPressure: pressureAtTargetFlow,
                flowUnit: series.flowRateUnit,
                pressureUnit: series.pressureUnit,
                brandName: selectedBrand.brandName,
              });
              break; 
            }
          }
        }
      } 
    });

    setSelectionResults(suitablePumps);
    setShowResults(true);

    if (suitablePumps.length > 0) {
        toast({
          title: "Búsqueda Completada",
          description: `Se encontraron ${suitablePumps.length} modelo(s) adecuado(s) para la marca ${selectedBrand.brandName}.`,
          variant: "default",
        });
    } else {
        toast({
          title: "Búsqueda Completada",
          description: `No se encontraron modelos de la marca ${selectedBrand.brandName} que cumplan exactamente los criterios.`,
          variant: "default", 
        });
    }

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const onSubmit: SubmitHandler<FormData> = (data) => {
    findSuitablePumps(data);
  };

  const prepareChartDataForPdf = (): PanelliChartModelData[] => {
    if (!selectedBrand) return [];
    return selectionResults.map(result => {
      const seriesData = selectedBrand.series.find(s => s.seriesName === result.seriesName);
      const modelData = seriesData?.models.find(m => m.modelName === result.modelName);

      if (!seriesData || !modelData) {
        return {
          name: result.modelName,
          hp: result.hp,
          curvePoints: [],
          actualOperatingPoint: { flow: result.deliveredFlow, pressure: result.deliveredPressure },
          flowUnit: result.flowUnit,
          pressureUnit: result.pressureUnit,
        };
      }

      const curvePoints = seriesData.flowRates.map((flow, index) => ({
        flow: flow,
        pressure: modelData.pressures[index] !== undefined ? modelData.pressures[index] : 0,
      }));

      return {
        name: modelData.modelName,
        hp: modelData.hp,
        curvePoints: curvePoints,
        actualOperatingPoint: { flow: result.deliveredFlow, pressure: result.deliveredPressure },
        flowUnit: seriesData.flowRateUnit,
        pressureUnit: seriesData.pressureUnit,
      };
    });
  };

  const generatePDF = async () => {
    if (!selectionResults.length || submittedCaudal === null || submittedPresion === null || !pdfFormData || !selectedBrand) {
      toast({
        title: "Error",
        description: "No hay resultados de selección o datos de entrada para generar el PDF.",
        variant: "destructive",
      });
      return;
    }
    setIsLoadingPdf(true);
    toast({ title: "Generando PDF...", description: "Por favor espera." });

    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 15;
      const footerContentHeight = 20;
      const contentWidth = pageWidth - margin * 2;
      let currentY = margin;

      const addFooter = (docInstance: jsPDF) => {
        const pageCount = docInstance.internal.getNumberOfPages();
        const disclaimerText = "Las curvas mostradas en este reporte son referenciales, el modelo usado es discreto, por lo tanto para mayor detalle o calculos de ingenieria debera referise a las curvas originales del producto. Este reporte debe ser utilizado como aproximacion al calculo real y debera ser supervisado por un profesional en el area con experiencia suficiente para garantizar el calculo adecuado.";
        const disclaimerFontSize = 6;
        const copyrightFontSize = 7;
        
        for (let i = 1; i <= pageCount; i++) {
          docInstance.setPage(i);
          docInstance.setFontSize(disclaimerFontSize);
          docInstance.setFont(undefined, 'italic');
          docInstance.setTextColor(120, 120, 120);
          const disclaimerLines = docInstance.splitTextToSize(disclaimerText, contentWidth);
          const disclaimerHeight = disclaimerLines.length * (disclaimerFontSize * 0.352778 * 1.2);
          let disclaimerY = pageHeight - margin - disclaimerHeight - (copyrightFontSize * 0.352778 * 1.2) - 2;
          docInstance.text(disclaimerLines, margin, disclaimerY);
          docInstance.setFontSize(copyrightFontSize);
          docInstance.setFont(undefined, 'normal');
          docInstance.setTextColor(150);
          const copyrightFooterY = pageHeight - margin + 5 - (copyrightFontSize * 0.352778);
          const copyrightText = "© 2025, desarrollado por ";
          docInstance.text(copyrightText, margin, copyrightFooterY, { align: 'left' });
          const linkText = "Ing. Melvin E. Padilla";
          const linkUrl = "https://www.linkedin.com/in/melvin-padilla-3425106";
          const linkTextWidth = docInstance.getTextWidth(linkText);
          const copyrightTextWidth = docInstance.getTextWidth(copyrightText);
          const linkX = margin + copyrightTextWidth;
          docInstance.setTextColor(Number('0x1A'), Number('0x23'), Number('0x7E'));
          docInstance.textWithLink(linkText, linkX, copyrightFooterY, { url: linkUrl });
          docInstance.setDrawColor(Number('0x1A'), Number('0x23'), Number('0x7E'));
          docInstance.line(linkX, copyrightFooterY + 0.5, linkX + linkTextWidth, copyrightFooterY + 0.5);
          const periodText = ".";
          const periodX = linkX + linkTextWidth;
          docInstance.setTextColor(150);
          docInstance.text(periodText, periodX, copyrightFooterY, { align: 'left' });
          const pageNumText = `Página ${i} de ${pageCount}`;
          docInstance.text(pageNumText, pageWidth - margin, copyrightFooterY, { align: 'right' });
        }
        docInstance.setTextColor(0);
        docInstance.setFont(undefined, 'normal');
      };

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(Number('0x1A'), Number('0x23'), Number('0x7E'));
      doc.text(`Reporte de Selección de Bombas - Marca ${selectedBrand.brandName}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 7;
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);

      doc.setFontSize(8);
      const reportDate = format(new Date(), 'dd/MM/yyyy HH:mm');
      doc.text(`Fecha del Reporte: ${reportDate}`, margin, currentY);
      currentY += 6;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Detalles de la Solicitud', margin, currentY);
      currentY += 4;
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      const solicitudDetails = [
        ['Marca Seleccionada:', selectedBrand.brandName],
        ['Solicitante:', pdfFormData.solicitante || 'N/D'],
        ['Proyecto:', pdfFormData.proyecto || 'N/D'],
        ['Responsable del Cálculo:', pdfFormData.responsableCalculo || 'N/D'],
      ];
      autoTable(doc, {
        startY: currentY,
        head: [['Concepto', 'Información']],
        body: solicitudDetails,
        theme: 'grid', styles: { fontSize: 8, cellPadding: 1.2 },
        headStyles: { fillColor: [245, 245, 245], textColor: [50, 50, 50], fontStyle: 'bold', fontSize: 8 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: contentWidth - 60 } },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => { currentY = data.cursor?.y ?? currentY; }
      });
      currentY = (doc as any).lastAutoTable.finalY + 6;

      if (currentY + 20 > pageHeight - margin - footerContentHeight) { doc.addPage(); currentY = margin; }
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Punto de Trabajo Solicitado', margin, currentY);
      currentY += 4;
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      autoTable(doc, {
        startY: currentY,
        head: [['Parámetro', 'Valor']],
        body: [
          ['Caudal Solicitado:', `${submittedCaudal} ${selectionResults[0]?.flowUnit || selectedBrand.defaultFlowUnit}`],
          ['Presión Solicitada:', `${submittedPresion} ${selectionResults[0]?.pressureUnit || selectedBrand.defaultPressureUnit}`],
        ],
        theme: 'grid', styles: { fontSize: 8, cellPadding: 1.2 },
        headStyles: { fillColor: [245, 245, 245], textColor: [50, 50, 50], fontStyle: 'bold', fontSize: 8 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: contentWidth - 60 } },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => { currentY = data.cursor?.y ?? currentY; }
      });
      currentY = (doc as any).lastAutoTable.finalY + 6;

      if (selectionResults.length > 0) {
        if (currentY + 25 > pageHeight - margin - footerContentHeight) { doc.addPage(); currentY = margin; }
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Modelos de Bomba Seleccionados', margin, currentY);
        currentY += 4;
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        autoTable(doc, {
          startY: currentY,
          head: [['Serie', 'Modelo', 'HP', 'Caudal Entregado', 'Presión Entregada']],
          body: selectionResults.map(r => [
            r.seriesName,
            r.modelName,
            r.hp,
            `${r.deliveredFlow.toFixed(2)} ${r.flowUnit}`,
            `${r.deliveredPressure} ${r.pressureUnit}`
          ]),
          theme: 'grid', styles: { fontSize: 8, cellPadding: 1.2 },
          headStyles: { fillColor: [245, 245, 245], textColor: [50, 50, 50], fontStyle: 'bold', fontSize: 8 },
          margin: { left: margin, right: margin },
          didDrawPage: (data) => { currentY = data.cursor?.y ?? currentY; }
        });
        currentY = (doc as any).lastAutoTable.finalY + 6;

        const chartElement = chartRef.current;
        const chartDataForPdf = prepareChartDataForPdf();
        if (chartElement && chartDataForPdf.length > 0 && submittedCaudal && submittedPresion) {
           const chartTitleY = currentY;
           if (chartTitleY + 75 > pageHeight - margin - footerContentHeight) { doc.addPage(); currentY = margin; } 
           doc.setFontSize(10); doc.setFont(undefined, 'bold');
           doc.text(`Curvas de Rendimiento de Bombas Seleccionadas (${selectedBrand.brandName})`, margin, currentY);
           currentY += 4;
           doc.setFontSize(8); doc.setFont(undefined, 'normal');

           try {
             await new Promise(resolve => setTimeout(resolve, 300)); 
             const canvas = await html2canvas(chartElement, { scale: 1.5, backgroundColor: '#ffffff', logging: false, useCORS: true });
             const imgData = canvas.toDataURL('image/png');
             const imgProps = doc.getImageProperties(imgData);
             const pdfChartWidth = contentWidth; 
             const pdfChartHeight = (imgProps.height * pdfChartWidth) / imgProps.width;
             
             if (currentY + pdfChartHeight > pageHeight - margin - footerContentHeight) {
                 doc.addPage(); 
                 currentY = margin;
                 doc.setFontSize(10); doc.setFont(undefined, 'bold'); 
                 doc.text(`Curvas de Rendimiento de Bombas Seleccionadas (${selectedBrand.brandName})`, margin, currentY); currentY += 4;
                 doc.setFontSize(8); doc.setFont(undefined, 'normal');
             }
             doc.addImage(imgData, 'PNG', margin, currentY, pdfChartWidth, pdfChartHeight);
             currentY += pdfChartHeight + 4;
           } catch (error) {
             console.error("Error generando imagen del gráfico:", error);
             if (currentY + 8 > pageHeight - margin - footerContentHeight) { doc.addPage(); currentY = margin; }
             doc.setTextColor(255, 0, 0); 
             doc.setFontSize(8);
             doc.text('Error generando imagen del gráfico.', margin, currentY); currentY += 6;
             doc.setTextColor(0, 0, 0);
             toast({ title: "Error de Gráfico", description: "No se pudo generar la imagen del gráfico para el PDF.", variant: "destructive" });
           }
        }

      } else {
        if (currentY + 10 > pageHeight - margin - footerContentHeight) { doc.addPage(); currentY = margin; }
        doc.setFontSize(8);
        doc.text(`No se encontraron modelos de bomba de la marca ${selectedBrand.brandName} adecuados para los criterios especificados.`, margin, currentY);
        currentY += 6;
      }

      if (pdfFormData.notasAdicionales && pdfFormData.notasAdicionales.trim() !== '') {
        if (currentY + 20 > pageHeight - margin - footerContentHeight) { doc.addPage(); currentY = margin; }
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Notas Adicionales', margin, currentY);
        currentY += 4;
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        const notesLines = doc.splitTextToSize(pdfFormData.notasAdicionales, contentWidth);
        doc.text(notesLines, margin, currentY);
        currentY += (notesLines.length * 3.5) + 4;
      }

      addFooter(doc);
      doc.save(`Reporte_Seleccion_Bomba_${selectedBrand.brandName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
      toast({ title: "PDF Generado", description: "El reporte se ha descargado exitosamente." });

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
      <Card className="w-full max-w-xl shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-2xl font-bold flex items-center">
            <Droplets className="mr-2 h-7 w-7" />
            Selector Simple de Bombas Sumergibles
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Seleccione la marca e introduce el caudal y la presión requeridos para encontrar modelos de bombas adecuados.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-secondary/30">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="bg-card shadow-md rounded-md">
                <CardHeader>
                  <CardTitle className="text-lg text-primary flex items-center"><FileTextIcon className="mr-2 h-5 w-5"/>Detalles de la Solicitud</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="brandName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 flex items-center"><Layers className="mr-1 h-4 w-4"/>Marca de la Bomba</FormLabel>
                        <Select
                            onValueChange={(value) => {
                                field.onChange(value);
                                // No es necesario llamar a setSelectedBrand aquí si el useEffect ya lo maneja.
                            }}
                            defaultValue={field.value} // Asegúrate que defaultValue está correctamente asignado
                        >
                          <FormControl>
                            <SelectTrigger className="rounded-md">
                              <SelectValue placeholder="Seleccione una marca" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ALL_BRANDS_DATA.map((brand) => (
                              <SelectItem key={brand.brandName} value={brand.brandName}>
                                {brand.brandName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="solicitante"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 flex items-center"><User className="mr-1 h-4 w-4"/>Solicitante</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre de quien solicita" {...field} className="rounded-md" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="proyecto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 flex items-center"><Briefcase className="mr-1 h-4 w-4"/>Proyecto</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del proyecto" {...field} className="rounded-md" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responsableCalculo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 flex items-center"><Edit3 className="mr-1 h-4 w-4"/>Responsable del Cálculo</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del responsable" {...field} className="rounded-md" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="bg-card shadow-md rounded-md">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">Punto de Trabajo Requerido</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="caudal"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80">Caudal ({selectedBrand?.defaultFlowUnit || 'unidad'})</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder={`Ej: 1.5`}
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
                    name="presion"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80">Presión ({selectedBrand?.defaultPressureUnit || 'unidad'})</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="Ej: 50"
                            {...field}
                            className={cn("rounded-md", fieldState.error && "border-destructive focus-visible:ring-destructive")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card className="bg-card shadow-md rounded-md">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">Notas Adicionales</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notasAdicionales"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea placeholder="Ingrese cualquier nota o comentario adicional aquí..." {...field} className="rounded-md" rows={3}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex flex-col md:flex-row justify-end space-y-2 md:space-y-0 md:space-x-4 pt-4">
                <Button
                  type="button"
                  onClick={generatePDF}
                  disabled={!selectionResults.length || isLoadingPdf || !submittedCaudal || !submittedPresion || !pdfFormData}
                  variant="outline"
                  className="rounded-md border-primary text-primary hover:bg-primary/10"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  {isLoadingPdf ? 'Generando PDF...' : 'Descargar Reporte PDF'}
                </Button>
                <Button type="submit" variant="default" className="bg-accent hover:bg-accent/90 rounded-md text-accent-foreground" disabled={!selectedBrand}>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar Modelos
                </Button>
              </div>
            </form>
          </Form>

           {showResults && selectionResults.length > 0 && submittedCaudal && submittedPresion && (
             <div ref={chartRef} className="absolute -left-[9999px] top-0 w-[800px] h-[400px] bg-white p-1" aria-hidden="true">
                <PanelliPerformanceChart
                  modelsData={prepareChartDataForPdf()}
                  requestedPoint={{ flow: submittedCaudal, pressure: submittedPresion }}
                />
             </div>
           )}

          <div ref={resultsRef}>
            {showResults && (
              <>
                <Separator className="my-6 bg-border" />
                <Card className="bg-card shadow-md rounded-md">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary">Resultados de la Selección ({selectedBrand?.brandName})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectionResults.length > 0 ? (
                      selectionResults.map((result, index) => (
                        <Card key={index} className="p-4 bg-background border-green-500 shadow-sm">
                          <div className="flex items-center text-green-700 mb-2">
                            <CheckCircle2 className="mr-2 h-5 w-5"/>
                            <h3 className="font-semibold text-md">
                              Modelo Seleccionado (Serie {result.seriesName}): {result.modelName}
                            </h3>
                          </div>
                          <p className="text-sm text-foreground/90">
                            Potencia: <span className="font-medium">{result.hp} HP</span>
                          </p>
                          <p className="text-sm text-foreground/90">
                            Este modelo entrega aproximadamente:
                            <span className="font-medium"> {result.deliveredFlow.toFixed(2)} {result.flowUnit}</span> @
                            <span className="font-medium"> {result.deliveredPressure} {result.pressureUnit}</span>.
                          </p>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-4">
                        <AlertCircle className="mx-auto h-8 w-8 mb-2 text-amber-500" />
                        No se encontraron modelos que cumplan con los criterios especificados para la marca {selectedBrand?.brandName}.
                      </div>
                    )}
                  </CardContent>
                </Card>
                {selectionResults.length > 0 && submittedCaudal && submittedPresion && (
                  <Card className="mt-6 bg-card shadow-md rounded-md">
                    <CardHeader>
                      <CardTitle className="text-lg text-primary">Curvas de Rendimiento ({selectedBrand?.brandName})</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <PanelliPerformanceChart
                        modelsData={prepareChartDataForPdf()}
                        requestedPoint={{ flow: submittedCaudal, pressure: submittedPresion }}
                      />
                    </CardContent>
                  </Card>
                )}
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
