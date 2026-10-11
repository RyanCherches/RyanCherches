import { appPath } from '../lib/app-path';
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Repertoire — The Music List",
  description: "Discover the hardest music. Submit a piece, earn your place, and climb the community rankings.",
  icons: {
    icon: appPath("/favicon.svg"),
    shortcut: appPath("/favicon.svg"),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
