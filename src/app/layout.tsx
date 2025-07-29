import QueryProvider from "@/components/QueryProvider";
import type { Metadata } from "next";
import { Geist_Mono, Roboto_Flex } from "next/font/google";
import "./globals.css";

import "material-symbols";
import Link from "next/link";

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
          <div className="w-dvh h-dvh">
            <div className="fixed left-0 top-0 p-3.5 px-4.5 z-40">
              <Link href="/" className="font-mono font-semibold tracking-tight">
                <span>
                  rad(ia){" "}
                  <span className="text-xs text-black/60 font-normal">
                    experimental
                  </span>
                </span>
              </Link>
            </div>
            {children}
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
