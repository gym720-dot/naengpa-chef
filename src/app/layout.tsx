import type { Metadata, Viewport } from "next";
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import "./globals.css";

// Initialize PWA Elements for web camera support
if (typeof window !== 'undefined') {
  defineCustomElements(window);
}

export const metadata: Metadata = {
  title: "냉파셰프",
  description: "냉장고 파먹기 요리 추천 초경량 앱",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
