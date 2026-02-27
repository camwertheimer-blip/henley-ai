import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Henley AI",
  description: "Democratizing Legal Access",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..96,300;0,9..96,400;0,9..96,500;0,9..96,600&family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen font-body text-[#e2e8f0] bg-[#0a0f1e]">
        {children}
      </body>
    </html>
  );
}
