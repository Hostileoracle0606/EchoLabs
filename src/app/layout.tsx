import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MockAuthProvider } from "@/contexts/mock-auth-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Momentum — AI Presentation Companion",
  description: "Real-time AI-powered presentation companion that visualizes, references, and summarizes as you speak.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased bg-[#f8fafc]`}
      >
        <MockAuthProvider>
          {children}
        </MockAuthProvider>
      </body>
    </html>
  );
}
