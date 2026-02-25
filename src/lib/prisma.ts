/**
 * Prisma 客户端封装
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 提供全局单例 Prisma 客户端
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * 创建 Prisma 客户端
 */
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

/**
 * 全局 Prisma 客户端实例
 * 在开发环境中复用连接，避免热重载导致的连接过多问题
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
