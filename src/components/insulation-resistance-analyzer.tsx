// @ts-nocheck - TODO: fix typings
"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { Calculator, FileText, Thermometer, FileDown, AlertCircle, Play, RefreshCcw, Link as LinkIcon } from 'lucide-react'; // Added Play, RefreshCcw, removed CalendarClock
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
import { Separator } from '@/components/ui/separator';
import { ResistanceChart } from '@/components/resistance-chart';
import { IndexResults } from '@/components/index-results';
import { IndexReferenceTable } from '@/components/index-reference-table';
import { Toaster } from '@/components/ui/toaster'; 
import { useToast } from '@/hooks/use-toast'; 
import { cn } from '@/lib/utils'; 

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
       acc[`t${point.value}`] = z.union([
          z.literal(''), 
           z.coerce 
             .number({ invalid_type_error: 'Debe ser un número' })
             .positive('Debe ser positivo')
             .gt(0, 'Debe ser mayor que 0')
       ]).refine(val => val !== '', { message: 'Lectura requerida' }); 
      return acc;
    }, {} as Record<string, z.ZodUnion<[z.ZodLiteral<''>, z.ZodNumber]>>) 
  ),
});


type FormData = z.infer<typeof formSchema>;

type ResistanceDataPoint = { time: number; resistance: number };

// Helper: Returns condition based on value and type in Spanish
function getCondition(value: number | typeof Infinity, type: 'PI' | 'DAR'): string {
   if (!isFinite(value)) {
       return 'Excelente'; 
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
    return 'N/D'; 
}


export function InsulationResistanceAnalyzer() {
  const [polarizationIndex, setPolarizationIndex] = React.useState<
    number | null | typeof Infinity 
  >(null);
  const [dielectricAbsorptionRatio, setDielectricAbsorptionRatio] =
    React.useState<number | null | typeof Infinity>(null); 
  const [chartData, setChartData] = React.useState<ResistanceDataPoint[]>([]);
  const [formDataForPdf, setFormDataForPdf] = React.useState<FormData | null>(null); 
  const [isLoadingPdf, setIsLoadingPdf] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false); 
  const resultsRef = React.useRef<HTMLDivElement>(null); 
  const innerChartRef = React.useRef<HTMLDivElement>(null); 

  const [stopwatchTime, setStopwatchTime] = React.useState<number>(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = React.useState<boolean>(false);

  const { toast } = useToast(); 

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      testerName: '',
      motorId: '',
      motorSerial: '',
      readings: timePoints.reduce((acc, point) => {
        acc[`t${point.value}`] = ''; 
        return acc;
      }, {} as any), 
    },
     mode: 'onBlur', 
  });

  React.useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (isStopwatchRunning) {
      intervalId = setInterval(() => {
        setStopwatchTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      if (intervalId) {
        clearInterval(intervalId);
      }
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isStopwatchRunning]);

  const formatStopwatchTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleStopwatchToggle = () => {
    if (isStopwatchRunning) {
      // Reset and stop
      setIsStopwatchRunning(false);
      setStopwatchTime(0);
    } else {
      // Start
      setStopwatchTime(0); 
      setIsStopwatchRunning(true);
    }
  };


  const calculateIndices = (readings: FormData['readings']) => {
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
        pi = null; 
      }
    }
    setPolarizationIndex(pi);


    if (!isNaN(r30sec) && !isNaN(r1min)) {
        if (r30sec > 0) {
             dar = parseFloat((r1min / r30sec).toFixed(2));
        } else if (r30sec === 0 && r1min > 0) {
            dar = Infinity;
        } else if (r30sec === 0 && r1min === 0) {
             dar = null; 
        }
    }
    setDielectricAbsorptionRatio(dar);


    const data: ResistanceDataPoint[] = timePoints
       .map((point) => {
            const resistanceValue = Number(readings[`t${point.value}`]);
            return {
                time: point.value / 60, 
                resistance: isNaN(resistanceValue) ? 0 : resistanceValue, 
            };
       })
      .filter(point => !isNaN(point.resistance)); 

    setChartData(data);
    setShowResults(true); 

    toast({
      title: "Cálculo Exitoso",
      description: "Los índices PI y DAR se han calculado.",
      variant: "default", 
    });

    setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const onSubmit: SubmitHandler<FormData> = (data) => {
    console.log('Formulario Enviado:', data);
    setFormDataForPdf(data); 
    calculateIndices(data.readings);
  };


   const generatePDF = async () => {
     if (!formDataForPdf) {
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
         const footerHeight = 15; 
         const contentWidth = pageWidth - margin * 2;
         let currentY = margin; 

        const addFooter = (docInstance: jsPDF) => {
            const pageCount = docInstance.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
            docInstance.setPage(i);
            docInstance.setFontSize(7); 
            docInstance.setTextColor(150);
            const footerY = pageHeight - margin + 5; 

            const copyrightText = "© 2025, desarrollado por ";
            docInstance.text(copyrightText, margin, footerY, { align: 'left' });

            const linkText = "Ing. Melvin E. Padilla";
            const linkUrl = "https://www.linkedin.com/in/melvin-padilla-3425106";
            const linkTextWidth = docInstance.getTextWidth(linkText);
            const copyrightTextWidth = docInstance.getTextWidth(copyrightText);
            const linkX = margin + copyrightTextWidth;

            docInstance.setTextColor(Number('0x1A'), Number('0x23'), Number('0x7E')); 
            docInstance.textWithLink(linkText, linkX, footerY, { url: linkUrl });
            docInstance.setDrawColor(Number('0x1A'), Number('0x23'), Number('0x7E')); 
            docInstance.line(linkX, footerY + 0.5, linkX + linkTextWidth, footerY + 0.5); 

            const periodText = ".";
            const periodX = linkX + linkTextWidth;
            docInstance.setTextColor(150); 
            docInstance.text(periodText, periodX, footerY, { align: 'left' });

            const pageNumText = `Página ${i} de ${pageCount}`;
            docInstance.text(pageNumText, pageWidth - margin, footerY, { align: 'right' });
            }
            docInstance.setTextColor(0); 
        };


         doc.setFontSize(14); 
         doc.setFont(undefined, 'bold');
         doc.setTextColor(Number('0x1A'), Number('0x23'), Number('0x7E')); 
         doc.text('Reporte de Resistencia de Aislamiento', pageWidth / 2, currentY, { align: 'center' });
         doc.setFont(undefined, 'normal');
         doc.setTextColor(0, 0, 0); 
         currentY += 7; 

         doc.setFontSize(9); 
         doc.setFont(undefined, 'bold');
         doc.text('Detalles de la Prueba', margin, currentY);
         currentY += 5; 
         doc.setFontSize(8); 
         doc.setFont(undefined, 'normal'); 

         const testDate = format(new Date(), 'dd/MM/yyyy HH:mm');

         autoTable(doc, {
           startY: currentY,
           head: [['Parámetro', 'Valor']],
           body: [
             ['Nombre del Técnico:', formDataForPdf.testerName],
             ['ID del Motor:', formDataForPdf.motorId],
             ['Nro. de Serie del Motor:', formDataForPdf.motorSerial],
             ['Fecha de la Prueba:', testDate], 
           ],
           theme: 'grid',
           styles: { fontSize: 7, cellPadding: 1.2 }, 
           headStyles: { fillColor: [245, 245, 245], textColor: [50, 50, 50], fontStyle: 'bold', fontSize: 7.5 }, 
           columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 }, 1: { cellWidth: contentWidth - 45} }, 
           margin: { left: margin, right: margin },
           didDrawPage: (data) => { currentY = data.cursor?.y ?? currentY; }
         });
         currentY = (doc as any).lastAutoTable.finalY + 6; 


         if (currentY + 45 > pageHeight - margin - footerHeight) { doc.addPage(); currentY = margin; } 
         doc.setFontSize(9); 
         doc.setFont(undefined, 'bold');
         doc.text('Lecturas de Resistencia de Aislamiento (G-OHM)', margin, currentY); 
         currentY += 5; 
         doc.setFontSize(7); 
         doc.setFont(undefined, 'normal'); 

         const readingsBody4Col: (string | number)[][] = [];
         const numRows = Math.ceil(timePoints.length / 2); 

         for (let i = 0; i < numRows; i++) {
           const row: (string | number)[] = [];
           const point1Index = i;
            if (point1Index < 6) { 
               const point1 = timePoints[point1Index];
               if (point1) {
                 row.push(point1.label);
                 row.push(formDataForPdf.readings[`t${point1.value}`] ?? 'N/D');
               } else {
                 row.push(''); 
                 row.push('');
               }
           } else {
                row.push(''); 
                row.push('');
           }


           const point2Index = i + 6; 
           const point2 = timePoints[point2Index];
           if (point2) {
              row.push(point2.label);
              row.push(formDataForPdf.readings[`t${point2.value}`] ?? 'N/D');
           } else {
              row.push(''); 
              row.push('');
           }
           readingsBody4Col.push(row);
         }

         autoTable(doc, {
           startY: currentY,
           head: [['Tiempo', 'Resistencia (G-OHM)', 'Tiempo', 'Resistencia (G-OHM)']], 
           body: readingsBody4Col,
           theme: 'grid',
           styles: { fontSize: 7, cellPadding: 1, halign: 'center' }, 
           headStyles: { fillColor: [245, 245, 245], textColor: [50, 50, 50], fontStyle: 'bold', halign: 'center', fontSize: 7 }, 
           columnStyles: {
             0: { cellWidth: 'auto', halign: 'left' },
             1: { cellWidth: 'auto', halign: 'center' }, 
             2: { cellWidth: 'auto', halign: 'left' },
             3: { cellWidth: 'auto', halign: 'center' }, 
           },
           margin: { left: margin, right: margin },
           didDrawPage: (data) => { currentY = data.cursor?.y ?? currentY; }
         });
         currentY = (doc as any).lastAutoTable.finalY + 6; 


        const resultsStartY = currentY;
        const leftColX = margin;
        const rightColX = margin + contentWidth / 2 + 3; 
        const colWidth = contentWidth / 2 - 3; 
        let leftColEndY = resultsStartY;
        let rightColEndY = resultsStartY;

        const chartElement = innerChartRef.current;
        if (chartElement && chartData.length > 0) {
            const chartTitleY = currentY;
            if (chartTitleY + 55 > pageHeight - margin - footerHeight) { doc.addPage(); currentY = margin; } 
            doc.setFontSize(9); doc.setFont(undefined, 'bold'); 
            doc.text('Gráfico Resistencia vs. Tiempo', leftColX, currentY);
            currentY += 4; 
            doc.setFontSize(7); doc.setFont(undefined, 'normal'); 

            try {
                await new Promise(resolve => setTimeout(resolve, 300));
                const canvas = await html2canvas(chartElement, { scale: 1.6, backgroundColor: '#ffffff', logging: false, useCORS: true });
                const imgData = canvas.toDataURL('image/png');
                const imgProps = doc.getImageProperties(imgData);
                const pdfChartWidth = colWidth; 
                const pdfChartHeight = (imgProps.height * pdfChartWidth) / imgProps.width;

                if (currentY + pdfChartHeight > pageHeight - margin - footerHeight) {
                  doc.addPage(); 
                  currentY = margin; 
                  doc.setFontSize(9); doc.setFont(undefined, 'bold'); 
                  doc.text('Gráfico Resistencia vs. Tiempo', leftColX, currentY); currentY += 4; 
                  doc.setFontSize(7); doc.setFont(undefined, 'normal'); 
                }

                doc.addImage(imgData, 'PNG', leftColX, currentY, pdfChartWidth, pdfChartHeight);
                currentY += pdfChartHeight + 2; 
            } catch (error) {
                console.error("Error generando imagen del gráfico:", error);
                 if (currentY + 8 > pageHeight - margin - footerHeight) { doc.addPage(); currentY = margin; }
                 doc.setTextColor(255, 0, 0); 
                 doc.setFontSize(7); 
                 doc.text('Error generando imagen del gráfico.', leftColX, currentY);
                 currentY += 6; 
                 doc.setTextColor(0, 0, 0); 
                 toast({ title: "Error de Gráfico", description: "No se pudo generar la imagen del gráfico para el PDF.", variant: "destructive" });
            }

            const notesStartY = currentY;
            if (notesStartY + 40 > pageHeight - margin - footerHeight) { 
                doc.addPage();
                currentY = margin; 
            } else {
                 currentY = notesStartY; 
            }

            doc.setFontSize(7); doc.setFont(undefined, 'italic'); doc.setTextColor(100, 100, 100); 
            const boxPadding = 2; 
            let textY = currentY + boxPadding + 2.5; 

            const drawStyledText = (textParts: { text: string; bold?: boolean }[], x: number, y: number, maxWidth: number) => {
                let currentX = x;
                let currentLineY = y;
                const lines: { text: string, bold: boolean, x: number, y: number }[][] = [];
                let currentLine: { text: string, bold: boolean, x: number, y: number }[] = [];

                doc.setFont(undefined, 'normal'); 

                textParts.forEach(part => {
                    doc.setFont(undefined, part.bold ? 'bold' : 'normal');
                    const words = part.text.split(' ');
                    words.forEach(word => {
                        const wordWidth = doc.getTextWidth(word + ' ');
                        if (currentX + wordWidth > x + maxWidth) {
                            lines.push(currentLine);
                            currentLine = [];
                            currentX = x;
                            currentLineY += 3; 
                        }
                         currentLine.push({ text: word + ' ', bold: !!part.bold, x: currentX, y: currentLineY });
                         currentX += wordWidth;
                    });
                });
                 lines.push(currentLine); 


                 lines.forEach(line => {
                    line.forEach(segment => {
                        doc.setFont(undefined, segment.bold ? 'bold' : 'italic'); 
                        doc.text(segment.text, segment.x, segment.y);
                    });
                 });

                return currentLineY + 3; 
            };


            const note1Parts = [
                { text: "El Índice de Polarización (PI) y el Ratio de Absorción Dieléctrica (DAR) evalúan la " },
                { text: "calidad del aislamiento eléctrico", bold: true },
                { text: ". El PI mide el aumento de la resistencia con el tiempo, mientras que el DAR compara la absorción inicial de corriente con la posterior. " },
                { text: "Valores altos indican un aislamiento en buen estado y seco", bold: true },
                { text: ", crucial para prevenir fallas eléctricas." }
            ];
            textY = drawStyledText(note1Parts, leftColX + boxPadding, textY, colWidth - boxPadding * 2);
            textY += 1.5; 


            const note2Parts = [
                { text: "Para aislamientos con una resistencia significativamente elevada, los valores de PI y DAR pueden ser cercanos a 1. En estos casos, " },
                { text: "la alta resistencia constante es el principal indicador de un aislamiento en buen estado", bold: true },
                { text: "." }
            ];

            textY = drawStyledText(note2Parts, leftColX + boxPadding, textY, colWidth - boxPadding * 2);


            const boxHeight = textY - (currentY + boxPadding + 2.5) + boxPadding; 
            doc.setDrawColor(Number('0xD1'), Number('0xD5'), Number('0xDB')); 
            doc.roundedRect(leftColX, currentY, colWidth, boxHeight + boxPadding * 2, 1.5, 1.5, 'S'); 
            currentY = currentY + boxHeight + boxPadding * 2 + 2.5; 
            doc.setFont(undefined, 'normal'); doc.setTextColor(0, 0, 0); 
            leftColEndY = currentY;


        } else {
            if (currentY + 8 > pageHeight - margin - footerHeight) { doc.addPage(); currentY = margin; }
            doc.setFontSize(7); 
            doc.text('Gráfico no disponible.', leftColX, currentY); currentY += 6; 
            leftColEndY = currentY;
        }


        currentY = resultsStartY; 

        if (polarizationIndex !== null || dielectricAbsorptionRatio !== null) {
             const indicesCardStartY = currentY;
             if (currentY + 25 > pageHeight - margin - footerHeight) { 
                 doc.addPage(); currentY = margin;
             }

             currentY += 1.5; 
             doc.setFontSize(9); doc.setFont(undefined, 'bold'); 
             doc.text('Índices Calculados', rightColX + 2, currentY + 2.5); currentY += 5; 
             doc.setFontSize(7); doc.setFont(undefined, 'normal'); 

             const piValue = polarizationIndex !== null ? (isFinite(polarizationIndex) ? polarizationIndex.toFixed(2) : '∞') : 'N/D';
             const piCondition = polarizationIndex !== null ? getCondition(polarizationIndex, 'PI') : 'N/D';
             const darValue = dielectricAbsorptionRatio !== null ? (isFinite(dielectricAbsorptionRatio) ? dielectricAbsorptionRatio.toFixed(2) : '∞') : 'N/D';
             const darCondition = dielectricAbsorptionRatio !== null ? getCondition(dielectricAbsorptionRatio, 'DAR') : 'N/D';

             const drawIndexRow = (label: string, value: string, condition: string, y: number): number => {
                const labelX = rightColX + 2;
                const valueX = rightColX + colWidth - 24; 
                const badgeX = rightColX + colWidth - 22; 
                const badgeWidth = 20; const badgeHeight = 4.5; 
                doc.setFontSize(7); doc.setFont(undefined, 'medium'); 
                doc.text(label, labelX, y + 2.5); 
                doc.setFont(undefined, 'bold');
                doc.text(value, valueX, y + 2.5, { align: 'right' }); 

                let fillColor: [number, number, number] = [220, 220, 220]; 
                let textColor: [number, number, number] = [50, 50, 50]; 
                switch (condition.toLowerCase()) {
                   case 'excelente': fillColor = [0, 150, 136]; textColor = [255, 255, 255]; break; 
                   case 'bueno': fillColor = [26, 35, 126]; textColor = [255, 255, 255]; break; 
                   case 'cuestionable': fillColor = [224, 224, 224]; textColor = [50, 50, 50]; break; 
                   case 'malo': case 'peligroso': fillColor = [220, 53, 69]; textColor = [255, 255, 255]; break; 
                }
                doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]); doc.setDrawColor(fillColor[0], fillColor[1], fillColor[2]); 
                doc.roundedRect(badgeX, y, badgeWidth, badgeHeight, 1.2, 1.2, 'FD'); 
                doc.setFontSize(6.5); doc.setFont(undefined, 'semibold'); doc.setTextColor(textColor[0], textColor[1], textColor[2]); 
                doc.text(condition, badgeX + badgeWidth / 2, y + badgeHeight / 2 + 0.3, { align: 'center', baseline: 'middle' }); 
                doc.setTextColor(0, 0, 0); 
                return y + badgeHeight + 0.8; 
             }

             const startYPi = currentY;
             currentY = drawIndexRow('Índice de Polarización (PI):', piValue, piCondition, currentY);
             currentY = drawIndexRow('Ratio Absorción Dieléctrica (DAR):', darValue, darCondition, currentY);
             const indicesCardEndY = currentY + 0.2; 

             doc.setDrawColor(Number('0xD1'), Number('0xD5'), Number('0xDB')); 
             doc.roundedRect(rightColX - 1, indicesCardStartY - 1, colWidth + 2, indicesCardEndY - indicesCardStartY + 1, 1.5, 1.5, 'S'); 

             currentY = indicesCardEndY + 2.5; 
        }
      

        const refCardStartY = currentY;
        if (currentY + 50 > pageHeight - margin - footerHeight) { 
            doc.addPage(); currentY = margin;
        }

        const refBorderStartY = currentY; 
        currentY += 1; 
        doc.setFontSize(9); doc.setFont(undefined, 'bold'); 
        doc.text('Valores de Referencia (IEEE Std 43-2013)', rightColX + 2, currentY + 2.5); currentY += 6; 
        doc.setFontSize(7); doc.setFont(undefined, 'normal'); 

        const tableConfig = {
          theme: 'grid' as const,
          styles: { fontSize: 6.5, cellPadding: 0.8, halign: 'left' }, 
          headStyles: { fillColor: [245, 245, 245], textColor: [50, 50, 50], fontStyle: 'bold', halign: 'center', fontSize: 7 }, 
          tableWidth: colWidth,
          margin: { left: rightColX },
          didDrawPage: (data) => { currentY = data.cursor?.y ?? currentY; } 
        };

        autoTable(doc, {
          startY: currentY, head: [['Valor PI', 'Condición']], body: [['< 1.0', 'Peligroso'], ['1.0 - 2.0', 'Cuestionable'], ['2.0 - 4.0', 'Bueno'], ['> 4.0', 'Excelente']], ...tableConfig, columnStyles: { 0: { halign: 'center' }, 1: { halign: 'left' } },
          didDrawTable: (data) => {
            doc.setFontSize(6.5); doc.setTextColor(100, 100, 100); 
            doc.text("Referencia Índice de Polarización (PI)", rightColX + colWidth/2 , data.cursor.y + 2.5, { align: 'center' }); 
            currentY = data.cursor.y + 5; 
          },
        });

        currentY += 2.5; 

        if (currentY + 25 > pageHeight - margin - footerHeight) { 
             doc.addPage(); currentY = margin;
        }
        autoTable(doc, {
          startY: currentY, head: [['Valor DAR', 'Condición']], body: [['< 1.0', 'Malo'], ['1.0 - 1.25', 'Cuestionable'], ['1.25 - 1.6', 'Bueno'], ['> 1.6', 'Excelente']], ...tableConfig, columnStyles: { 0: { halign: 'center' }, 1: { halign: 'left' } },
           didDrawTable: (data) => {
            doc.setFontSize(6.5); doc.setTextColor(100, 100, 100); 
            doc.text("Referencia Ratio de Absorción Dieléctrica (DAR)", rightColX + colWidth/2, data.cursor.y + 2.5, { align: 'center' }); 
            currentY = data.cursor.y + 5; 
          },
        });

        const refCardEndY = currentY; 
        doc.setDrawColor(Number('0xD1'), Number('0xD5'), Number('0xDB')); 
        doc.roundedRect(rightColX - 1, refBorderStartY - 1, colWidth + 2, refCardEndY - refBorderStartY + 1, 1.5, 1.5, 'S'); 
        currentY = refCardEndY + 2.5; 


         const formulaNotesStartY = currentY;
         if (formulaNotesStartY + 18 > pageHeight - margin - footerHeight) { 
             doc.addPage(); currentY = margin;
         }
         else { currentY = formulaNotesStartY; } 

         const formulaBoxPadding = 1.8; 
         let formulaTextY = currentY + formulaBoxPadding + 2.5; 

         const formulaTitle = "Cálculo de PI y DAR:";
         const piFormulaText = "PI: Resistencia a 10 min / Resistencia a 1 min.";
         const darFormulaText = "DAR: Resistencia a 1 min / Resistencia a 30 seg.";

         doc.setFontSize(8); doc.setFont(undefined, 'bold'); 
         doc.text(formulaTitle, rightColX + formulaBoxPadding, formulaTextY); 
         formulaTextY += 4; 

         doc.setFontSize(7); doc.setFont(undefined, 'normal'); 
         doc.text(piFormulaText, rightColX + formulaBoxPadding, formulaTextY); 
         formulaTextY += 4; 
         doc.text(darFormulaText, rightColX + formulaBoxPadding, formulaTextY); 
         formulaTextY += 0.8; 

         const formulaBoxHeight = formulaTextY - currentY; 
         doc.setDrawColor(Number('0xD1'), Number('0xD5'), Number('0xDB')); 
         doc.roundedRect(rightColX - 1, currentY - 1, colWidth + 2, formulaBoxHeight + formulaBoxPadding * 2 + 0.8, 1.5, 1.5, 'S'); 
         currentY = currentY + formulaBoxHeight + formulaBoxPadding * 2 + 2.5; 

         rightColEndY = currentY; 


        currentY = Math.max(leftColEndY, rightColEndY);

         const signatureRequiredHeight = 18; 
         const signatureTopMargin = 4; 

         let signatureStartY = pageHeight - margin - footerHeight - signatureRequiredHeight;

         if (currentY > signatureStartY - signatureTopMargin) {
             doc.addPage();
             currentY = margin; 
             signatureStartY = margin; 
         } else {
             currentY = Math.max(currentY + signatureTopMargin, signatureStartY);
             signatureStartY = currentY;
         }


         doc.setFontSize(7); 
         const signatureLineLength = 60; 
         const signatureGap = 8; 
         const signatureWidth = signatureLineLength;
         const totalSignatureWidth = signatureWidth * 2 + signatureGap;
         const signatureStartX = (pageWidth - totalSignatureWidth) / 2; 

         const testerSigX = signatureStartX;
         doc.text('Firma del Técnico:', testerSigX, signatureStartY);
         doc.line(testerSigX, signatureStartY + 3.5, testerSigX + signatureLineLength, signatureStartY + 3.5); 

         const supervisorSigX = testerSigX + signatureWidth + signatureGap;
         doc.text('Firma del Supervisor:', supervisorSigX, signatureStartY);
         doc.line(supervisorSigX, signatureStartY + 3.5, supervisorSigX + signatureLineLength, signatureStartY + 3.5); 

         currentY = signatureStartY + 12; 


         addFooter(doc);

         doc.save(`Reporte_Resistencia_Aislamiento_${formDataForPdf.motorId || 'Motor'}.pdf`);
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
            <Card className="bg-card shadow-md rounded-md">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg text-primary">Detalles de la Prueba</CardTitle>
                </div>
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

            <Card className="bg-card shadow-md rounded-md">
              <CardHeader>
                <CardTitle className="text-lg text-primary">
                  Lecturas de Resistencia de Aislamiento (G-OHM) 
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
                             placeholder="G-OHM" 
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
                 <CardFooter className="text-xs text-muted-foreground pt-4 flex items-center justify-between"> 
                     <div className="flex items-center"> 
                       <AlertCircle className="mr-1 h-3 w-3 text-muted-foreground/70" /> Introduce las lecturas en Gigaohmios (G-OHM). Introduce 0 si la lectura es 0. 
                     </div>
                     <Button
                        variant="ghost"
                        type="button" 
                        onClick={handleStopwatchToggle}
                        className="text-2xl text-muted-foreground p-0 h-auto flex items-center hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                        aria-label={isStopwatchRunning ? "Reiniciar cronómetro" : "Iniciar cronómetro"}
                      >
                        {isStopwatchRunning ? (
                          <RefreshCcw className="mr-2 h-6 w-6" />
                        ) : (
                          <Play className="mr-2 h-6 w-6" />
                        )}
                        <span>{formatStopwatchTime(stopwatchTime)}</span>
                      </Button>
                 </CardFooter>
            </Card>

             <Separator className="bg-border my-4"/>


            <div className="flex flex-col md:flex-row justify-end space-y-2 md:space-y-0 md:space-x-4 pt-4">
               <Button
                type="button"
                onClick={generatePDF}
                disabled={!formDataForPdf || isLoadingPdf} 
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

        <div ref={resultsRef}> 
         {showResults && (polarizationIndex !== null || dielectricAbsorptionRatio !== null) && (
          <>
            <Separator className="my-6 bg-border" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
               <div className="md:col-span-3"> 
                  <Card className="bg-card shadow-md rounded-md h-full">
                      <CardHeader>
                         <CardTitle className="text-lg text-primary">Resistencia vs. Tiempo</CardTitle>
                      </CardHeader>
                      <CardContent ref={innerChartRef} className="pr-6 pt-4 min-h-[320px]"> 
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

               <div className="space-y-4 md:col-span-2">
                 <IndexResults
                   pi={polarizationIndex}
                   dar={dielectricAbsorptionRatio}
                   getCondition={getCondition}
                 />
                 <IndexReferenceTable />
                <Card className="bg-card shadow-md rounded-md">
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">Cálculo de PI y DAR</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-1">
                        <p><span className="font-semibold text-foreground">PI:</span> Resistencia a 10 min / Resistencia a 1 min.</p>
                        <p><span className="font-semibold text-foreground">DAR:</span> Resistencia a 1 min / Resistencia a 30 seg.</p>
                    </CardContent>
                </Card>
                <Card className="bg-card shadow-md rounded-md">
                    <CardHeader>
                         <CardTitle className="text-lg text-primary">Notas</CardTitle>
                    </CardHeader>
                     <CardContent className="text-sm text-muted-foreground space-y-2 text-justify">
                       <p>
                         El Índice de Polarización (PI) y el Ratio de Absorción Dieléctrica (DAR) evalúan la <strong className="text-foreground">calidad del aislamiento eléctrico</strong>. El PI mide el aumento de la resistencia con el tiempo, mientras que el DAR compara la absorción inicial de corriente con la posterior. <strong className="text-foreground">Valores altos indican un aislamiento en buen estado y seco</strong>, crucial para prevenir fallas eléctricas.
                       </p>
                       <p>
                          Para aislamientos con una resistencia significativamente elevada, los valores de PI y DAR pueden ser cercanos a 1. En estos casos, <strong className="text-foreground">la alta resistencia constante es el principal indicador de un aislamiento en buen estado</strong>.
                       </p>
                    </CardContent>
                 </Card>
               </div>
            </div>
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
