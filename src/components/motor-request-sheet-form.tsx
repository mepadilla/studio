
"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { z } from 'zod';
import jsPDF from 'jspdf';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { FileDown, FileText, Building, UploadCloud, Settings, Bolt, Zap, Thermometer, AlignHorizontalDistributeCenter, RotateCcw, ShieldAlert, HardHat, Link2, StickyNote, Replace } from 'lucide-react';

const formSchema = z.object({
  countryOfDestination: z.string().optional(),
  motorApplication: z.string().min(1, "La aplicación del motor es obligatoria"),
  mounting: z.enum(["horizontal", "vertical"]).optional(),
  cFlange: z.boolean().optional(),
  dFlange: z.boolean().optional(),
  efficiency: z.array(z.enum(["IE1", "IE2", "IE3"])).optional(),
  designDownThrust: z.string().optional(),
  shutOffThrust: z.string().optional(),
  horsepowerKW: z.string().min(1, "La potencia (HP/KW) es obligatoria"),
  rpm: z.string().min(1, "Las RPM son obligatorias"),
  frequency: z.string().min(1, "La frecuencia (Hz) es obligatoria"),
  voltage: z.string().min(1, "El voltaje es obligatorio"),
  frameSize: z.string().optional(), // Made optional
  enclosureIP: z.string().optional(),
  serviceFactor: z.string().optional(),
  startingMethod: z.string().optional(),
  insulationClass: z.string().optional(),
  ambientC: z.string().optional(),
  assemblyPosition: z.string().optional(),
  rotation: z.string().optional(),
  hazardousProof: z.enum(["yes", "no"]).optional(),
  hazardousListed: z.enum(["listed", "non-listed"]).optional(),
  hazardousCertified: z.enum(["self-certified", "csa-certified"]).optional(),
  hazardousDivision: z.enum(["division1", "division2"]).optional(),
  hazardousClass: z.enum(["classI", "classII"]).optional(),
  hazardousGroupA: z.boolean().optional(),
  hazardousGroupB: z.boolean().optional(),
  hazardousGroupC: z.boolean().optional(),
  hazardousGroupD: z.boolean().optional(),
  hazardousGroupE: z.boolean().optional(),
  hazardousGroupF: z.boolean().optional(),
  hazardousGroupG: z.boolean().optional(),
  temperatureCode: z.string().optional(),
  inverterDuty: z.enum(["yes", "no"]).optional(),
  variableTorqueValue: z.boolean().optional(),
  variableTorqueSpeedRange: z.string().optional(),
  constantTorqueValue: z.boolean().optional(),
  constantTorqueSpeedRange: z.string().optional(),
  constantHP: z.boolean().optional(),
  directConnected: z.boolean().optional(),
  beltedConnection: z.boolean().optional(),
  driveSheaveOuterDiameter: z.string().optional(),
  drivenSheaveOuterDiameter: z.string().optional(),
  sheaveCenterDiameter: z.string().optional(),
  beltType: z.string().optional(),
  noOfBelts: z.string().optional(),
  additionalNotes: z.string().optional(),
  replacementBrandName: z.string().optional(),
  replacementCatalogModelID: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function MotorRequestSheetForm() {
  const { toast } = useToast();
  const [isLoadingPdf, setIsLoadingPdf] = React.useState(false);
  const [currentFormData, setCurrentFormData] = React.useState<FormData | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      motorApplication: '',
      horsepowerKW: '',
      rpm: '',
      frequency: '',
      voltage: '',
      frameSize: '',
      efficiency: [],
      // Initialize other fields as needed
    },
  });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    console.log('Formulario Guardado:', data);
    setCurrentFormData(data);
    toast({
      title: "Formulario Guardado",
      description: "Los datos del formulario han sido guardados y están listos para generar el PDF.",
      variant: "default",
    });
  };

  const generatePDF = async () => {
    if (!currentFormData) {
      toast({
        title: "Error",
        description: "No hay datos guardados. Por favor, complete y guarde el formulario primero.",
        variant: "destructive",
      });
      return;
    }
    setIsLoadingPdf(true);
    toast({ title: "Generando PDF...", description: "Por favor espera." });

    const doc = new jsPDF('p', 'pt', 'letter'); // Using points for finer control
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40; // points
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;

    // Helper function to draw a section title
    const drawSectionTitle = (title: string, y: number, size = 10, isBold = true) => {
      doc.setFontSize(size);
      doc.setFont(undefined, isBold ? 'bold' : 'normal');
      doc.text(title, margin, y);
      return y + size * 1.2;
    };

    // Helper function to draw a field with a value and a green background box
    const drawField = (label: string, value: string | undefined | null, x: number, y: number, fieldWidth: number, labelWidth: number, required = false, isCheckboxOrRadio = false) => {
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      const fullLabel = `${required ? '*' : ''}${label}`;
      doc.text(fullLabel, x, y + 8); // Adjusted for vertical alignment

      if (!isCheckboxOrRadio) {
        doc.setFillColor(220, 255, 220); // Light green
        doc.rect(x + labelWidth, y, fieldWidth - labelWidth, 12, 'F');
        doc.setFontSize(8);
        doc.text(value || '', x + labelWidth + 3, y + 8);
      }
      return y + 18; // Line height
    };
    
    const drawCheckbox = (label: string, checked: boolean | undefined, x: number, y: number) => {
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.rect(x, y, 8, 8, 'S'); // Draw a square
        if (checked) {
            doc.text('X', x + 2, y + 6.5); // Mark with X if checked
        }
        doc.text(label, x + 12, y + 6.5);
        return y; // Y doesn't change for items on the same "line" conceptually for checkbox lists
    }

    const drawRadio = (label: string, selected: boolean | undefined, x: number, y: number) => {
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.circle(x + 4, y + 4, 4, 'S'); // Draw a circle
        if (selected) {
            doc.circle(x + 4, y + 4, 2, 'F'); // Fill if selected
        }
        doc.text(label, x + 12, y + 6.5);
        return y;
    }


    // --- PDF Header ---
    doc.setFontSize(10);
    doc.text("NIDEC MOTOR CORPORATION", margin, yPos +10 );
    doc.setFontSize(10);
    doc.text("US MOTORS", pageWidth - margin - 70, yPos + 10);

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('HOJA DE SOLICITUD DE MOTOR DISEÑADO A MEDIDA', pageWidth / 2, yPos + 25, { align: 'center' });
    yPos += 50;

    // --- Main Content (Two Columns) ---
    const col1X = margin;
    const col2X = pageWidth / 2 + 10;
    const colWidth = contentWidth / 2 - 10;
    const fieldLabelWidth = 100; // Approximate width for labels

    let yPosCol1 = yPos;
    let yPosCol2 = yPos;

    // Column 1
    yPosCol1 = drawField('País de Destino', currentFormData.countryOfDestination, col1X, yPosCol1, colWidth, fieldLabelWidth);
    yPosCol1 = drawField('Aplicación del Motor', currentFormData.motorApplication, col1X, yPosCol1, colWidth, fieldLabelWidth, true);
    
    doc.setFontSize(8); doc.text('Montaje:', col1X, yPosCol1 + 8); yPosCol1 += 12;
    drawRadio('Horizontal', currentFormData.mounting === 'horizontal', col1X + 10, yPosCol1); yPosCol1 += 12;
    drawCheckbox('Brida C', currentFormData.cFlange, col1X + 25, yPosCol1); yPosCol1 += 12;
    drawCheckbox('Brida D', currentFormData.dFlange, col1X + 25, yPosCol1); yPosCol1 += 12;
    drawRadio('Vertical', currentFormData.mounting === 'vertical', col1X + 10, yPosCol1); yPosCol1 += 18;

    doc.setFontSize(8); doc.text('Eficiencia:', col1X, yPosCol1 + 8); yPosCol1 += 12;
    drawCheckbox('Eficiencia Estándar (IE1)', currentFormData.efficiency?.includes("IE1"), col1X + 10, yPosCol1); yPosCol1 += 12;
    drawCheckbox('Eficiencia Energética (IE2)', currentFormData.efficiency?.includes("IE2"), col1X + 10, yPosCol1); yPosCol1 += 12;
    drawCheckbox('Eficiencia Premium (IE3)', currentFormData.efficiency?.includes("IE3"), col1X + 10, yPosCol1); yPosCol1 += 18;
    
    yPosCol1 = drawField('Empuje Descendente de Diseño (lbs)', currentFormData.designDownThrust, col1X, yPosCol1, colWidth, fieldLabelWidth);
    yPosCol1 = drawField('Empuje de Cierre', currentFormData.shutOffThrust, col1X, yPosCol1, colWidth, fieldLabelWidth);
    yPosCol1 = drawField('Potencia (HP/KW)', currentFormData.horsepowerKW, col1X, yPosCol1, colWidth, fieldLabelWidth, true);
    yPosCol1 = drawField('RPM', currentFormData.rpm, col1X, yPosCol1, colWidth, fieldLabelWidth, true);
    yPosCol1 = drawField('Frecuencia (Hz)', currentFormData.frequency, col1X, yPosCol1, colWidth, fieldLabelWidth, true);
    yPosCol1 = drawField('Voltaje', currentFormData.voltage, col1X, yPosCol1, colWidth, fieldLabelWidth, true);
    yPosCol1 = drawField('Tamaño de Carcasa', currentFormData.frameSize, col1X, yPosCol1, colWidth, fieldLabelWidth, false); // Required set to false
    yPosCol1 = drawField('Encapsulado (IP)', currentFormData.enclosureIP, col1X, yPosCol1, colWidth, fieldLabelWidth);
    yPosCol1 = drawField('Factor de Servicio', currentFormData.serviceFactor, col1X, yPosCol1, colWidth, fieldLabelWidth);
    yPosCol1 = drawField('Método de Arranque', currentFormData.startingMethod, col1X, yPosCol1, colWidth, fieldLabelWidth);

    // Column 2
    yPosCol2 = drawField('Clase de Aislamiento', currentFormData.insulationClass, col2X, yPosCol2, colWidth, fieldLabelWidth);
    yPosCol2 = drawField('Ambiente °C', currentFormData.ambientC, col2X, yPosCol2, colWidth, fieldLabelWidth);
    yPosCol2 = drawField('Posición de Montaje', currentFormData.assemblyPosition, col2X, yPosCol2, colWidth, fieldLabelWidth);
    yPosCol2 = drawField('Rotación (Visto desde el Extremo Opuesto al Accionamiento)', currentFormData.rotation, col2X, yPosCol2, colWidth, fieldLabelWidth);
    
    doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.text('A Prueba de Explosión/Peligroso', col2X, yPosCol2 + 8); yPosCol2 += 12;
    doc.setFontSize(7); doc.text('(Por favor, indique División, Clase, Grupo y Código de Temperatura)', col2X, yPosCol2 + 8); yPosCol2 += 12;
    
    drawRadio('Sí', currentFormData.hazardousProof === 'yes', col2X + 10, yPosCol2);
    drawRadio('No', currentFormData.hazardousProof === 'no', col2X + 70, yPosCol2); yPosCol2 += 12;
    drawRadio('Listado', currentFormData.hazardousListed === 'listed', col2X + 10, yPosCol2);
    drawRadio('No Listado', currentFormData.hazardousListed === 'non-listed', col2X + 70, yPosCol2); yPosCol2 += 12;
    drawRadio('Autocertificado', currentFormData.hazardousCertified === 'self-certified', col2X + 10, yPosCol2);
    drawRadio('Certificado CSA', currentFormData.hazardousCertified === 'csa-certified', col2X + 100, yPosCol2); yPosCol2 += 18;

    drawRadio('División 1', currentFormData.hazardousDivision === 'division1', col2X + 10, yPosCol2);
    drawRadio('División 2', currentFormData.hazardousDivision === 'division2', col2X + colWidth / 2, yPosCol2); yPosCol2 += 12;
    
    drawRadio('Clase I', currentFormData.hazardousClass === 'classI', col2X + 10, yPosCol2);
    doc.text('Grupo', col2X + 20, yPosCol2 + 10); yPosCol2 += 12;
    drawCheckbox('A', currentFormData.hazardousGroupA, col2X + 25, yPosCol2);
    drawCheckbox('B', currentFormData.hazardousGroupB, col2X + 55, yPosCol2); yPosCol2 += 12;
    drawCheckbox('C', currentFormData.hazardousGroupC, col2X + 25, yPosCol2);
    drawCheckbox('D', currentFormData.hazardousGroupD, col2X + 55, yPosCol2); yPosCol2 += 12;

    drawRadio('Clase II', currentFormData.hazardousClass === 'classII', col2X + colWidth / 2, yPosCol2 - 24); // Align with Class I
    doc.text('Grupo', col2X + colWidth/2 + 10, yPosCol2 + 10 -12); yPosCol2 += 12;
    drawCheckbox('E', currentFormData.hazardousGroupE, col2X + colWidth / 2 + 15, yPosCol2 -24);
    drawCheckbox('F', currentFormData.hazardousGroupF, col2X + colWidth / 2 + 45, yPosCol2-24); yPosCol2 += 12;
    drawCheckbox('G', currentFormData.hazardousGroupG, col2X + colWidth / 2 + 15, yPosCol2-24);
    
    yPosCol2 += 12; // Space before Temp Code
    yPosCol2 = drawField('Código de Temperatura', currentFormData.temperatureCode, col2X, yPosCol2, colWidth, fieldLabelWidth -30); // Shorter label width for this one

    // Align yPos for next sections
    yPos = Math.max(yPosCol1, yPosCol2) + 10;

    // --- Inverter Duty Section ---
    doc.rect(margin, yPos, contentWidth, 70, 'S'); // Box for Inverter Duty
    yPos += 5;
    doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.text('Servicio con Inversor', margin + 5, yPos + 8);
    drawRadio('Sí', currentFormData.inverterDuty === 'yes', margin + 100, yPos);
    drawRadio('No', currentFormData.inverterDuty === 'no', margin + 150, yPos);
    yPos += 18;

    doc.setFontSize(8); doc.setFont(undefined, 'normal');
    doc.text('Rango de Velocidad', margin + colWidth/2 - 50, yPos + 8, {align: 'center'});
    yPos += 12;

    drawCheckbox('Valor de Torque Variable', currentFormData.variableTorqueValue, margin + 10, yPos);
    yPos = drawField('', currentFormData.variableTorqueSpeedRange, margin + 150, yPos - 12, colWidth/2 - 20 , 0) + 0 ; // Value next to it
    
    drawCheckbox('Valor de Torque Constante', currentFormData.constantTorqueValue, margin + 10, yPos);
    yPos = drawField('', currentFormData.constantTorqueSpeedRange, margin + 150, yPos - 12, colWidth/2 - 20, 0) + 0;
   
    drawCheckbox('HP Constante', currentFormData.constantHP, margin + 10, yPos);
    yPos += 25; // End of Inverter Duty box content

    // --- Connection to Load Section (aligned with Inverter Duty on the right) ---
    let yPosConnect = yPos - 70 + 5; // Align to top of inverter duty box
    const connectX = col2X;

    doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.text('Conexión a la Carga', connectX, yPosConnect + 8); yPosConnect += 18;
    doc.setFontSize(8); doc.setFont(undefined, 'normal');
    
    drawCheckbox('Conectado Directamente a la Carga', currentFormData.directConnected, connectX + 5, yPosConnect); yPosConnect += 12;
    drawCheckbox('Conexión por Correa a la Carga', currentFormData.beltedConnection, connectX + 5, yPosConnect); yPosConnect += 12;
    
    yPosConnect = drawField('Diámetro Exterior de la Polea Motriz', currentFormData.driveSheaveOuterDiameter, connectX, yPosConnect, colWidth, fieldLabelWidth + 20);
    yPosConnect = drawField('Diámetro Exterior de la Polea Conducida', currentFormData.drivenSheaveOuterDiameter, connectX, yPosConnect, colWidth, fieldLabelWidth + 20);
    yPosConnect = drawField('Diámetro Central de la Polea', currentFormData.sheaveCenterDiameter, connectX, yPosConnect, colWidth, fieldLabelWidth + 20);
    yPosConnect = drawField('Tipo de Correa', currentFormData.beltType, connectX, yPosConnect, colWidth, fieldLabelWidth);
    yPosConnect = drawField('Nº de Correas', currentFormData.noOfBelts, connectX, yPosConnect, colWidth, fieldLabelWidth);
    
    yPos = Math.max(yPos, yPosConnect) + 10;


    // --- Additional Notes ---
    yPos = drawSectionTitle('Notas Adicionales o Características Especiales', yPos);
    doc.setFillColor(220, 255, 220); // Light green
    doc.rect(margin, yPos, contentWidth, 40, 'F');
    doc.setFontSize(8);
    const notesText = doc.splitTextToSize(currentFormData.additionalNotes || '', contentWidth - 6);
    doc.text(notesText, margin + 3, yPos + 10);
    yPos += 50;

    // --- Replacement Motor ---
    yPos = drawSectionTitle('MOTOR DE REEMPLAZO', yPos, 10, true);
    doc.rect(margin, yPos, contentWidth, 40, 'S'); // Box for replacement
    yPos += 5;
    yPos = drawField('Marca:', currentFormData.replacementBrandName, margin + 5, yPos, contentWidth -10, fieldLabelWidth-30);
    yPos = drawField('Catálogo/Modelo/ID#', currentFormData.replacementCatalogModelID, margin + 5, yPos, contentWidth -10, fieldLabelWidth-30);
    yPos += 20;


    // --- Footer ---
    doc.setFontSize(8);
    doc.setFont(undefined, 'italic');
    doc.text('*Campo obligatorio a rellenar', margin, pageHeight - margin / 2);

    doc.save(`Hoja_Solicitud_Motor_${currentFormData.motorApplication.replace(/[^a-zA-Z0-9]/g, '_') || 'MOTOR'}.pdf`);
    toast({ title: "PDF Generado", description: "La solicitud se ha descargado exitosamente." });
    setIsLoadingPdf(false);
  };


  return (
    <>
      <Toaster />
      <Card className="w-full max-w-4xl shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8" />
            <CardTitle className="text-2xl font-bold">Hoja de solicitud de motor diseñado a medida</CardTitle>
          </div>
          <CardDescription className="text-primary-foreground/90 mt-2">
            Complete el siguiente formulario para solicitar un motor diseñado a pedido. Los campos marcados con (*) son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6 bg-secondary/30">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Column 1 */}
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="countryOfDestination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>País de Destino</FormLabel>
                        <FormControl><Input {...field} placeholder="Ej.: EE. UU." /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="motorApplication"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aplicación del Motor*</FormLabel>
                        <FormControl><Input {...field} placeholder="Ej.: Bomba, Ventilador, Compresor" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="mounting"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Montaje</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl><RadioGroupItem value="horizontal" /></FormControl>
                              <FormLabel className="font-normal">Horizontal</FormLabel>
                            </FormItem>
                            {form.watch("mounting") === "horizontal" && (
                              <div className="pl-6 space-y-2">
                                <FormField control={form.control} name="cFlange" render={({ field: cField }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl><Checkbox checked={cField.value} onCheckedChange={cField.onChange} /></FormControl>
                                    <FormLabel className="font-normal">Brida C</FormLabel>
                                  </FormItem>
                                )}/>
                                <FormField control={form.control} name="dFlange" render={({ field: dField }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl><Checkbox checked={dField.value} onCheckedChange={dField.onChange} /></FormControl>
                                    <FormLabel className="font-normal">Brida D</FormLabel>
                                  </FormItem>
                                )}/>
                              </div>
                            )}
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl><RadioGroupItem value="vertical" /></FormControl>
                              <FormLabel className="font-normal">Vertical</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel>Eficiencia</FormLabel>
                    <FormField control={form.control} name="efficiency" render={() => (
                        <>
                        {[
                            {id: "IE1", label: "Eficiencia Estándar (IE1)"},
                            {id: "IE2", label: "Eficiencia Energética (IE2)"},
                            {id: "IE3", label: "Eficiencia Premium (IE3)"},
                        ].map((item) => (
                            <FormField
                            key={item.id}
                            control={form.control}
                            name="efficiency"
                            render={({ field }) => {
                                return (
                                <FormItem
                                    key={item.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                    <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(item.id as "IE1" | "IE2" | "IE3")}
                                        onCheckedChange={(checked) => {
                                        return checked
                                            ? field.onChange([...(field.value || []), item.id])
                                            : field.onChange(
                                                (field.value || []).filter(
                                                (value) => value !== item.id
                                                )
                                            )
                                        }}
                                    />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                    {item.label}
                                    </FormLabel>
                                </FormItem>
                                )
                            }}
                            />
                        ))}
                        </>
                    )}/>
                    <FormMessage />
                  </FormItem>

                  <FormField control={form.control} name="designDownThrust" render={({ field }) => ( <FormItem><FormLabel>Empuje Descendente de Diseño (lbs)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="shutOffThrust" render={({ field }) => ( <FormItem><FormLabel>Empuje de Cierre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="horsepowerKW" render={({ field }) => ( <FormItem><FormLabel>Potencia (HP/KW)*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="rpm" render={({ field }) => ( <FormItem><FormLabel>RPM*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="frequency" render={({ field }) => ( <FormItem><FormLabel>Frecuencia (Hz)*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="voltage" render={({ field }) => ( <FormItem><FormLabel>Voltaje*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="frameSize" render={({ field }) => ( <FormItem><FormLabel>Tamaño de Carcasa</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="enclosureIP" render={({ field }) => ( <FormItem><FormLabel>Encapsulado (IP)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="serviceFactor" render={({ field }) => ( <FormItem><FormLabel>Factor de Servicio</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="startingMethod" render={({ field }) => ( <FormItem><FormLabel>Método de Arranque</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                </div>

                {/* Column 2 */}
                <div className="space-y-6">
                  <FormField control={form.control} name="insulationClass" render={({ field }) => ( <FormItem><FormLabel>Clase de Aislamiento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="ambientC" render={({ field }) => ( <FormItem><FormLabel>Ambiente °C</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="assemblyPosition" render={({ field }) => ( <FormItem><FormLabel>Posición de Montaje</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="rotation" render={({ field }) => ( <FormItem><FormLabel>Rotación (Visto desde el Extremo Opuesto al Accionamiento)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  
                  <Card>
                    <CardHeader><CardTitle className="text-base">A Prueba de Explosión/Peligroso</CardTitle><CardDescription className="text-xs">Por favor, indique División, Clase, Grupo y Código de Temperatura</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                      <FormField control={form.control} name="hazardousProof" render={({ field }) => ( <FormItem><FormLabel>¿A prueba de explosión?</FormLabel><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="yes" /></FormControl><FormLabel className="font-normal">Sí</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem></RadioGroup><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="hazardousListed" render={({ field }) => ( <FormItem><FormLabel>¿Listado?</FormLabel><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="listed" /></FormControl><FormLabel className="font-normal">Listado</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="non-listed" /></FormControl><FormLabel className="font-normal">No Listado</FormLabel></FormItem></RadioGroup><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="hazardousCertified" render={({ field }) => ( <FormItem><FormLabel>¿Certificado?</FormLabel><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="self-certified" /></FormControl><FormLabel className="font-normal">Autocertificado</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="csa-certified" /></FormControl><FormLabel className="font-normal">Certificado CSA</FormLabel></FormItem></RadioGroup><FormMessage /></FormItem>)}/>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="hazardousDivision" render={({ field }) => ( <FormItem><FormLabel>División</FormLabel><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="division1" /></FormControl><FormLabel className="font-normal">1</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="division2" /></FormControl><FormLabel className="font-normal">2</FormLabel></FormItem></RadioGroup><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="hazardousClass" render={({ field }) => ( <FormItem><FormLabel>Clase</FormLabel><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="classI" /></FormControl><FormLabel className="font-normal">I</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="classII" /></FormControl><FormLabel className="font-normal">II</FormLabel></FormItem></RadioGroup><FormMessage /></FormItem>)}/>
                      </div>
                      {form.watch("hazardousClass") === "classI" && (
                        <FormItem>
                          <FormLabel>Grupo (Clase I)</FormLabel>
                          <div className="grid grid-cols-2 gap-2">
                            <FormField control={form.control} name="hazardousGroupA" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">A</FormLabel></FormItem>)}/>
                            <FormField control={form.control} name="hazardousGroupB" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">B</FormLabel></FormItem>)}/>
                            <FormField control={form.control} name="hazardousGroupC" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">C</FormLabel></FormItem>)}/>
                            <FormField control={form.control} name="hazardousGroupD" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">D</FormLabel></FormItem>)}/>
                          </div>
                        </FormItem>
                      )}
                      {form.watch("hazardousClass") === "classII" && (
                        <FormItem>
                          <FormLabel>Grupo (Clase II)</FormLabel>
                          <div className="grid grid-cols-2 gap-2">
                            <FormField control={form.control} name="hazardousGroupE" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">E</FormLabel></FormItem>)}/>
                            <FormField control={form.control} name="hazardousGroupF" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">F</FormLabel></FormItem>)}/>
                            <FormField control={form.control} name="hazardousGroupG" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">G</FormLabel></FormItem>)}/>
                          </div>
                        </FormItem>
                      )}
                      <FormField control={form.control} name="temperatureCode" render={({ field }) => ( <FormItem><FormLabel>Código de Temperatura</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">Servicio con Inversor</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="inverterDuty" render={({ field }) => ( <FormItem><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="yes" /></FormControl><FormLabel className="font-normal">Sí</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem></RadioGroup><FormMessage /></FormItem>)}/>
                    {form.watch("inverterDuty") === "yes" && (
                        <Card className="p-4">
                            <CardHeader><CardTitle className="text-sm">Rango de Velocidad</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <FormField control={form.control} name="variableTorqueValue" render={({ field }) => ( <FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal text-sm">Valor de Torque Variable</FormLabel><FormControl><Input {...form.register("variableTorqueSpeedRange")} placeholder="Rango de Velocidad" className="ml-2 h-8 text-xs" /></FormControl></FormItem>)}/>
                                <FormField control={form.control} name="constantTorqueValue" render={({ field }) => ( <FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal text-sm">Valor de Torque Constante</FormLabel><FormControl><Input {...form.register("constantTorqueSpeedRange")} placeholder="Rango de Velocidad" className="ml-2 h-8 text-xs"/></FormControl></FormItem>)}/>
                                <FormField control={form.control} name="constantHP" render={({ field }) => ( <FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal text-sm">HP Constante</FormLabel></FormItem>)}/>
                            </CardContent>
                        </Card>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Conexión a la Carga</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <FormField control={form.control} name="directConnected" render={({ field }) => ( <FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Conectado Directamente a la Carga</FormLabel></FormItem>)}/>
                    <FormField control={form.control} name="beltedConnection" render={({ field }) => ( <FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Conexión por Correa a la Carga</FormLabel></FormItem>)}/>
                    <FormField control={form.control} name="driveSheaveOuterDiameter" render={({ field }) => ( <FormItem><FormLabel className="text-sm">Diámetro Exterior de la Polea Motriz</FormLabel><FormControl><Input {...field} className="h-8 text-xs"/></FormControl></FormItem>)}/>
                    <FormField control={form.control} name="drivenSheaveOuterDiameter" render={({ field }) => ( <FormItem><FormLabel className="text-sm">Diámetro Exterior de la Polea Conducida</FormLabel><FormControl><Input {...field} className="h-8 text-xs"/></FormControl></FormItem>)}/>
                    <FormField control={form.control} name="sheaveCenterDiameter" render={({ field }) => ( <FormItem><FormLabel className="text-sm">Diámetro Central de la Polea</FormLabel><FormControl><Input {...field} className="h-8 text-xs"/></FormControl></FormItem>)}/>
                    <FormField control={form.control} name="beltType" render={({ field }) => ( <FormItem><FormLabel className="text-sm">Tipo de Correa</FormLabel><FormControl><Input {...field} className="h-8 text-xs"/></FormControl></FormItem>)}/>
                    <FormField control={form.control} name="noOfBelts" render={({ field }) => ( <FormItem><FormLabel className="text-sm">Nº de Correas</FormLabel><FormControl><Input {...field} className="h-8 text-xs"/></FormControl></FormItem>)}/>
                  </CardContent>
                </Card>
              </div>
              
              <Separator />

              <FormField
                control={form.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas Adicionales o Características Especiales</FormLabel>
                    <FormControl><Textarea {...field} placeholder="Ingrese cualquier nota adicional o característica especial..." rows={4}/></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />

              <Card>
                <CardHeader><CardTitle className="text-base">Motor de Reemplazo</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="replacementBrandName" render={({ field }) => ( <FormItem><FormLabel>Marca:</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)}/>
                    <FormField control={form.control} name="replacementCatalogModelID" render={({ field }) => ( <FormItem><FormLabel>Catálogo/Modelo/ID#</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)}/>
                </CardContent>
              </Card>

              <p className="text-xs text-muted-foreground">*Campo obligatorio a rellenar</p>

              <div className="flex justify-end space-x-4 pt-6">
                 <Button type="button" variant="outline" onClick={() => form.reset()} className="border-primary text-primary hover:bg-primary/10">
                    Limpiar Formulario
                </Button>
                <Button type="submit" variant="secondary" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <StickyNote className="mr-2 h-4 w-4" /> Guardar Datos para PDF
                </Button>
                <Button
                    type="button"
                    onClick={generatePDF}
                    disabled={!currentFormData || isLoadingPdf}
                    variant="default"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  {isLoadingPdf ? 'Generando PDF...' : 'Descargar PDF'}
                </Button>
              </div>
            </form>
          </Form>
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

    