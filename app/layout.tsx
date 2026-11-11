import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "TypeFlow — Luyện gõ tiếng Việt & English",
  description: "Luyện gõ phím thông minh với lộ trình thích ứng cho tiếng Việt và tiếng Anh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={inter.variable}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
