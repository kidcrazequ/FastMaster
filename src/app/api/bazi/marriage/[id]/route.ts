/**
 * 单个合婚分析 API
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 获取单个合婚分析详情
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/bazi/marriage/[id]
 * 获取单个合婚分析详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 验证用户登录
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      );
    }

    // 获取分析记录
    const analysis = await prisma.marriageAnalysis.findUnique({
      where: { id },
      include: {
        conversations: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: '记录不存在' },
        { status: 404 }
      );
    }

    // 验证权限
    if (analysis.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: '无权访问' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...analysis,
        person1Bazi: analysis.person1Bazi ? JSON.parse(analysis.person1Bazi) : null,
        person2Bazi: analysis.person2Bazi ? JSON.parse(analysis.person2Bazi) : null,
        result: analysis.result ? JSON.parse(analysis.result) : null,
      },
    });
  } catch (error) {
    console.error('获取分析详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取失败，请稍后重试' },
      { status: 500 }
    );
  }
}
