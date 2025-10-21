import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import "./globals.css";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "LinkedIn Accelerator - AI-Powered Professional Content",
  description: "Amplify your professional brand with AI-generated LinkedIn content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
