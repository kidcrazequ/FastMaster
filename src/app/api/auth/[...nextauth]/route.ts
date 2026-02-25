/**
 * NextAuth API 路由
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: NextAuth.js 认证 API 处理
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
