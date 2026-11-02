import type { Metadata } from "next";
import {
  Space_Grotesk,
  Inter,
  Lato,
  Syne,
  Instrument_Serif,
  Courier_Prime
} from "next/font/google";
import React from "react";

import Providers from "./providers";
import "./globals.css";

const space_grotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk"
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["100", "300", "400", "700", "900"],
  variable: "--font-inter"
});

const lato = Lato({
  subsets: ["latin"],
  display: "swap",
  weight: ["100", "300", "400", "700", "900"],
  variable: "--font-lato"
});

const syne = Syne({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne"
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  variable: "--font-instrument-serif",
  style: ["normal", "italic"]
});

const courierPrime = Courier_Prime({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  variable: "--font-courier-prime",
  style: ["normal"]
});

export const metadata: Metadata = {
  title: "Mago.studio",
  description: "Mago.studio",
  icons: {
    icon: process.env.NEXT_PUBLIC_FAVICON || "/favicon.ico"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${space_grotesk.variable} ${inter.variable} ${lato.variable} ${syne.variable} ${instrumentSerif.variable} ${courierPrime.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
