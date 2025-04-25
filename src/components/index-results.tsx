"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface IndexResultsProps {
  pi: number | null;
  dar: number | null;
  getCondition: (value: number, type: 'PI' | 'DAR') => string;
}

export function IndexResults({ pi, dar, getCondition }: IndexResultsProps) {
  const getBadgeVariant = (condition: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (condition.toLowerCase()) {
      case 'excelente':
      case 'bueno':
        return 'default'; // Using default which often maps to primary (Greenish/Blueish usually)
      case 'cuestionable':
        return 'secondary'; // Use secondary for warning/questionable (Yellowish/Orangeish)
      case 'malo':
      case 'peligroso':
        return 'destructive'; // Use destructive for bad/dangerous (Reddish)
      default:
        return 'outline';
    }
  };


  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Índices Calculados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-medium text-foreground">Índice de Polarización (PI):</span>
          {pi !== null ? (
            <div className="text-right">
              <span className="text-lg font-semibold text-primary mr-2">
                 {isFinite(pi) ? pi.toFixed(2) : '∞'} {/* Handle Infinity */}
              </span>
               <Badge variant={getBadgeVariant(getCondition(pi, 'PI'))}>
                  {getCondition(pi, 'PI')}
               </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">N/D</span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium text-foreground">Ratio de Absorción Dieléctrica (DAR):</span>
          {dar !== null ? (
             <div className="text-right">
              <span className="text-lg font-semibold text-primary mr-2">
                {isFinite(dar) ? dar.toFixed(2) : '∞'} {/* Handle Infinity */}
              </span>
               <Badge variant={getBadgeVariant(getCondition(dar, 'DAR'))}>
                 {getCondition(dar, 'DAR')}
               </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">N/D</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
