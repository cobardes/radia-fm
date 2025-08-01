import AppHeader from "@/components/AppHeader";
import I18nProvider from "@/components/I18nProvider";
import QueryProvider from "@/components/QueryProvider";
import type { Metadata } from "next";
import { Geist_Mono, Roboto_Flex } from "next/font/google";
import "./globals.css";

import "material-symbols";

const robotoFlex = Roboto_Flex({
  variable: "--font-roboto-flex",
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: "variable",
});

export const metadata: Metadata = {
  title: "rad(ia)",
  description: "the generative radio station",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${robotoFlex.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <I18nProvider>
            <div className="w-dvw h-dvh">
              <AppHeader />
              {children}
            </div>
          </I18nProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
