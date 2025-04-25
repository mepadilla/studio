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

// Validation schema using Zod
const formSchema = z.object({
  testerName: z.string().min(1, 'Tester name is required'),
  motorId: z.string().min(1, 'Motor ID is required'),
  motorSerial: z.string().min(1, 'Motor Serial Number is required'),
  readings: z.object(
    timePoints.reduce((acc, point) => {
      acc[`t${point.value}`] = z.coerce
        .number({ invalid_type_error: 'Must be a number' })
        .positive('Must be positive')
        .gt(0, 'Must be greater than 0');
      return acc;
    }, {} as Record<string, z.ZodNumber>)
  ),
});

type FormData = z.infer<typeof formSchema>;

type ResistanceDataPoint = { time: number; resistance: number };

export function InsulationResistanceAnalyzer() {
  const [polarizationIndex, setPolarizationIndex] = React.useState<
    number | null
  >(null);
  const [dielectricAbsorptionRatio, setDielectricAbsorptionRatio] =
    React.useState<number | null>(null);
  const [chartData, setChartData] = React.useState<ResistanceDataPoint[]>([]);
  const [formData, setFormData] = React.useState<FormData | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = React.useState(false);

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
    const r10sec = readings['t10']; // Although not standard IEEE 43, some use it

    if (r1min > 0) {
      setPolarizationIndex(parseFloat((r10min / r1min).toFixed(2)));
    } else {
      setPolarizationIndex(null); // Or handle error
    }

    if (r30sec > 0) {
      setDielectricAbsorptionRatio(parseFloat((r1min / r30sec).toFixed(2)));
    } else {
      setDielectricAbsorptionRatio(null); // Or handle error
    }

    // Prepare data for the chart
    const data: ResistanceDataPoint[] = timePoints.map((point) => ({
      time: point.value / 60, // Convert seconds to minutes for the chart x-axis
      resistance: readings[`t${point.value}`],
    }));
    setChartData(data);
  };

  const onSubmit: SubmitHandler<FormData> = (data) => {
    console.log('Form Submitted:', data);
    setFormData(data); // Store form data for PDF generation
    calculateIndices(data.readings);
  };

  const generatePDF = async () => {
     if (!formData) return;
     setIsLoadingPdf(true);

     const doc = new jsPDF();
     const pageHeight = doc.internal.pageSize.height;
     const pageWidth = doc.internal.pageSize.width;
     let currentY = 15; // Start Y position

     // Title
     doc.setFontSize(18);
     doc.text('Insulation Resistance Test Report', pageWidth / 2, currentY, { align: 'center' });
     currentY += 10;

     // Test Details Table
     autoTable(doc, {
       startY: currentY,
       head: [['Test Parameter', 'Value']],
       body: [
         ['Tester Name', formData.testerName],
         ['Motor ID', formData.motorId],
         ['Motor Serial Number', formData.motorSerial],
       ],
       theme: 'grid',
       headStyles: { fillColor: [26, 35, 126] }, // Dark Blue
       margin: { left: 14, right: 14 },
     });
     currentY = (doc as any).lastAutoTable.finalY + 10;


    // Check if we need a new page for readings table
    if (currentY + 80 > pageHeight) { // Estimate height needed for readings table
        doc.addPage();
        currentY = 15;
    }

     // Readings Table
     doc.setFontSize(12);
     doc.text('Insulation Resistance Readings', 14, currentY);
     currentY += 6;
     const readingsBody = timePoints.map((point) => [
       point.label,
       `${formData.readings[`t${point.value}`]} GΩ`,
     ]);
     autoTable(doc, {
       startY: currentY,
       head: [['Time', 'Resistance (GΩ)']],
       body: readingsBody,
       theme: 'grid',
       headStyles: { fillColor: [26, 35, 126] },
       margin: { left: 14, right: 14 },
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
       doc.text('Calculated Indices', 14, currentY);
       currentY += 6;
       autoTable(doc, {
         startY: currentY,
         head: [['Index', 'Value', 'Condition']],
         body: [
           [
             'Polarization Index (PI)',
             polarizationIndex !== null ? polarizationIndex.toFixed(2) : 'N/A',
             polarizationIndex !== null ? getCondition(polarizationIndex, 'PI') : 'N/A',
           ],
           [
             'Dielectric Absorption Ratio (DAR)',
             dielectricAbsorptionRatio !== null ? dielectricAbsorptionRatio.toFixed(2) : 'N/A',
             dielectricAbsorptionRatio !== null ? getCondition(dielectricAbsorptionRatio, 'DAR') : 'N/A',
           ],
         ],
         theme: 'grid',
         headStyles: { fillColor: [26, 35, 126] },
         margin: { left: 14, right: 14 },
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
        doc.text('Resistance vs. Time Graph', 14, currentY);
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
            console.error("Error generating chart image:", error);
             doc.text('Error generating chart image.', 14, currentY);
             currentY += 10;
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
     doc.text('Reference Values (IEEE Std 43-2013)', 14, currentY);
     currentY += 6;
     // PI Reference
     autoTable(doc, {
       startY: currentY,
       head: [['Polarization Index (PI)', 'Condition']],
       body: [
         ['< 1.0', 'Dangerous'],
         ['1.0 - 2.0', 'Questionable'],
         ['2.0 - 4.0', 'Good'],
         ['> 4.0', 'Excellent'],
       ],
       theme: 'grid',
       headStyles: { fillColor: [128, 128, 128] }, // Gray header
       margin: { left: 14, right: 14 },
     });
     currentY = (doc as any).lastAutoTable.finalY + 5;
     // DAR Reference
     autoTable(doc, {
       startY: currentY,
       head: [['Dielectric Absorption Ratio (DAR)', 'Condition']],
       body: [
         ['< 1.0', 'Bad'],
         ['1.0 - 1.25', 'Questionable'],
         ['1.25 - 1.6', 'Good'],
         ['> 1.6', 'Excellent'],
       ],
       theme: 'grid',
       headStyles: { fillColor: [128, 128, 128] },
       margin: { left: 14, right: 14 },
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
     doc.text('Tester Signature:', signatureXStart, signatureY);
     doc.line(signatureXStart, signatureY + 5, signatureXStart + signatureLineLength, signatureY + 5);

     // Supervisor Signature
     const supervisorXStart = signatureXEnd - signatureLineLength;
     doc.text('Supervisor Signature:', supervisorXStart, signatureY);
     doc.line(supervisorXStart, signatureY + 5, supervisorXStart + signatureLineLength, signatureY + 5);

     // Save the PDF
     doc.save(`Insulation_Resistance_Report_${formData.motorId}.pdf`);
     setIsLoadingPdf(false);
   };


  const getCondition = (value: number, type: 'PI' | 'DAR'): string => {
    if (type === 'PI') {
      if (value < 1.0) return 'Dangerous';
      if (value >= 1.0 && value < 2.0) return 'Questionable';
      if (value >= 2.0 && value <= 4.0) return 'Good';
      if (value > 4.0) return 'Excellent';
    } else if (type === 'DAR') {
      if (value < 1.0) return 'Bad';
      if (value >= 1.0 && value < 1.25) return 'Questionable';
      if (value >= 1.25 && value <= 1.6) return 'Good';
      if (value > 1.6) return 'Excellent';
    }
    return 'N/A';
  };

  return (
    <Card className="w-full max-w-4xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary flex items-center">
          <Thermometer className="mr-2 h-6 w-6" />
          Insulation Resistance Analyzer
        </CardTitle>
        <CardDescription>
          Enter test details and resistance readings to calculate PI and DAR.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Test Details Section */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Test Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="testerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tester Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name" {...field} />
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
                      <FormLabel>Motor ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Motor ID" {...field} />
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
                      <FormLabel>Motor Serial No.</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Serial No." {...field} />
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
                  Insulation Resistance Readings (GΩ)
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
                          <Input type="number" step="any" placeholder="GΩ" {...field} />
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
                 {isLoadingPdf ? 'Generating PDF...' : 'Download PDF Report'}
               </Button>
              <Button type="submit" variant="default" className="bg-accent hover:bg-accent/90">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Indices & Show Graph
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
                     <CardTitle className="text-lg">Resistance vs. Time</CardTitle>
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
       {/* Invisible chart specifically for PDF generation if layout differs */}
        {/* <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px', height: '400px' }}>
          <div id="resistance-chart-pdf-container">
            <ResistanceChart data={chartData} />
          </div>
        </div> */}
    </Card>
  );
}

// Helper: Returns condition based on value and type
function getCondition(value: number, type: 'PI' | 'DAR'): string {
    if (type === 'PI') {
      if (value < 1.0) return 'Dangerous';
      if (value >= 1.0 && value < 2.0) return 'Questionable';
      if (value >= 2.0 && value <= 4.0) return 'Good';
      if (value > 4.0) return 'Excellent';
    } else if (type === 'DAR') {
      if (value < 1.0) return 'Bad';
      if (value >= 1.0 && value < 1.25) return 'Questionable';
      if (value >= 1.25 && value <= 1.6) return 'Good';
      if (value > 1.6) return 'Excellent';
    }
    return 'N/A';
}
