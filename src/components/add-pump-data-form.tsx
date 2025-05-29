
"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Controller, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
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
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ClipboardCopy, PlusCircle, Trash2, Layers, Workflow, BarChartBig, Sigma, Thermometer, Settings2, Info } from 'lucide-react';
import type { PumpSeriesData, PumpModelData } from '@/lib/pump-data/pump-data.types';

const pumpModelSchema = z.object({
  modelName: z.string().min(1, "Nombre del modelo requerido"),
  hp: z.string().min(1, "HP requerido"),
  pressures: z.array(z.coerce.number({invalid_type_error: "Debe ser un número"})).min(1, "Se requiere al menos una presión"),
});

const addPumpFormSchema = z.object({
  brandName: z.string().min(1, "Nombre de la marca requerido"),
  seriesName: z.string().min(1, "Nombre de la serie requerido"),
  flowRateUnit: z.string().min(1, "Unidad de caudal requerida").default("l/s"),
  pressureUnit: z.string().min(1, "Unidad de presión requerida").default("metros"),
  minFlow: z.coerce.number({invalid_type_error: "Debe ser un número"}).min(0, "Caudal mínimo no puede ser negativo"),
  maxFlow: z.coerce.number({invalid_type_error: "Debe ser un número"}).positive("Caudal máximo debe ser positivo"),
  flowRates: z.array(z.coerce.number({invalid_type_error: "Debe ser un número"})).min(1, "Se requiere al menos un punto de caudal"),
  models: z.array(pumpModelSchema).min(1, "Se requiere al menos un modelo"),
}).refine(data => data.maxFlow > data.minFlow, {
  message: "El caudal máximo debe ser mayor que el caudal mínimo.",
  path: ["maxFlow"],
});

type AddPumpFormData = z.infer<typeof addPumpFormSchema>;

export function AddPumpDataForm() {
  const [generatedCode, setGeneratedCode] = React.useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<AddPumpFormData>({
    resolver: zodResolver(addPumpFormSchema),
    defaultValues: {
      brandName: '',
      seriesName: '',
      flowRateUnit: 'l/s',
      pressureUnit: 'metros',
      minFlow: 0,
      maxFlow: undefined,
      flowRates: [0],
      models: [{ modelName: '', hp: '', pressures: [] }],
    },
  });

  const { fields: flowRateFields, append: appendFlowRate, remove: removeFlowRate } = useFieldArray({
    control: form.control,
    name: "flowRates",
  });

  const { fields: modelFields, append: appendModel, remove: removeModel } = useFieldArray({
    control: form.control,
    name: "models",
  });

  const onSubmit: SubmitHandler<AddPumpFormData> = (data) => {
    // Ensure all models have the same number of pressure points as flowRate points
    const numFlowRates = data.flowRates.length;
    const modelsAreValid = data.models.every(model => model.pressures.length === numFlowRates);

    if (!modelsAreValid) {
      toast({
        title: "Error de Validación",
        description: `Cada modelo debe tener exactamente ${numFlowRates} punto(s) de presión, correspondientes a los puntos de caudal definidos para la serie.`,
        variant: "destructive",
        duration: 7000,
      });
      // Set errors manually for relevant fields if possible, or guide user
      data.models.forEach((model, modelIndex) => {
        if (model.pressures.length !== numFlowRates) {
          form.setError(`models.${modelIndex}.pressures`, {
            type: "manual",
            message: `Debe tener ${numFlowRates} presiones.`
          });
        }
      });
      return;
    }
    
    const seriesNameConst = `${data.brandName.toUpperCase().replace(/\s+/g, '_')}_${data.seriesName.toUpperCase().replace(/\s+/g, '_')}_DATA`;

    const modelsString = data.models.map(model => 
      `    { modelName: "${model.modelName}", hp: "${model.hp}", pressures: [${model.pressures.join(', ')}] }`
    ).join(',\n');

    const code = `
// Archivo: src/lib/pump-data/${data.brandName.toLowerCase().replace(/\s+/g, '-')}-data.ts (o el archivo existente de la marca)
// Asegúrate de importar PumpSeriesData de './pump-data.types'
// import type { PumpSeriesData } from './pump-data.types';

export const ${seriesNameConst}: PumpSeriesData = {
  seriesName: "${data.seriesName}",
  flowRateUnit: "${data.flowRateUnit}",
  pressureUnit: "${data.pressureUnit}",
  minFlow: ${data.minFlow},
  maxFlow: ${data.maxFlow},
  flowRates: [${data.flowRates.join(', ')}],
  models: [
${modelsString}
  ],
};

// Si es un nuevo archivo para esta marca, o para agregar esta serie a una marca existente,
// necesitas exportar un array que contenga esta (y otras series de la misma marca). Ejemplo:
// export const all${data.brandName.charAt(0).toUpperCase() + data.brandName.slice(1).toLowerCase().replace(/\s+/g, '')}PumpSeries: PumpSeriesData[] = [
//   ${seriesNameConst},
//   // ...otras series de la marca ${data.brandName}
// ];

// Finalmente, actualiza src/lib/pump-data/index.ts:
// 1. Importa 'all${data.brandName.charAt(0).toUpperCase() + data.brandName.slice(1).toLowerCase().replace(/\s+/g, '')}PumpSeries' desde el archivo de datos de la marca.
// 2. Agrega un nuevo objeto al array ALL_BRANDS_DATA:
// {
//   brandName: '${data.brandName}',
//   series: all${data.brandName.charAt(0).toUpperCase() + data.brandName.slice(1).toLowerCase().replace(/\s+/g, '')}PumpSeries,
//   defaultFlowUnit: '${data.flowRateUnit}',
//   defaultPressureUnit: '${data.pressureUnit}',
// },
`;
    setGeneratedCode(code.trim());
    toast({
      title: "Código Generado",
      description: "El código TypeScript para los datos de la bomba ha sido generado. Sigue las instrucciones para agregarlo a tu proyecto.",
      duration: 10000,
    });
  };

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode)
        .then(() => {
          toast({ title: "Copiado", description: "Código copiado al portapapeles." });
        })
        .catch(err => {
          toast({ title: "Error", description: "No se pudo copiar el código.", variant: "destructive" });
        });
    }
  };

  return (
    <>
      <Toaster />
      <CardContent className="p-6 bg-secondary/30">
        <Alert variant="default" className="mb-6 bg-blue-50 border-blue-300 text-blue-700">
          <Info className="h-5 w-5 text-blue-600" />
          <AlertTitle className="font-semibold text-blue-800">Información Importante</AlertTitle>
          <AlertDescription className="text-sm">
            Esta herramienta te ayudará a generar el código TypeScript necesario para agregar nuevos datos de bombas.
            Debido a razones de seguridad y la arquitectura de la aplicación, **no se modificarán archivos automáticamente**.
            Deberás copiar el código generado y agregarlo manualmente a los archivos correspondientes en tu proyecto,
            luego hacer commit y redesplegar la aplicación para ver los cambios.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center"><Layers className="mr-2 h-5 w-5 text-primary/80"/>Información de la Marca y Serie</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="brandName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Marca</FormLabel>
                    <FormControl><Input {...field} placeholder="Ej: Panelli, Grundfos" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="seriesName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Serie</FormLabel>
                    <FormControl><Input {...field} placeholder="Ej: 95PR08, SP17" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="flowRateUnit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad de Caudal</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="pressureUnit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad de Presión</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                 <FormField control={form.control} name="minFlow" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caudal Mínimo de la Serie ({form.watch("flowRateUnit")})</FormLabel>
                    <FormControl><Input type="number" step="any" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="maxFlow" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caudal Máximo de la Serie ({form.watch("flowRateUnit")})</FormLabel>
                    <FormControl><Input type="number" step="any" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center"><BarChartBig className="mr-2 h-5 w-5 text-primary/80"/>Puntos de Caudal de la Serie ({form.watch("flowRateUnit")})</CardTitle>
                    <Button type="button" size="sm" variant="outline" onClick={() => appendFlowRate(0)}><PlusCircle className="mr-2 h-4 w-4"/>Agregar Punto</Button>
                </div>
                <FormDescription>Define los puntos de caudal específicos para los cuales se listarán las presiones de los modelos.</FormDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {flowRateFields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <FormField control={form.control} name={`flowRates.${index}`} render={({ field: flowField }) => (
                        <FormItem className="flex-grow">
                         <FormLabel className="sr-only">Punto de Caudal {index + 1}</FormLabel>
                         <FormControl><Input type="number" step="any" {...flowField} placeholder={`Caudal ${index + 1}`}/></FormControl>
                         <FormMessage />
                        </FormItem>
                    )}/>
                    {flowRateFields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeFlowRate(index)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4"/>
                      </Button>
                    )}
                  </div>
                ))}
                {form.formState.errors.flowRates && typeof form.formState.errors.flowRates.message === 'string' && (
                    <p className="text-sm font-medium text-destructive">{form.formState.errors.flowRates.message}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center"><Workflow className="mr-2 h-5 w-5 text-primary/80"/>Modelos de Bomba de la Serie</CardTitle>
                  <Button type="button" size="sm" variant="outline" onClick={() => appendModel({ modelName: '', hp: '', pressures: Array(form.watch('flowRates', []).length).fill(0) })}>
                    <PlusCircle className="mr-2 h-4 w-4"/>Agregar Modelo
                  </Button>
                </div>
                 <FormDescription>Asegúrate de que cada modelo tenga el mismo número de puntos de presión que los puntos de caudal definidos para la serie.</FormDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {modelFields.map((modelItem, modelIndex) => (
                  <Card key={modelItem.id} className="p-4 bg-background/70">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-md text-primary">Modelo {modelIndex + 1}</h4>
                      {modelFields.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeModel(modelIndex)} className="text-destructive hover:bg-destructive/10 -mr-2 -mt-2">
                          <Trash2 className="mr-1 h-3.5 w-3.5"/>Eliminar Modelo
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name={`models.${modelIndex}.modelName`} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Modelo</FormLabel>
                          <FormControl><Input {...field} placeholder="Ej: 95PR0806"/></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                      <FormField control={form.control} name={`models.${modelIndex}.hp`} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Potencia (HP)</FormLabel>
                          <FormControl><Input {...field} placeholder="Ej: 0.5, 1, 1.5"/></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                    </div>
                    <div className="mt-4">
                      <FormLabel className="text-md mb-1 block">Presiones del Modelo ({form.watch("pressureUnit")})</FormLabel>
                      <FormDescription className="text-xs mb-2">Debe haber {form.watch('flowRates', []).length} presiones, una por cada punto de caudal de la serie.</FormDescription>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {form.watch('flowRates', []).map((_, pressureIndex) => (
                           <FormField key={`${modelItem.id}-pressure-${pressureIndex}`} control={form.control} name={`models.${modelIndex}.pressures.${pressureIndex}`}
                             render={({ field }) => (
                               <FormItem>
                                 <FormLabel className="text-xs text-muted-foreground">
                                    @ {form.watch(`flowRates.${pressureIndex}`, 0)} {form.watch("flowRateUnit")}
                                  </FormLabel>
                                 <FormControl><Input type="number" step="any" {...field} placeholder={`Presión ${pressureIndex + 1}`} /></FormControl>
                                 <FormMessage />
                               </FormItem>
                           )}/>
                        ))}
                      </div>
                       {form.formState.errors.models?.[modelIndex]?.pressures && typeof form.formState.errors.models?.[modelIndex]?.pressures?.message === 'string' && (
                         <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.models?.[modelIndex]?.pressures?.message}</p>
                       )}
                    </div>
                  </Card>
                ))}
                 {form.formState.errors.models && typeof form.formState.errors.models.message === 'string' && (
                    <p className="text-sm font-medium text-destructive">{form.formState.errors.models.message}</p>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end pt-2">
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Sigma className="mr-2 h-4 w-4"/>Generar Código TypeScript
              </Button>
            </div>
          </form>
        </Form>

        {generatedCode && (
          <div className="mt-8">
            <Separator className="my-6"/>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center"><Settings2 className="mr-2 h-5 w-5 text-primary/80"/>Código Generado e Instrucciones</CardTitle>
                    <Button variant="outline" size="sm" onClick={copyToClipboard}><ClipboardCopy className="mr-2 h-4 w-4"/>Copiar Código</Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Copia el siguiente código y sigue las instrucciones comentadas dentro del código para agregarlo a tu proyecto.
                  Recuerda que después de agregar los datos y actualizar el registro de marcas (si es necesario), deberás
                  hacer commit de los cambios y redesplegar tu aplicación.
                </p>
                <Textarea
                  readOnly
                  value={generatedCode}
                  className="min-h-[300px] font-mono text-xs bg-background border-dashed"
                  rows={25}
                />
              </CardContent>
            </Card>
          </div>
        )}
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
    </>
  );
}
