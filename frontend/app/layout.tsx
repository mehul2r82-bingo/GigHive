import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import OneSignalInit from "@/components/OneSignalInit";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GigHive — Campus Task Marketplace",
  description: "Student micro-gig & escrow task marketplace",
  manifest: "/manifest.json",
  icons: {
    icon: "/gighive_icon_512.png",
    apple: "/gighive_icon_512.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#09090B]">
        <AuthProvider>
          <OneSignalInit />
          <Navbar />
          {children}
          <PWAInstallPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}
