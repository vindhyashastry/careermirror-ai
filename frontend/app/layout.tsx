import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Lora, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "CareerMirror AI | Professional Strategy & ATS Intelligence",
  description: "Transform your career with AI-powered resume analysis, ATS scoring, and interactive practice. Get a professional strategy report and bridge your skill gaps today.",
  keywords: ["AI Career Coach", "ATS Scanner", "Resume Optimizer", "Interview Practice", "Career Strategy"],
  authors: [{ name: "CareerMirror Team" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { Toaster } from "sonner";
import { AIAssistant } from '@/components/shared/AIAssistant';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(
        fontSans.variable,
        fontSerif.variable,
        fontMono.variable,
        "font-sans antialiased bg-background text-foreground transition-colors duration-300"
      )}>
          {children}
          <AIAssistant />
          <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
