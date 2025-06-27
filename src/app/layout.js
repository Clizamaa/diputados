import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Diputados de Chile",
  description: "Información actualizada sobre los diputados de la República de Chile.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} antialiased`}>
        <header className="py-4 px-8 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Diputados de Chile</h1>
        </header>
        <main>{children}</main>
        <footer className="text-center py-4 mt-8 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-500">
          <p>Desarrollado con Next.js. Datos obtenidos de opendata.camara.cl.</p>
        </footer>
      </body>
    </html>
  );
}
