# **App Name**: Insulation Resistance Analyzer

## Core Features:

- Data Input and Storage: Collects the name of the person performing the test, motor ID, motor serial number, and insulation resistance values at different times (0s, 10s, 30s, 1min, 2min, 3min, 4min, 5min, 6min, 7min, 8min, 9min, 10min) in gigaohms.
- Index Calculation and Display: Calculates and displays the Polarization Index (PI) and Dielectric Absorption Ratio (DAR) based on the input data. Presents a reference table for interpreting these indices.
- Graph Generation and Report Download: Generates a smooth line graph of insulation resistance values over time, with appropriate units displayed on the axes. Creates a PDF report including the input data table, generated graph, calculated PI/DAR values, reference tables, and signature sections for the tester and supervisor.

## Style Guidelines:

- Primary color: Dark blue (#1A237E) for a professional and reliable feel.
- Secondary color: Light gray (#F5F5F5) for backgrounds and data tables.
- Accent: Teal (#009688) for buttons and interactive elements.
- Use a clear, tabular layout for data input and display.
- Use icons to represent different functions, such as data input, calculation, and report generation.

## Original User Request:
crea una aplicación para registrar una prueba de resistencia de aislamiento que reciba el nombre de la persona responsable de la prueba, la identificación de motor bajo prueba, el numero de serie del motor bajo prueba; registre los valores de resistencia de aislamiento para tiempo cero segundos, tiempo 10 segundos, tiempo 30 segundos, tiempo 1 minutos, 2 minutos, 3 minutos, 4 minutos, 5 minutos 6 minutos, 7 minutos, 8 minutos, 9 minutos y 10 minutos, estos valores estaran expresados en gigaohm, agrega un boton para calcular y mostrar en la misma aplicacion el indice de polarización y el indice de absorción, debes agregar referencias para estos valores de indices, de modo que el usuario final pueda comparar el resultado con esta tabla de referencia y condición, con este calculo tambien debes mostrar una grafica con los valores de resistencia de aislamiento versus tiempo, mostrando las unidades correspondientes y que la grafica sea de tipo linea continua suavisada, agrega adicionalmente otro botón que permita la descarga de un informe en pdf que contenga la tabla con los valores de resistencia de aislamiento ingresados por el usuario, la gráfica generada con los valores de aislamiento versus tiempo, una tabla con los resultados de los indices de polarización y dispersión calculados, en este informe también deben aparecer los valores de referencia para estos indices y agrega dos secciones en el pdf para que firme el reporte el ejecutante de la prueba y un supervisor de la misma.
  