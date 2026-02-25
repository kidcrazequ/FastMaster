/**
 * 数据库种子脚本
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 创建默认测试账户
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import path from 'path';

/**
 * 默认测试账户信息
 */
const DEFAULT_USER = {
  email: 'test@example.com',
  password: '123456',
  name: '测试用户',
  isPremium: true,  // 默认为高级用户
};

/**
 * 生成 cuid
 */
function generateCuid(): string {
  return randomBytes(12).toString('hex');
}

/**
 * 创建默认用户
 */
async function main() {
  console.log('开始创建默认账户...');

  // 获取数据库路径（prisma 目录下）
  const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db');
  console.log('数据库路径:', dbPath);

  // 连接数据库
  const db = new Database(dbPath);

  try {
    // 检查用户是否已存在
    const existingUser = db.prepare('SELECT * FROM User WHERE email = ?').get(DEFAULT_USER.email);

    if (existingUser) {
      console.log('默认账户已存在，更新为高级用户...');
      // 更新为高级用户
      db.prepare('UPDATE User SET isPremium = 1 WHERE email = ?').run(DEFAULT_USER.email);
      console.log(`  邮箱: ${DEFAULT_USER.email}`);
      console.log(`  密码: ${DEFAULT_USER.password}`);
      console.log(`  高级用户: 是`);
      return;
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(DEFAULT_USER.password, 10);

    // 生成 ID
    const userId = generateCuid();
    const now = new Date().toISOString();

    // 插入用户
    const stmt = db.prepare(`
      INSERT INTO User (id, email, password, name, isPremium, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(userId, DEFAULT_USER.email, hashedPassword, DEFAULT_USER.name, DEFAULT_USER.isPremium ? 1 : 0, now, now);

    console.log('默认账户创建成功:');
    console.log(`  邮箱: ${DEFAULT_USER.email}`);
    console.log(`  密码: ${DEFAULT_USER.password}`);
    console.log(`  姓名: ${DEFAULT_USER.name}`);
    console.log(`  高级用户: ${DEFAULT_USER.isPremium ? '是' : '否'}`);
  } finally {
    db.close();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error('创建默认账户失败:', e);
    process.exit(1);
  });
