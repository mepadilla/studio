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
    { range: '< 1.0', condition: 'Dangerous' },
    { range: '1.0 - 2.0', condition: 'Questionable' },
    { range: '2.0 - 4.0', condition: 'Good' },
    { range: '> 4.0', condition: 'Excellent' },
  ];

  const darReference = [
    { range: '< 1.0', condition: 'Bad' },
    { range: '1.0 - 1.25', condition: 'Questionable' },
    { range: '1.25 - 1.6', condition: 'Good' },
    { range: '> 1.6', condition: 'Excellent' },
  ];

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Reference Values (IEEE Std 43-2013)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PI Reference Table */}
        <Table>
          <TableCaption className="text-xs text-muted-foreground mt-1">Polarization Index (PI) Reference</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">PI Value</TableHead>
              <TableHead>Condition</TableHead>
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
          <TableCaption className="text-xs text-muted-foreground mt-1">Dielectric Absorption Ratio (DAR) Reference</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">DAR Value</TableHead>
              <TableHead>Condition</TableHead>
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
