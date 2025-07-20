import QueryProvider from "@/components/QueryProvider";
import type { Metadata } from "next";
import { Roboto_Flex } from "next/font/google";
import "./globals.css";

const robotoFlex = Roboto_Flex({
  variable: "--font-roboto-flex",
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "RAD.FM",
  description: "THE MUSIC NEVER STOPS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${robotoFlex.variable} antialiased`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
