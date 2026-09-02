import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "E-Lelang — Platform Lelang Internal",
  description: "Platform lelang aset operasional perusahaan",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "E-Lelang",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full`}>
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)] antialiased">
        {children}
        <Toaster position="top-right" richColors theme="light" />
      </body>
    </html>
  );
}
