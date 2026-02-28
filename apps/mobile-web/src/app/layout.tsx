import type { Metadata } from "next";
import "./globals.css";

interface IRootLayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title: "LN Stocks - Activate Your TV",
  description: "Activate your LN Stocks TV app",
};

export default function RootLayout({ children }: IRootLayoutProps) {
  return (
    <html lang="en">
      <body className="bg-background text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
