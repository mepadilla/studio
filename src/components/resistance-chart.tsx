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

interface ResistanceDataPoint {
  time: number; // Time in minutes
  resistance: number; // Resistance in Gigaohms (G-OHM)
}

interface ResistanceChartProps {
  data: ResistanceDataPoint[];
}

export function ResistanceChart({ data }: ResistanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
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
          dataKey="time"
          type="number"
          domain={[0, 10]} // Fixed domain from 0 to 10 minutes
          ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} // Ensure ticks at whole minutes
          label={{ value: 'Tiempo (minutos)', position: 'insideBottom', offset: -15 }} // Adjusted label position
          stroke="hsl(var(--foreground))"
          tick={{ fontSize: 12 }}
        />
        <YAxis
          label={{ value: 'Resistencia (G-OHM)', angle: -90, position: 'insideLeft', offset: -5 }}
          stroke="hsl(var(--foreground))"
          domain={['auto', 'auto']} // Auto-adjust Y-axis based on data
          allowDecimals={true}
          tickFormatter={(value) => (isFinite(value) ? value : '∞')} // Handle Infinity ticks
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
           formatter={(value: number) => [`${isFinite(value) ? value.toFixed(2) : '∞'} G-OHM`, 'Resistencia']} // Handle Infinity display in tooltip, updated unit
           labelFormatter={(label: number) => `Tiempo: ${label.toFixed(1)} min`}
        />
        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} payload={[{ value: 'Resistencia de Aislamiento', type: 'line', id: 'resistance', color: 'hsl(var(--primary))' }]} />
        <Line
          type="monotone" // Smooth line
          dataKey="resistance"
          stroke="hsl(var(--primary))" // Use primary theme color
          strokeWidth={2}
          activeDot={{ r: 6, stroke: 'hsl(var(--accent))', fill: 'hsl(var(--accent))', strokeWidth: 2 }} // Highlight active dot with accent color
          dot={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, r: 3, fill: 'hsl(var(--primary))' }}
          name="Resistencia de Aislamiento" // Legend name in Spanish
          connectNulls={false} // Do not connect points if data is missing (null/undefined), but allow Infinity
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
