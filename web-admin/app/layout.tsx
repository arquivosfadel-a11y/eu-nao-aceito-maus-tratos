import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eu Não Aceito Maus Tratos",
  description: "Plataforma de denúncias de maus tratos a animais. Juntos podemos proteger quem não tem voz.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" translate="no" className="scroll-smooth">
      <body className={`${nunito.variable} font-[family-name:var(--font-nunito)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
