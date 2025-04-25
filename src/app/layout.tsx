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
  title: 'Analizador de Resistencia de Aislamiento',
  description: 'Calcula PI y DAR para motores eléctricos.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es"> {/* Changed lang to Spanish */}
      <body className={cn(
        geistSans.variable,
        geistMono.variable,
        "antialiased flex flex-col min-h-screen"
      )}>
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
           <div className="container flex h-14 items-center">
               <Menubar className="border-none shadow-none rounded-none bg-transparent">
                   <MenubarMenu>
                       {/* Wrap MenubarTrigger in Link */}
                       <Link href="/documentation" passHref legacyBehavior>
                         <MenubarTrigger>Documentación</MenubarTrigger>
                       </Link>
                       {/* No content needed as it links directly */}
                   </MenubarMenu>
                   <MenubarMenu>
                       <MenubarTrigger>Herramientas</MenubarTrigger>
                       <MenubarContent>
                         <MenubarSub>
                           <MenubarSubTrigger>Pruebas Eléctricas</MenubarSubTrigger>
                           <MenubarSubContent>
                             {/* Link remains inside MenubarItem */}
                             <MenubarItem asChild>
                               <Link href="/" className="w-full">
                                   Analizador Resistencia Aislamiento
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
               </Menubar>
           </div>
        </header>
        <main className="flex-grow container py-6"> {/* Add container and padding */}
           {children}
        </main>
        <footer className="w-full py-4 px-6 mt-auto text-center text-xs text-muted-foreground bg-background border-t border-border">
          © 2025, Desarrollado por{' '}
          <Link
            href="https://www.linkedin.com/in/melvin-padilla-3425106"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Ing. Melvin E. Padilla
          </Link>
        </footer>
      </body>
    </html>
  );
}
