import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { getAppStatus } from "@/lib/session";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // App-Status laden (Session + DB-Verbindung)
  const { session, dbConnected } = await getAppStatus();

  // User-Objekt für Header erstellen (nur wenn eingeloggt)
  const user = session.isLoggedIn
    ? {
        id: session.userId!,
        username: session.username!,
        role: session.role!,
      }
    : null;

  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen flex-col`}
      >
        <Header user={user} dbConnected={dbConnected} />
        <main className="flex-1 my-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
