
"use client";

import * as React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
  Label,
} from 'recharts';

export interface PanelliChartModelData {
  name: string;
  hp: string;
  curvePoints: { flow: number; pressure: number }[];
  actualOperatingPoint: { flow: number; pressure: number };
  flowUnit: string;
  pressureUnit: string;
}

interface PanelliPerformanceChartProps {
  modelsData: PanelliChartModelData[];
  requestedPoint: { flow: number; pressure: number };
}

// Define a list of distinct colors for the pump curves
const PUMP_CURVE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
  '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
];

export function PanelliPerformanceChart({ modelsData, requestedPoint }: PanelliPerformanceChartProps) {
  if (!modelsData || modelsData.length === 0) {
    return <div className="flex items-center justify-center h-[300px] text-muted-foreground">No hay datos para mostrar el gráfico.</div>;
  }

  const flowUnit = modelsData[0]?.flowUnit || 'L/s';
  const pressureUnit = modelsData[0]?.pressureUnit || 'metros';

  // Determine overall domain for axes
  let minFlow = requestedPoint.flow;
  let maxFlow = requestedPoint.flow;
  let minPressure = requestedPoint.pressure;
  let maxPressure = requestedPoint.pressure;

  modelsData.forEach(model => {
    model.curvePoints.forEach(point => {
      minFlow = Math.min(minFlow, point.flow);
      maxFlow = Math.max(maxFlow, point.flow);
      minPressure = Math.min(minPressure, point.pressure);
      maxPressure = Math.max(maxPressure, point.pressure);
    });
    minFlow = Math.min(minFlow, model.actualOperatingPoint.flow);
    maxFlow = Math.max(maxFlow, model.actualOperatingPoint.flow);
    minPressure = Math.min(minPressure, model.actualOperatingPoint.pressure);
    maxPressure = Math.max(maxPressure, model.actualOperatingPoint.pressure);
  });
  
  // Add some padding to the domain
  minFlow = Math.max(0, minFlow - (maxFlow - minFlow) * 0.1); // Ensure minFlow is not negative
  maxFlow = maxFlow + (maxFlow - minFlow) * 0.1;
  minPressure = Math.max(0, minPressure - (maxPressure - minPressure) * 0.1); // Ensure minPressure is not negative
  maxPressure = maxPressure + (maxPressure - minPressure) * 0.1;


  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        margin={{
          top: 20,
          right: 40,
          left: 20,
          bottom: 40,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          type="number"
          dataKey="flow"
          domain={[minFlow, maxFlow]}
          allowDataOverflow={true}
          stroke="hsl(var(--foreground))"
          tick={{ fontSize: 10 }}
        >
          <Label value={`Caudal (${flowUnit})`} offset={-25} position="insideBottom" style={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} />
        </XAxis>
        <YAxis
          type="number"
          dataKey="pressure"
          domain={[minPressure, maxPressure]}
          allowDataOverflow={true}
          stroke="hsl(var(--foreground))"
          tick={{ fontSize: 10 }}
          width={70}
        >
          <Label value={`Presión (${pressureUnit})`} angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 12, fill: 'hsl(var(--foreground))' }} offset={-10}/>
        </YAxis>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            color: 'hsl(var(--card-foreground))',
            borderRadius: 'var(--radius)',
            fontSize: '11px',
          }}
          labelStyle={{ color: 'hsl(var(--card-foreground))', fontWeight: 'bold' }}
          formatter={(value: number, name: string) => {
            if (name.startsWith("Punto Solicitado") || name.startsWith("Punto Operación")) {
                 return [`C: ${value.toFixed(2)} ${flowUnit}, P: (valor y en el punto) ${pressureUnit}`, name];
            }
             return [`${value.toFixed(1)} ${pressureUnit}`, name];
          }}
           labelFormatter={(label: number, payload) => {
             if (payload && payload.length > 0 && payload[0].payload) {
                 if (payload[0].payload.isRequestedPoint || payload[0].payload.isActualPoint) {
                    return `Punto Específico - Caudal: ${payload[0].payload.flow.toFixed(2)} ${flowUnit}`;
                 }
                return `Caudal: ${label.toFixed(2)} ${flowUnit}`;
             }
            return `Caudal: ${label.toFixed(2)} ${flowUnit}`;
          }}
        />
        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', marginTop: '-10px' }} />

        {modelsData.map((model, index) => (
          <Line
            key={model.name}
            type="monotone"
            data={model.curvePoints}
            dataKey="pressure"
            name={`${model.name} (${model.hp} HP)`}
            stroke={PUMP_CURVE_COLORS[index % PUMP_CURVE_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
          />
        ))}

        {/* Requested Operating Point */}
        <ReferenceDot
          x={requestedPoint.flow}
          y={requestedPoint.pressure}
          r={6}
          fill="red"
          stroke="white"
          isFront={true}
        >
          <Label value="Solicitado" position="top" offset={8} style={{ fontSize: 9, fill: 'red' }}/>
        </ReferenceDot>
        
        {/* Actual Operating Points for selected models */}
        {modelsData.map((model, index) => (
          <ReferenceDot
            key={`actual-${model.name}`}
            x={model.actualOperatingPoint.flow}
            y={model.actualOperatingPoint.pressure}
            r={5}
            fill={PUMP_CURVE_COLORS[index % PUMP_CURVE_COLORS.length]}
            stroke="black"
            strokeWidth={1}
            isFront={true}
          >
            <Label value={`${model.name}`} position="bottom" offset={6} style={{ fontSize: 8, fill: PUMP_CURVE_COLORS[index % PUMP_CURVE_COLORS.length] }} />
          </ReferenceDot>
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
