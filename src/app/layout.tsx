import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Link from 'next/link'; // Import Link for navigation

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <main className="flex-grow">
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
