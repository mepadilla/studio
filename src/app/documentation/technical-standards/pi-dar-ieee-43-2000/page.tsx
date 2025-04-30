import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText } from 'lucide-react'; // Icon

export default function PiDarIeee43Page() {
  return (
    <ScrollArea className="h-[calc(100vh-220px)] pr-4"> {/* Adjust height as needed */}
      <Card className="w-full max-w-4xl mx-auto shadow-lg rounded-lg">
        <CardHeader className="bg-primary text-primary-foreground p-6">
           <div className="flex items-center space-x-3">
             <FileText className="h-8 w-8" />
             <CardTitle className="text-2xl font-bold">Resistencia de Aislamiento y P.I. (IEEE Std 43-2000)</CardTitle>
           </div>
          <CardDescription className="text-primary-foreground/90 mt-2">
            Resumen de los conceptos clave de la norma IEEE Std 43-2000 sobre pruebas de resistencia de aislamiento y el Índice de Polarización (P.I.).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-semibold text-primary mb-2">1. ¿Qué es la prueba de resistencia de aislamiento y cuál es su propósito según la norma IEEE Std 43-2000?</h2>
            <p className="text-foreground/90 leading-relaxed">
              La prueba de resistencia de aislamiento, tal como se describe en la norma IEEE Std 43-2000, es un procedimiento recomendado para medir la capacidad del aislamiento eléctrico de los devanados de las máquinas rotativas (con una potencia nominal de 1 hp, 750 W o superior) para resistir la corriente continua. No se aplica a máquinas de potencia fraccionaria.
            </p>
            <p className="text-foreground/90 leading-relaxed mt-3">
              El propósito principal de esta práctica recomendada es:
            </p>
            <ul className="list-disc list-inside text-foreground/90 space-y-1 pl-4 mt-2 leading-relaxed">
              <li>Definir las pruebas de resistencia de aislamiento e índice de polarización para devanados de máquinas rotativas.</li>
              <li>Revisar los factores que afectan o cambian las características de la resistencia de aislamiento.</li>
              <li>Recomendar condiciones de prueba uniformes.</li>
              <li>Recomendar métodos uniformes para medir la resistencia de aislamiento, con precauciones para evitar resultados erróneos.</li>
              <li>Proporcionar una base para interpretar los resultados de las pruebas de resistencia de aislamiento y estimar la idoneidad del devanado para el servicio o para una prueba de sobretensión.</li>
              <li>Presentar valores mínimos aceptables recomendados de resistencia de aislamiento e índices de polarización para varios tipos de máquinas rotativas.</li>
            </ul>
             <p className="text-foreground/90 leading-relaxed mt-3">
               En esencia, la prueba es una herramienta importante para evaluar la condición del aislamiento eléctrico de una máquina rotativa, determinar su idoneidad para volver al servicio o para pruebas de alto potencial, y monitorear su condición a lo largo del tiempo.
             </p>
          </section>

          <Separator />

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-semibold text-primary mb-2">2. ¿Cuáles son los componentes de la corriente continua medida durante una prueba de resistencia de aislamiento?</h2>
            <p className="text-foreground/90 leading-relaxed">
              Según la norma IEEE Std 43-2000, la corriente total resultante (I<sub>T</sub>) medida durante una prueba de resistencia de aislamiento con voltaje continuo es la suma de cuatro componentes diferentes:
            </p>
            <ul className="list-disc list-inside text-foreground/90 space-y-1 pl-4 mt-2 leading-relaxed">
              <li><strong>Corriente de fuga superficial (I<sub>L</sub>):</strong> Constante en el tiempo, sobre la superficie del aislamiento. Depende de la temperatura y contaminación superficial.</li>
              <li><strong>Corriente capacitiva geométrica (I<sub>C</sub>):</strong> Reversible, alta magnitud y corta duración. Decae exponencialmente y generalmente no afecta las mediciones después del primer minuto.</li>
              <li><strong>Corriente de conducción (I<sub>G</sub>):</strong> Constante en el tiempo, pasa a través del aislamiento. Depende del material de unión.</li>
              <li><strong>Corriente de absorción (polarización) (I<sub>A</sub>):</strong> Resultante de la polarización molecular. Decae con el tiempo a una tasa decreciente (I<sub>A</sub> = Kt<sup>-n</sup>). Depende del tipo y condición del material de unión.</li>
            </ul>
             <p className="text-foreground/90 leading-relaxed mt-3">
               La interpretación de los resultados se basa en el comportamiento de estas corrientes a lo largo del tiempo.
             </p>
          </section>

          <Separator />

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-semibold text-primary mb-2">3. ¿Qué es el Índice de Polarización (P.I.) y cómo se calcula?</h2>
            <p className="text-foreground/90 leading-relaxed">
              El Índice de Polarización (P.I.), según la norma IEEE Std 43-2000, es una medida de la variación del valor de la resistencia de aislamiento con el tiempo. Se define como el cociente de la resistencia de aislamiento en un tiempo (t<sub>2</sub>) dividido por la resistencia de aislamiento en un tiempo (t<sub>1</sub>).
            </p>
            <p className="text-foreground/90 leading-relaxed mt-3">
              Tradicionalmente, se asume t<sub>2</sub> = 10 minutos y t<sub>1</sub> = 1 minuto. Por lo tanto:
            </p>
            <p className="text-center font-mono text-lg my-3 p-2 bg-secondary/50 rounded-md">
              P.I. = IR<sub>10</sub> / IR<sub>1</sub>
            </p>
            <p className="text-foreground/90 leading-relaxed mt-3">
              Un P.I. más alto generalmente indica un aislamiento limpio y seco. Un P.I. bajo puede sugerir contaminación o humedad. Para sistemas modernos, se pueden usar tiempos más cortos (ej. IR<sub>1</sub>/IR<sub>30s</sub> o IR<sub>5</sub>/IR<sub>1</sub>), pero no son ratios estandarizados.
            </p>
          </section>

          <Separator />

           {/* Section 4 */}
           <section>
             <h2 className="text-xl font-semibold text-primary mb-2">4. ¿Cómo afectan la humedad y la temperatura a los resultados de la prueba?</h2>
             <p className="text-foreground/90 leading-relaxed">
               La humedad y la temperatura son factores importantes:
             </p>
             <ul className="list-disc list-inside text-foreground/90 space-y-1 pl-4 mt-2 leading-relaxed">
               <li><strong>Efecto de la humedad:</strong> Si la temperatura del devanado está por debajo del punto de rocío, la humedad superficial puede reducir la resistencia o el P.I., especialmente con contaminación o grietas. Aislamientos higroscópicos absorben agua, aumentando la corriente de conducción. Un devanado húmedo suele alcanzar una resistencia baja y constante rápidamente. Puede ser necesario secar la máquina.</li>
               <li><strong>Efecto de la temperatura:</strong> La resistencia de aislamiento varía inversamente y exponencialmente con la temperatura. Un aumento de temperatura libera portadores de carga, reduciendo la resistividad. Para análisis de tendencias, se recomienda probar a temperaturas similares o corregir a 40 °C usando la Ecuación (2) de la norma (con precaución, es una aproximación).</li>
             </ul>
           </section>

           <Separator />

           {/* Section 5 */}
           <section>
             <h2 className="text-xl font-semibold text-primary mb-2">5. ¿Por qué se prefiere la polaridad negativa y qué es el efecto electroendosmosis?</h2>
             <p className="text-foreground/90 leading-relaxed">
               Se prefiere la polaridad negativa (cable negativo al devanado) para acomodar el fenómeno de electroendosmosis.
             </p>
             <p className="text-foreground/90 leading-relaxed mt-3">
               El <strong>electroendosmosis</strong> es un efecto observado ocasionalmente (más en devanados antiguos) donde, con humedad presente, se obtienen diferentes valores de resistencia al invertir la polaridad. Usar polaridad negativa proporciona un enfoque de prueba más consistente.
             </p>
           </section>

          <Separator />

           {/* Section 6 */}
           <section>
             <h2 className="text-xl font-semibold text-primary mb-2">6. ¿Cuáles son los valores mínimos recomendados (IEEE Std 43-2000)?</h2>
             <p className="text-foreground/90 leading-relaxed">
               La norma proporciona valores mínimos recomendados para P.I. e IR<sub>1 min</sub> (resistencia a 1 minuto corregida a 40 °C) para evaluar la idoneidad del devanado:
             </p>
             <h3 className="text-lg font-medium text-primary/90 mt-3 mb-1">Índice de Polarización (P.I.) Mínimo (Tabla 2):</h3>
             <ul className="list-disc list-inside text-foreground/90 space-y-1 pl-4 leading-relaxed">
               <li>Clase térmica A: 1.5</li>
               <li>Clase térmica B, F, H: 2.0</li>
             </ul>
              <p className="text-foreground/90 leading-relaxed mt-2 text-sm italic">
                Nota: La prueba de P.I. no aplica a devanados de campo no aislados. Si IR<sub>1</sub> > 5000 MΩ, el P.I. puede no ser significativo.
              </p>

             <h3 className="text-lg font-medium text-primary/90 mt-4 mb-1">Resistencia de Aislamiento Mínima (IR<sub>1 min</sub> a 40 °C) (Tabla 3):</h3>
             <ul className="list-disc list-inside text-foreground/90 space-y-1 pl-4 leading-relaxed">
               <li>IR<sub>1 min</sub> = kV + 1 (MΩ) para devanados pre-1970, devanados de campo, y otros no listados abajo.</li>
               <li>IR<sub>1 min</sub> = 100 MΩ para armaduras CC y devanados CA post-1970 (bobinas formadas).</li>
               <li>IR<sub>1 min</sub> = 5 MΩ para máquinas con bobinas aleatorias y bobinas formadas &lt; 1 kV.</li>
             </ul>
             <p className="text-foreground/90 leading-relaxed mt-2 text-sm italic">
               (kV = tensión nominal línea-línea en kV rms)
             </p>
           </section>

           <Separator />

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-semibold text-primary mb-2">7. ¿Cuáles son las limitaciones de la prueba de resistencia de aislamiento?</h2>
            <p className="text-foreground/90 leading-relaxed">
              Aunque útil, la prueba tiene limitaciones:
            </p>
            <ul className="list-disc list-inside text-foreground/90 space-y-1 pl-4 mt-2 leading-relaxed">
              <li>No está directamente relacionada con la rigidez dieléctrica.</li>
              <li>Valores bajos pueden ser normales en ciertas máquinas (grandes, baja velocidad, conmutadores). El análisis de tendencias es clave.</li>
              <li>No indica si la contaminación está concentrada o distribuida.</li>
              <li>Puede no detectar vacíos internos en el aislamiento.</li>
              <li>No detecta problemas relacionados con la rotación (se realiza con la máquina parada).</li>
            </ul>
          </section>

          <Separator />

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-semibold text-primary mb-2">8. ¿Qué consideraciones de seguridad son importantes?</h2>
            <p className="text-foreground/90 leading-relaxed">
              La prueba implica altos voltajes. Se deben tomar precauciones:
            </p>
            <ul className="list-disc list-inside text-foreground/90 space-y-1 pl-4 mt-2 leading-relaxed">
              <li><strong>Descarga Completa:</strong> Descargar completamente los devanados antes y después de la prueba (mínimo 4 veces la duración de la prueba después). Asegurarse de que no haya voltaje residual (&lt;20V).</li>
              <li><strong>Medidas de Seguridad:</strong> Restringir acceso, usar EPP, pértigas y escaleras aisladas.</li>
              <li><strong>Cables y Conexiones:</strong> Usar cables aislados y espaciados adecuadamente (especialmente ≥ 5kV). Se recomienda blindaje. Conectar extremos neutro y de línea si es posible.</li>
              <li><strong>Responsabilidad del Usuario:</strong> Es responsabilidad del usuario evaluar los peligros y proteger al personal y al equipo.</li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </ScrollArea>
  );
}
