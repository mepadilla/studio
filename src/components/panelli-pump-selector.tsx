
"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { Droplets, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

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
import { allPumpSeries, type PumpSeriesData, type PumpModelData } from '@/lib/panelli-pump-data';

// Validation schema
const formSchema = z.object({
  caudal: z.coerce
    .number({ invalid_type_error: 'Debe ser un número' })
    .positive('El caudal debe ser positivo'),
  presion: z.coerce
    .number({ invalid_type_error: 'Debe ser un número' })
    .positive('La presión debe ser positiva'),
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
}

interface SeriesMessage {
    seriesName: string;
    message: string;
    type: 'info' | 'warning';
}

export function PanelliPumpSelector() {
  const [selectionResults, setSelectionResults] = React.useState<SelectionResult[]>([]);
  const [seriesMessages, setSeriesMessages] = React.useState<SeriesMessage[]>([]);
  const [showResults, setShowResults] = React.useState(false);
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caudal: undefined, // Use undefined for number inputs to show placeholder
      presion: undefined,
    },
    mode: 'onBlur',
  });

  const findSuitablePumps = (data: FormData) => {
    const requestedCaudal = data.caudal;
    const requestedPresion = data.presion;
    const suitablePumps: SelectionResult[] = [];
    const messages: SeriesMessage[] = [];

    allPumpSeries.forEach((series) => {
      // 1. Check if requestedCaudal is within the general range of the series (Python's initial if condition)
      if (requestedCaudal > series.minFlow && requestedCaudal < series.maxFlow) {
        // 2. Find targetFlowRateDisplayIndex
        let targetFlowRateDisplayIndex = -1;
        for (let m = 0; m < series.flowRates.length; m++) {
          if (requestedCaudal <= series.flowRates[m]) {
            targetFlowRateDisplayIndex = m;
            break;
          }
        }

        if (targetFlowRateDisplayIndex === -1) {
          // This case means requestedCaudal is greater than all flowRates in the series,
          // but still within minFlow/maxFlow. The Python script would effectively say "no cumple".
          // However, our loop for targetFlowRateDisplayIndex should always find one if previous check passes.
          // This might only happen if requestedCaudal < series.flowRates[0] AND series.minFlow is very low.
          // For safety, let's consider if targetFlowRateDisplayIndex remains -1 means no suitable flow point in the table.
          messages.push({seriesName: series.seriesName, message: `La Serie ${series.seriesName} no tiene un punto de caudal tabulado mayor o igual al solicitado.`, type: 'info'});
          return; // No suitable flow point in this series' table
        }

        // 3. Find the first suitable model in this series
        let modelFoundInSeries = false;
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
              });
              modelFoundInSeries = true;
              break; // Found the first suitable model for this series, as per Python logic
            }
          }
        }
        if (!modelFoundInSeries) {
            messages.push({seriesName: series.seriesName, message: `Para la Serie ${series.seriesName}: Ningún modelo cumple la presión requerida con el caudal adecuado.`, type: 'info'});
        }

      } else {
        messages.push({seriesName: series.seriesName, message: `La Serie ${series.seriesName} no cumple la condición de caudal.`, type: 'info'});
      }
    });

    setSelectionResults(suitablePumps);
    setSeriesMessages(messages.filter(msg => !suitablePumps.some(p => p.seriesName === msg.seriesName))); // Show messages only for series without a match

    setShowResults(true);
    if (suitablePumps.length > 0) {
        toast({
          title: "Búsqueda Completada",
          description: `Se encontraron ${suitablePumps.length} modelo(s) adecuado(s).`,
          variant: "default",
        });
    } else {
        toast({
          title: "Búsqueda Completada",
          description: "No se encontraron modelos que cumplan exactamente los criterios para ninguna serie.",
          variant: "default", // or "destructive" if preferred for no results
        });
    }


    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const onSubmit: SubmitHandler<FormData> = (data) => {
    findSuitablePumps(data);
  };

  return (
    <>
      <Toaster />
      <Card className="w-full max-w-xl shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-2xl font-bold flex items-center">
            <Droplets className="mr-2 h-7 w-7" />
            Selector Simple de Bombas Panelli (Serie 95PR)
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Introduce el caudal y la presión requeridos para encontrar modelos de bombas adecuados.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-secondary/30">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        <FormLabel className="text-foreground/80">Caudal (L/s)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="Ej: 1.5"
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
                        <FormLabel className="text-foreground/80">Presión (metros)</FormLabel>
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

              <div className="flex justify-end pt-4">
                <Button type="submit" variant="default" className="bg-accent hover:bg-accent/90 rounded-md text-accent-foreground">
                  <Search className="mr-2 h-4 w-4" />
                  Buscar Modelos
                </Button>
              </div>
            </form>
          </Form>

          <div ref={resultsRef}>
            {showResults && (
              <>
                <Separator className="my-6 bg-border" />
                <Card className="bg-card shadow-md rounded-md">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary">Resultados de la Selección</CardTitle>
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
                            Esta bomba entrega aproximadamente:
                            <span className="font-medium"> {result.deliveredFlow.toFixed(2)} {result.flowUnit}</span> @
                            <span className="font-medium"> {result.deliveredPressure} {result.pressureUnit}</span>.
                          </p>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-4">
                        <AlertCircle className="mx-auto h-8 w-8 mb-2 text-amber-500" />
                        No se encontraron modelos que cumplan con los criterios especificados.
                      </div>
                    )}
                    {seriesMessages.map((msg, index) => (
                         !selectionResults.some(r => r.seriesName === msg.seriesName) && (
                            <p key={`msg-${index}`} className={cn(
                                "text-sm mt-2 pl-2 border-l-2",
                                msg.type === 'info' ? "text-muted-foreground border-blue-400" : "text-amber-600 border-amber-400"
                            )}>
                                {msg.message}
                            </p>
                         )
                    ))}
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
