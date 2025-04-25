"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function IndexReferenceTable() {
  const piReference = [
    { range: '< 1.0', condition: 'Peligroso' },
    { range: '1.0 - 2.0', condition: 'Cuestionable' },
    { range: '2.0 - 4.0', condition: 'Bueno' },
    { range: '> 4.0', condition: 'Excelente' },
  ];

  const darReference = [
    { range: '< 1.0', condition: 'Malo' },
    { range: '1.0 - 1.25', condition: 'Cuestionable' },
    { range: '1.25 - 1.6', condition: 'Bueno' },
    { range: '> 1.6', condition: 'Excelente' },
  ];

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Valores de Referencia (IEEE Std 43-2013)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PI Reference Table */}
        <Table>
          <TableCaption className="text-xs text-muted-foreground mt-1">Referencia Índice de Polarización (PI)</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Valor PI</TableHead>
              <TableHead>Condición</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {piReference.map((item) => (
              <TableRow key={item.range}>
                <TableCell className="font-medium">{item.range}</TableCell>
                <TableCell>{item.condition}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* DAR Reference Table */}
        <Table>
          <TableCaption className="text-xs text-muted-foreground mt-1">Referencia Ratio de Absorción Dieléctrica (DAR)</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Valor DAR</TableHead>
              <TableHead>Condición</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {darReference.map((item) => (
              <TableRow key={item.range}>
                <TableCell className="font-medium">{item.range}</TableCell>
                <TableCell>{item.condition}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
