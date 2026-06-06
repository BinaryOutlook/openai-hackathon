import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Return Jury",
  description: "Multi-agent return dispute demo for marketplace operations"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
