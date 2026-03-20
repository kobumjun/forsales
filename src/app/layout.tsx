import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/Toaster";

export const metadata: Metadata = {
  title: "DWAD - 외주 고객응대 답변 추천",
  description:
    "스크린샷 한 장으로 실전 답변 3개. 프리랜서·외주 개발자·세일즈맨을 위한 고객응대 답변 추천 SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
