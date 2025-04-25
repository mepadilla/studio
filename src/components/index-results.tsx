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
      case 'excellent':
      case 'good':
        return 'default'; // Using default which often maps to primary
      case 'questionable':
        return 'secondary'; // Use secondary for warning/questionable
      case 'bad':
      case 'dangerous':
        return 'destructive'; // Use destructive for bad/dangerous
      default:
        return 'outline';
    }
  };


  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Calculated Indices</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-medium text-foreground">Polarization Index (PI):</span>
          {pi !== null ? (
            <div className="text-right">
              <span className="text-lg font-semibold text-primary mr-2">{pi.toFixed(2)}</span>
               <Badge variant={getBadgeVariant(getCondition(pi, 'PI'))}>
                  {getCondition(pi, 'PI')}
               </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">N/A</span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium text-foreground">Dielectric Absorption Ratio (DAR):</span>
          {dar !== null ? (
             <div className="text-right">
              <span className="text-lg font-semibold text-primary mr-2">{dar.toFixed(2)}</span>
               <Badge variant={getBadgeVariant(getCondition(dar, 'DAR'))}>
                 {getCondition(dar, 'DAR')}
               </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">N/A</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
