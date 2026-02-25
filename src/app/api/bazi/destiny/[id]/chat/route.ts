/**
 * 姻缘分析追问对话 API
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 处理用户对姻缘分析结果的追问
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { askDestinyFollowUp } from '@/lib/ai/deepseek';

/** 请求验证 Schema */
const chatRequestSchema = z.object({
  question: z.string().min(1, '请输入问题'),
});

/**
 * POST /api/bazi/destiny/[id]/chat
 * 发送追问消息
 */
export async function POST(
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

    // 解析请求数据
    const body = await request.json();
    const parseResult = chatRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: '请输入问题' },
        { status: 400 }
      );
    }

    const { question } = parseResult.data;

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

    // 解析分析结果
    const result = analysis.result ? JSON.parse(analysis.result) : null;
    const analysisContext = result?.aiAnalysis || '';

    // 构建历史对话
    const history = analysis.conversations.map((conv) => ({
      role: conv.role as 'user' | 'assistant',
      content: conv.content,
    }));

    // 调用 AI
    const answer = await askDestinyFollowUp(analysisContext, question, history);

    // 保存对话记录
    await prisma.destinyConversation.createMany({
      data: [
        {
          analysisId: id,
          role: 'user',
          content: question,
        },
        {
          analysisId: id,
          role: 'assistant',
          content: answer,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      data: {
        question,
        answer,
      },
    });
  } catch (error) {
    console.error('追问失败:', error);
    return NextResponse.json(
      { success: false, error: '回复生成失败，请稍后重试' },
      { status: 500 }
    );
  }
}
