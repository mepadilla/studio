import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle } from 'lucide-react'; // Icon
import { DeratingFactorChart } from '@/components/derating-factor-chart'; // Import the new chart component

export default function VoltageDeratingNemaPage() {
  return (
    <ScrollArea className="h-[calc(100vh-220px)] pr-4"> {/* Adjust height as needed */}
      <Card className="w-full max-w-4xl mx-auto shadow-lg rounded-lg">
        <CardHeader className="bg-primary text-primary-foreground p-6">
           <div className="flex items-center space-x-3">
             <AlertTriangle className="h-8 w-8" /> {/* Using AlertTriangle as a placeholder icon */}
             {/* Updated Title */}
             <CardTitle className="text-2xl font-bold">Desbalance de Voltaje (NEMA MG1)</CardTitle>
           </div>
          <CardDescription className="text-primary-foreground/90 mt-2">
            Resumen de los conceptos clave de la norma NEMA MG1 sobre desbalance de voltaje y derrateo de motores.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Introduction */}
          <section>
            <p className="text-foreground/90 leading-relaxed">
              El desbalance de voltaje y la distorsión de la forma de onda son fenómenos de calidad de energía que ejercen una mayor influencia sobre la eficiencia y confiabilidad del motor, ya que son fenómenos de estado estable frecuentes en instalaciones industriales.
            </p>
          </section>

          <Separator />

          {/* Section 1: Voltage Unbalance Definition */}
          <section>
            <h2 className="text-xl font-semibold text-primary mb-2">1. Definición del Desbalance de Voltaje</h2>
            <p className="text-foreground/90 leading-relaxed">
              El desbalance de voltaje está definido por las normas <strong className="text-primary/90">NEMA MG1.1993</strong> y las Normas <strong className="text-primary/90">IEC 60034-26</strong>.
            </p>
            <p className="text-foreground/90 leading-relaxed mt-3">
              La definición más utilizada por la comunidad académica, dada por la IEC, es la relación entre el voltaje de secuencia negativa (V<sub>ab2</sub>) y el voltaje de secuencia positiva (V<sub>ab1</sub>).
            </p>
            <p className="text-foreground/90 leading-relaxed mt-3">
              Por razones de sencillez de cálculo y para evitar el uso de números complejos, la norma NEMA MG1.1993 y el IEEE proponen una definición más sencilla, que es la que se utiliza en los cálculos en este contexto.
            </p>
            <p className="text-foreground/90 leading-relaxed mt-3">
              Esta definición calcula el porcentaje de desbalance como la relación entre la máxima desviación del voltaje respecto al voltaje promedio y el voltaje promedio, multiplicado por 100:
            </p>
            <pre className="text-center font-mono text-sm my-3 p-2 bg-secondary/50 rounded-md overflow-x-auto">
              %Desbalance = ( (max. desviación volt. respecto al volt. promedio) / (voltaje promedio) ) * 100
            </pre>
             {/* Using <pre> for better formatting of formula-like text */}
          </section>

          <Separator />

          {/* Section 2: Effect of Voltage Unbalance and Derating Calculation */}
          <section>
            <h2 className="text-xl font-semibold text-primary mb-2">2. Efecto del Desbalance de Voltaje y Cálculo del Derrateo</h2>
            <p className="text-foreground/90 leading-relaxed">
              El desbalance de tensiones provoca un calentamiento adicional en el motor. Este calentamiento hace que la fase del bobinado más sobrecargada exceda el calentamiento nominal, lo que <strong className="text-primary/90">disminuye el tiempo de vida del aislamiento</strong>.
            </p>
            <p className="text-foreground/90 leading-relaxed mt-3">
              El calentamiento indica un aumento de las pérdidas eléctricas del motor y, por lo tanto, una <strong className="text-primary/90">disminución de la eficiencia</strong>.
            </p>
             <p className="text-foreground/90 leading-relaxed mt-3">
               Debido a estos efectos, las normas NEMA MG1.1993 y IEC 60034-26 recomiendan <strong className="text-primary/90">reducir la potencia de operación (reclasificar)</strong> del motor cuando está sometido a desbalance de tensiones.
             </p>
            <p className="text-foreground/90 leading-relaxed mt-3">
              Para calcular la nueva potencia del motor (reclasificada), primero se calcula el <strong className="text-primary/90">Factor de Reclasificación (Fr)</strong>.
            </p>
            <p className="text-foreground/90 leading-relaxed mt-3">
              El Factor de Reclasificación (Fr) se obtiene utilizando la figura que se muestra a continuación (similar a la Figura 2.12 de NEMA MG1), que muestra la relación entre el desbalance de voltaje y Fr. Se observa que:
            </p>
            {/* Add the chart component here */}
            <div className="my-4 p-4 border rounded-md bg-card shadow-sm">
              <h3 className="text-lg font-medium text-center mb-2 text-primary/90">Factor de Reclasificación vs. Desbalance de Tensión</h3>
              <DeratingFactorChart />
            </div>
             <ul className="list-disc list-inside text-foreground/90 space-y-1 pl-4 mt-2 leading-relaxed">
                <li>Hasta un 1% de desbalance, el factor es uno (no hay problema).</li>
                <li>Un 2% de desbalance corresponde a un Fr de 0.96.</li>
                <li>Un 5% corresponde a un Fr de 0.76.</li>
             </ul>
             <p className="text-foreground/90 leading-relaxed mt-3 font-medium text-destructive/90">
               La operación del motor con un porcentaje de desbalance por encima del 5% no es recomendable.
             </p>
            <p className="text-foreground/90 leading-relaxed mt-3">
              La potencia reclasificada (P<sub>r</sub>) se calcula multiplicando la potencia nominal (P<sub>N</sub>) por el Factor de Reclasificación (Fr):
            </p>
            <pre className="text-center font-mono text-sm my-3 p-2 bg-secondary/50 rounded-md overflow-x-auto">
              P<sub>r</sub> = Fr * P<sub>N</sub>
            </pre>
          </section>

          <Separator />

          {/* Section 3: Corrected Efficiency Estimation */}
          <section>
            <h2 className="text-xl font-semibold text-primary mb-2">3. Estimación de la Eficiencia Corregida (η<sub>C</sub>) debido al Desbalance</h2>
            <p className="text-foreground/90 leading-relaxed">
              Las pérdidas nominales del motor (Perd<sub>N</sub>) se calculan utilizando la potencia nominal (P<sub>N</sub>) y la eficiencia nominal (η<sub>N</sub>):
            </p>
            <pre className="text-center font-mono text-sm my-3 p-2 bg-secondary/50 rounded-md overflow-x-auto">
              Perd<sub>N</sub> = P<sub>N</sub> * ( (1 - η<sub>N</sub>) / η<sub>N</sub> )
            </pre>
             <p className="text-foreground/90 leading-relaxed mt-3">
               Considerando que las pérdidas nominales son las máximas que el motor puede disipar, la eficiencia corregida (η<sub>C</sub>) se calcula utilizando la potencia reclasificada (P<sub>r</sub>) y las pérdidas nominales (Perd<sub>N</sub>):
             </p>
            <pre className="text-center font-mono text-sm my-3 p-2 bg-secondary/50 rounded-md overflow-x-auto">
              η<sub>C</sub> = P<sub>r</sub> / (P<sub>r</sub> + Perd<sub>N</sub>)
            </pre>
          </section>

          <Separator />

          {/* Section 4: Proposed Procedure */}
          <section>
            <h2 className="text-xl font-semibold text-primary mb-2">4. Procedimiento Propuesto</h2>
            <p className="text-foreground/90 leading-relaxed">
              Para estimar la eficiencia bajo condiciones de desbalance de voltaje, se propone el siguiente procedimiento:
            </p>
            <ol className="list-decimal list-inside text-foreground/90 space-y-1 pl-4 mt-2 leading-relaxed">
              <li>Calcular el desbalance de tensión utilizando la definición NEMA (Ecuación mostrada en sección 1).</li>
              <li>Con el desbalance calculado y la figura del Factor de Reclasificación (similar a Figura 2.12 NEMA MG1), estimar el factor de reclasificación (Fr).</li>
              <li>Usando el Fr y la fórmula P<sub>r</sub> = Fr * P<sub>N</sub>, estimar la potencia reclasificada (P<sub>r</sub>).</li>
              <li>Finalmente, usando la fórmula η<sub>C</sub> = P<sub>r</sub> / (P<sub>r</sub> + Perd<sub>N</sub>), evaluar la eficiencia corregida (η<sub>C</sub>).</li>
            </ol>
             <p className="text-foreground/90 leading-relaxed mt-3 font-medium">
               En resumen, el desbalance de voltaje impacta la operación del motor al aumentar las pérdidas y reducir la eficiencia. Las normas recomiendan derratear la potencia del motor basándose en un factor de reclasificación determinado por el nivel de desbalance, y luego se calcula una eficiencia corregida considerando esta potencia reclasificada y las pérdidas nominales.
             </p>
          </section>
        </CardContent>
      </Card>
    </ScrollArea>
  );
}
