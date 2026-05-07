import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PyQuiz — Python 면접 대비 퀴즈",
  description: "AI가 실시간으로 Python 면접 문제를 생성하고 답변을 평가해주는 학습 플랫폼",
  keywords: ["python", "면접", "퀴즈", "코딩테스트", "개발자"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#18181b",
              color: "#f4f4f5",
              border: "1px solid #3f3f46",
              borderRadius: "12px",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
