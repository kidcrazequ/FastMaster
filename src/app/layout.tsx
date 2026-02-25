/**
 * 根布局
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 应用根布局，包含全局样式和 Provider
 */

import type { Metadata } from 'next';
import { Noto_Sans_SC } from 'next/font/google';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const notoSansSC = Noto_Sans_SC({
  variable: '--font-noto-sans-sc',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: '命理大师 - AI 智能八字合婚分析系统',
  description: '融合传统命理智慧与现代 AI 技术，为您提供专业、客观的八字合婚分析服务。',
  keywords: ['八字', '合婚', '命理', 'AI', '人工智能', '三生石', '问姻缘'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${notoSansSC.variable} font-sans antialiased`}>
        <SessionProvider>
          {children}
          <Toaster position="top-center" />
        </SessionProvider>
      </body>
    </html>
  );
}
