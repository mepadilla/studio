
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
                         {/* Wrap MenubarTrigger in Link for Inicio, ensuring it points to '/' */}
                         <Link href="/" passHref legacyBehavior>
                           <MenubarTrigger>Inicio</MenubarTrigger>
                         </Link>
                         {/* No content needed as it links directly */}
                     </MenubarMenu>
                   <MenubarMenu>
                       {/* "Documentación" is now a trigger for a submenu */}
                       <MenubarTrigger>Documentación</MenubarTrigger>
                       <MenubarContent>
                           {/* "Normas Técnicas" is now a sub-trigger */}
                            <MenubarSub>
                              <MenubarSubTrigger>Normas Técnicas</MenubarSubTrigger>
                              <MenubarSubContent>
                                {/* Link to the PI/DAR IEEE standard page */}
                                <MenubarItem asChild>
                                  <Link href="/documentation/technical-standards/pi-dar-ieee-43-2000" className="w-full">
                                      PI - DAR - IEEE Std 43-2000
                                  </Link>
                                </MenubarItem>
                                 {/* Link to the new Voltage Derating NEMA MG1 page */}
                                <MenubarItem asChild>
                                  <Link href="/documentation/technical-standards/voltage-derating-nema-mg1" className="w-full">
                                      Desbalance de Voltaje - NEMA MG1
                                  </Link>
                                </MenubarItem>
                                {/* Add more technical standard links here */}
                              </MenubarSubContent>
                            </MenubarSub>
                           {/* New "Tablas" sub-menu */}
                            <MenubarSub>
                              <MenubarSubTrigger>Tablas</MenubarSubTrigger>
                              <MenubarSubContent>
                                <MenubarItem disabled>Próximamente...</MenubarItem>
                                {/* Add links to table documentation pages here */}
                              </MenubarSubContent>
                            </MenubarSub>
                           {/* New "Formatos" sub-menu, which is now a sub-trigger */}
                            <MenubarSub>
                              <MenubarSubTrigger>Formatos</MenubarSubTrigger>
                              <MenubarSubContent>
                                {/* Sub-menu for "Motores Eléctricos" */}
                                <MenubarSub>
                                  <MenubarSubTrigger>Motores Eléctricos</MenubarSubTrigger>
                                  <MenubarSubContent>
                                    <MenubarItem asChild>
                                      <Link href="/documentation/formats/electric-motors/request-sheet" className="w-full">
                                        Forma Pedido de Motor
                                      </Link>
                                    </MenubarItem>
                                    {/* Add more links to motor format pages here */}
                                  </MenubarSubContent>
                                </MenubarSub>
                                {/* Sub-menu for "Bombas" */}
                                <MenubarSub>
                                  <MenubarSubTrigger>Bombas</MenubarSubTrigger>
                                  <MenubarSubContent>
                                    <MenubarItem disabled>Próximamente...</MenubarItem>
                                    {/* Add links to pump format pages here */}
                                  </MenubarSubContent>
                                </MenubarSub>
                              </MenubarSubContent>
                            </MenubarSub>
                           {/* Add more documentation links here */}
                       </MenubarContent>
                   </MenubarMenu>
                   <MenubarMenu>
                       <MenubarTrigger>Herramientas</MenubarTrigger>
                       <MenubarContent>
                         <MenubarSub>
                           <MenubarSubTrigger>Pruebas Eléctricas</MenubarSubTrigger>
                           <MenubarSubContent>
                             {/* Link remains inside MenubarItem, updated href */}
                             <MenubarItem asChild>
                               <Link href="/tools/electrical/insulation-resistance" className="w-full">
                                   Analizador Resistencia Aislamiento
                               </Link>
                             </MenubarItem>
                              {/* New Link for Voltage Unbalance Calculator */}
                              <MenubarItem asChild>
                                <Link href="/tools/electrical/voltage-unbalance" className="w-full">
                                    Calculadora Desbalance de Voltaje
                                </Link>
                              </MenubarItem>
                             {/* Add more electrical tools here */}
                           </MenubarSubContent>
                         </MenubarSub>
                         <MenubarSub>
                            <MenubarSubTrigger>Pruebas Mecanicas</MenubarSubTrigger>
                            <MenubarSubContent>
                               {/* Add mechanical tools links here, e.g.:
                               <MenubarItem asChild>
                                 <Link href="/tools/mechanical/tool1" className="w-full">
                                     Herramienta Mecánica 1
                                 </Link>
                               </MenubarItem>
                               */}
                                <MenubarItem disabled>Próximamente...</MenubarItem>
                            </MenubarSubContent>
                         </MenubarSub>
                         {/* Add more tool categories here */}
                       </MenubarContent>
                   </MenubarMenu>
                   <MenubarMenu>
                       <MenubarTrigger>Selectores</MenubarTrigger>
                       <MenubarContent>
                           <MenubarItem disabled>Selector simple Panelli - Próximamente...</MenubarItem>
                           {/* Add selector links/submenus here */}
                       </MenubarContent>
                   </MenubarMenu>
               </Menubar>
           </div>
        </header>
        <main className="flex-grow container py-6"> {/* Add container and padding */}
           {children}
        </main>
         {/* Footer Added */}
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
