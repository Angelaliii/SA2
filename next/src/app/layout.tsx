// src/app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../assets/globals.module.css";
import ThemeRegistry from "../components/ThemeRegistry";
import { AuthProvider } from "../hooks/useAuth"; // ✅ 加這行
import { NotificationProvider } from "../hooks/useNotifications"; // ✅ 加入通知提供者

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "社團企業媒合平台",
  description: "學校與企業合作媒合平台，提供特約商店、活動合作與實習合作機會",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeRegistry>
          <AuthProvider>
            <NotificationProvider>{children}</NotificationProvider>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
