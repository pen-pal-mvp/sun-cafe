import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sun Cafe (순카페)",
  description: "日韓Web文通プラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      {/* 
        ここで body タグに余計な flex や items-center が
        付いていたのが原因だと考えられるため、シンプルな構造に修正 
      */}
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}