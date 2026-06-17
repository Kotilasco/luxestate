import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZAI-CTS National Carbon Trading Platform",
  description: "Zimbabwe AI-Enhanced Carbon Trading Ecosystem"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
