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
} from 'recharts';

// Data points extracted/approximated from the provided image
const data = [
  { desbalance: 0, factor: 1.0 },
  { desbalance: 0.5, factor: 1.0 },
  { desbalance: 1.0, factor: 1.0 },
  { desbalance: 1.5, factor: 0.98 },
  { desbalance: 2.0, factor: 0.96 },
  { desbalance: 2.5, factor: 0.93 },
  { desbalance: 3.0, factor: 0.90 },
  { desbalance: 3.5, factor: 0.87 },
  { desbalance: 4.0, factor: 0.83 },
  { desbalance: 4.5, factor: 0.80 },
  { desbalance: 5.0, factor: 0.76 },
];

export function DeratingFactorChart() {
  return (
    <ResponsiveContainer width="100%" height={300} className="mt-4">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 20, // Increased bottom margin for label
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="desbalance"
          type="number"
          domain={[0, 5]} // Fixed domain from 0% to 5%
          ticks={[0, 1, 2, 3, 4, 5]} // Ticks at whole percentages
          label={{ value: 'Desbalance de tensión (%)', position: 'insideBottom', offset: -15 }}
          stroke="hsl(var(--foreground))"
          tick={{ fontSize: 12 }}
        />
        <YAxis
          dataKey="factor"
          type="number"
          domain={[0.7, 1.0]} // Domain from 0.7 to 1.0 based on image
          ticks={[0.7, 0.8, 0.9, 1.0]} // Ticks for factor values
          label={{ value: 'Factor de reclasificación', angle: -90, position: 'insideLeft', offset: -5 }}
          stroke="hsl(var(--foreground))"
          tickFormatter={(value) => value.toFixed(1)} // Format ticks to one decimal place
          tick={{ fontSize: 12 }}
          width={80} // Increase width to accommodate label
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            color: 'hsl(var(--card-foreground))',
            borderRadius: 'var(--radius)',
            boxShadow: 'hsl(var(--shadow))',
            fontSize: '12px',
          }}
          labelStyle={{ color: 'hsl(var(--card-foreground))', fontWeight: 'bold' }}
          formatter={(value: number) => [value.toFixed(2), 'Factor']} // Format tooltip value
          labelFormatter={(label: number) => `Desbalance: ${label.toFixed(1)}%`}
        />
        <Legend
          verticalAlign="top"
          height={36}
          wrapperStyle={{ fontSize: '12px' }}
          payload={[{ value: 'Factor de Reclasificación vs. Desbalance', type: 'line', id: 'factor', color: 'hsl(var(--primary))' }]}
        />
        <Line
          type="monotone" // Use monotone for a smooth curve similar to the image
          dataKey="factor"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          activeDot={{ r: 6, stroke: 'hsl(var(--accent))', fill: 'hsl(var(--accent))', strokeWidth: 2 }}
          dot={false} // Don't show individual dots unless hovered
          name="Factor de Reclasificación"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
