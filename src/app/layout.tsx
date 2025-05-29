
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link'; // Import Link for navigation
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar"; // Import Menubar components
import { cn } from '@/lib/utils';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Herramientas de Diagnóstico Eléctrico y Mecánico', // Updated title
  description: 'Herramientas prácticas para el diagnóstico de motores eléctricos y bombas de agua.', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={cn(
        geistSans.variable,
        geistMono.variable,
        "antialiased flex flex-col min-h-screen"
      )}>
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
           <div className="container flex h-14 items-center">
               <Menubar className="border-none shadow-none rounded-none bg-transparent">
                    <MenubarMenu>
                         <Link href="/" passHref legacyBehavior>
                           <MenubarTrigger>Inicio</MenubarTrigger>
                         </Link>
                     </MenubarMenu>
                   <MenubarMenu>
                       <MenubarTrigger>Documentación</MenubarTrigger>
                       <MenubarContent>
                            <MenubarSub>
                              <MenubarSubTrigger>Normas Técnicas</MenubarSubTrigger>
                              <MenubarSubContent>
                                <MenubarItem asChild>
                                  <Link href="/documentation/technical-standards/pi-dar-ieee-43-2000" className="w-full">
                                      PI - DAR - IEEE Std 43-2000
                                  </Link>
                                </MenubarItem>
                                <MenubarItem asChild>
                                  <Link href="/documentation/technical-standards/voltage-derating-nema-mg1" className="w-full">
                                      Desbalance de Voltaje - NEMA MG1
                                  </Link>
                                </MenubarItem>
                              </MenubarSubContent>
                            </MenubarSub>
                            <MenubarSub>
                              <MenubarSubTrigger>Tablas</MenubarSubTrigger>
                              <MenubarSubContent>
                                <MenubarItem disabled>Próximamente...</MenubarItem>
                              </MenubarSubContent>
                            </MenubarSub>
                            <MenubarSub>
                              <MenubarSubTrigger>Formatos</MenubarSubTrigger>
                              <MenubarSubContent>
                                <MenubarSub>
                                  <MenubarSubTrigger>Motores Eléctricos</MenubarSubTrigger>
                                  <MenubarSubContent>
                                    <MenubarItem asChild>
                                      <Link href="/documentation/formats/electric-motors/request-sheet" className="w-full">
                                        Forma Pedido de Motor
                                      </Link>
                                    </MenubarItem>
                                  </MenubarSubContent>
                                </MenubarSub>
                                <MenubarSub>
                                  <MenubarSubTrigger>Bombas</MenubarSubTrigger>
                                  <MenubarSubContent>
                                    <MenubarItem disabled>Próximamente...</MenubarItem>
                                  </MenubarSubContent>
                                </MenubarSub>
                              </MenubarSubContent>
                            </MenubarSub>
                       </MenubarContent>
                   </MenubarMenu>
                   <MenubarMenu>
                       <MenubarTrigger>Herramientas</MenubarTrigger>
                       <MenubarContent>
                         <MenubarSub>
                           <MenubarSubTrigger>Pruebas Eléctricas</MenubarSubTrigger>
                           <MenubarSubContent>
                             <MenubarItem asChild>
                               <Link href="/tools/electrical/insulation-resistance" className="w-full">
                                   Analizador Resistencia Aislamiento
                               </Link>
                             </MenubarItem>
                              <MenubarItem asChild>
                                <Link href="/tools/electrical/voltage-unbalance" className="w-full">
                                    Calculadora Desbalance de Voltaje
                                </Link>
                              </MenubarItem>
                           </MenubarSubContent>
                         </MenubarSub>
                         <MenubarSub>
                            <MenubarSubTrigger>Pruebas Mecanicas</MenubarSubTrigger>
                            <MenubarSubContent>
                                <MenubarItem disabled>Próximamente...</MenubarItem>
                            </MenubarSubContent>
                         </MenubarSub>
                       </MenubarContent>
                   </MenubarMenu>
                   <MenubarMenu>
                       <MenubarTrigger>Selectores</MenubarTrigger>
                       <MenubarContent>
                           <MenubarItem asChild>
                             {/* Updated link for pump selector */}
                             <Link href="/selectores/bombas-simples" className="w-full">
                               Selector Simple Bombas
                             </Link>
                           </MenubarItem>
                       </MenubarContent>
                   </MenubarMenu>
                   <MenubarMenu>
                       <MenubarTrigger>Configuración</MenubarTrigger>
                       <MenubarContent>
                           <MenubarItem asChild>
                             <Link href="/configuracion/agregar-bombas" className="w-full">
                               Agregar Bombas
                             </Link>
                           </MenubarItem>
                       </MenubarContent>
                   </MenubarMenu>
               </Menubar>
           </div>
        </header>
        <main className="flex-grow container py-6">
           {children}
        </main>
         <footer className="mt-auto py-4 border-t bg-secondary/50">
           <div className="container text-center text-xs text-muted-foreground">
             © 2025, desarrollado por{' '}
             <a
               href="https://www.linkedin.com/in/melvin-padilla-3425106"
               target="_blank"
               rel="noopener noreferrer"
               className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
             >
               Ing. Melvin E. Padilla
             </a>
             .
           </div>
         </footer>
      </body>
    </html>
  );
}
