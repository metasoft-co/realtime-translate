import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Realtime Translate MetasoftCo",
  description: "Realtime Translate MetasoftCo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`antialiased dark`}
      >
        {children}
      </body>
    </html>
  );
}
