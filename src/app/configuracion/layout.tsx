
"use client";

import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ShieldCheck, ShieldAlert } from 'lucide-react'; // Icons

const ADMIN_PASSWORD = "v63rt67823"; // La contraseña de administrador

export default function ConfiguracionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [error, setError] = useState('');

  const handlePasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordAttempt === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Contraseña incorrecta. Inténtalo de nuevo.');
      setPasswordAttempt('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-220px)]">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="bg-primary text-primary-foreground">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="h-7 w-7" />
              <CardTitle className="text-2xl">Acceso Restringido</CardTitle>
            </div>
            <CardDescription className="text-primary-foreground/90 mt-1">
              Esta sección requiere una contraseña de administrador.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handlePasswordSubmit}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña de Administrador</Label>
                <Input
                  id="password"
                  type="password"
                  value={passwordAttempt}
                  onChange={(e) => setPasswordAttempt(e.target.value)}
                  placeholder="Introduce la contraseña"
                  className={error ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive flex items-center">
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  {error}
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                Acceder
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
