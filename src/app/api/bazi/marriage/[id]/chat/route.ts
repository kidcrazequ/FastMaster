/**
 * 合婚分析追问 API
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 处理合婚分析的 AI 追问对话
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { askFollowUp } from '@/lib/ai/agent';

/** 请求验证 Schema */
const chatRequestSchema = z.object({
  message: z.string().min(1, '请输入问题'),
});

/**
 * POST /api/bazi/marriage/[id]/chat
 * 发送追问
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
    const result = chatRequestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: '请输入问题' },
        { status: 400 }
      );
    }

    const { message } = result.data;

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

    // 构建对话历史
    const history = analysis.conversations.map((c) => ({
      role: c.role as 'user' | 'assistant',
      content: c.content,
    }));

    // 保存用户消息
    await prisma.conversation.create({
      data: {
        analysisId: id,
        role: 'user',
        content: message,
      },
    });

    console.log(`用户追问: ${message}`);

    // 调用 AI 生成回复
    const analysisContext = analysis.result as string || '';
    const aiResponse = await askFollowUp(analysisContext, message, history);

    // 保存 AI 回复
    await prisma.conversation.create({
      data: {
        analysisId: id,
        role: 'assistant',
        content: aiResponse,
      },
    });

    console.log('AI 回复生成完成');

    return NextResponse.json({
      success: true,
      data: {
        role: 'assistant',
        content: aiResponse,
      },
    });
  } catch (error) {
    console.error('追问失败:', error);
    return NextResponse.json(
      { success: false, error: '回复失败，请稍后重试' },
      { status: 500 }
    );
  }
}
