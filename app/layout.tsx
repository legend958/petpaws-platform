import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import type { ReactNode } from "react";
import { DemoRoleProvider } from "@/components/RoleProvider";
import TopNav from "@/components/TopNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PetPaws Platform",
  description: "Pet grooming services and products",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <DemoRoleProvider>
          <TopNav />
          <main className="flex-1">{children}</main>
          <footer className="py-6 text-center text-xs text-slate-400">
            PetPaws Platform — demo build for learning the full stack
          </footer>
        </DemoRoleProvider>
      </body>
    </html>
  );
}