import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CyberForum - Modernes Webforum",
  description:
    "Ein modernes Webforum entwickelt als MVP im Rahmen des IU-Studienprojekts",
  keywords: ["Forum", "Community", "Diskussion", "Next.js", "React"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // TODO: Session aus iron-session laden
  const user = null;

  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen flex-col`}
      >
        <Header user={user} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
