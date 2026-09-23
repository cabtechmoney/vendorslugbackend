import type { Metadata } from 'next';
//import { Inter } from 'next/font/google';
import { ThemeProvider } from '../contexts/ThemeContext';
import { CartProvider } from '../contexts/CartContext';
import { AuthProvider } from '../contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import './globals.css';

//const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vendor Core - Marketplace Platform',
  description: 'The centralized merchant infrastructure for thrift stores.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              {children}
              <Toaster position="bottom-right" />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
