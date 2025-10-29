import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import SkipLink from "@/components/SkipLink";
import { I18nProvider } from "@/i18n/I18nProvider";
import { loadDictionary } from "@/i18n";
import { ENV } from "@/lib/env";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(ENV.SITE_URL),
  title: "식방",
  description: "나만의 레시피를 발견하고 저장하는 공간",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: '식방',
    description: '나만의 레시피를 발견하고 저장하는 공간',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: '식방' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og.png'],
  },
};

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const dict = await loadDictionary('ko');
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider locale={'ko'} dict={dict}>
          <Providers>
            <SkipLink />
            {children}
            {modal}
          </Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
