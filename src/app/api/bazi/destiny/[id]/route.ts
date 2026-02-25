/**
 * 单个姻缘分析 API
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 获取和更新单个姻缘分析记录
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/bazi/destiny/[id]
 * 获取单个姻缘分析结果
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
    const analysis = await prisma.destinyAnalysis.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        conversations: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: '分析记录不存在' },
        { status: 404 }
      );
    }

    // 解析 JSON 数据
    const result = analysis.result ? JSON.parse(analysis.result) : null;
    const bazi = analysis.bazi ? JSON.parse(analysis.bazi) : null;

    return NextResponse.json({
      success: true,
      data: {
        id: analysis.id,
        name: analysis.name,
        gender: analysis.gender,
        birthDate: analysis.birthDate,
        bazi,
        result,
        conversations: analysis.conversations,
        createdAt: analysis.createdAt,
      },
    });
  } catch (error) {
    console.error('获取分析结果失败:', error);
    return NextResponse.json(
      { success: false, error: '获取失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bazi/destiny/[id]
 * 删除姻缘分析记录
 */
export async function DELETE(
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

    // 删除记录
    await prisma.destinyAnalysis.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除分析记录失败:', error);
    return NextResponse.json(
      { success: false, error: '删除失败，请稍后重试' },
      { status: 500 }
    );
  }
}
