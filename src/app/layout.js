import { Geist, Newsreader } from 'next/font/google';
import './globals.css';
const sans=Geist({variable:'--font-sans',subsets:['latin']});
const serif=Newsreader({variable:'--font-editorial',subsets:['latin']});
export const metadata={title:'Diputados · Explorador legislativo',description:'Representantes, comisiones, proyectos de ley y votaciones con datos abiertos del Congreso de Chile.'};
export default function RootLayout({children}) {return <html lang="es"><body className={sans.variable+' '+serif.variable}><a className="skip" href="#contenido">Saltar al contenido</a>{children}</body></html>;}
