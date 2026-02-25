/**
 * NextAuth 类型扩展
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 扩展 NextAuth 的 Session 和 User 类型
 */

import 'next-auth';
import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      isPremium?: boolean;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    isPremium?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    isPremium?: boolean;
  }
}
