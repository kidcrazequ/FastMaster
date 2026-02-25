/**
 * Session Provider 组件
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: NextAuth Session Provider 封装
 */

'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

interface SessionProviderProps {
  children: React.ReactNode;
}

/**
 * Session Provider
 * @param props - 组件属性
 */
export function SessionProvider({ children }: SessionProviderProps) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
