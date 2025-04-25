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
  resistance: number; // Resistance in Gigaohms (GΩ)
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
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="time"
          type="number"
          domain={[0, 10]} // Fixed domain from 0 to 10 minutes
          ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} // Ensure ticks at whole minutes
          label={{ value: 'Time (minutes)', position: 'insideBottomRight', offset: -5 }}
          stroke="hsl(var(--foreground))"
        />
        <YAxis
          label={{ value: 'Resistance (GΩ)', angle: -90, position: 'insideLeft', offset: -5 }}
          stroke="hsl(var(--foreground))"
          domain={['auto', 'auto']} // Auto-adjust Y-axis based on data
          allowDecimals={true}
        />
        <Tooltip
           contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--card-foreground))'
           }}
           labelStyle={{ color: 'hsl(var(--card-foreground))' }}
           formatter={(value: number) => [`${value.toFixed(2)} GΩ`, 'Resistance']}
           labelFormatter={(label: number) => `Time: ${label.toFixed(1)} min`}
        />
        <Legend verticalAlign="top" height={36}/>
        <Line
          type="monotone" // Smooth line
          dataKey="resistance"
          stroke="hsl(var(--primary))" // Use primary theme color
          strokeWidth={2}
          activeDot={{ r: 8, stroke: 'hsl(var(--accent))', fill: 'hsl(var(--accent))' }} // Highlight active dot with accent color
          dot={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, r: 4, fill: 'hsl(var(--primary))' }}
          name="Insulation Resistance"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
