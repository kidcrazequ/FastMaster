/**
 * 姻缘分析 API
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 处理个人姻缘分析请求，计算八字并生成分析结果
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculatePersonBazi, formatSiZhu } from '@/lib/bazi/calculator';
import { generateDestinyAnalysis, type DestinyAnalysisData } from '@/lib/ai/deepseek';

/** 请求验证 Schema */
const destinyRequestSchema = z.object({
  name: z.string().min(1),
  gender: z.enum(['male', 'female']),
  isLunarCalendar: z.boolean().default(false),
  isLeapMonth: z.boolean().default(false),
  birthYear: z.string(),
  birthMonth: z.string(),
  birthDay: z.string(),
  knowBirthTime: z.boolean().default(false),
  birthHour: z.string().optional(),
  birthMinute: z.string().optional(),
  birthPlace: z.string().optional(),
  useTrueSolarTime: z.boolean().default(false),
  isEarlyZiHour: z.boolean().optional(),
});

/**
 * POST /api/bazi/destiny
 * 执行姻缘分析
 */
export async function POST(request: NextRequest) {
  try {
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
    const result = destinyRequestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: '请求数据格式错误' },
        { status: 400 }
      );
    }

    const personData = result.data;

    // 构建出生日期
    const year = parseInt(personData.birthYear);
    const month = parseInt(personData.birthMonth) - 1;
    const day = parseInt(personData.birthDay);
    
    let hour = 12; // 默认中午12点
    let minute = 0;
    let knowTime = false;
    
    if (personData.knowBirthTime && personData.birthHour) {
      hour = parseInt(personData.birthHour);
      minute = personData.birthMinute ? parseInt(personData.birthMinute) : 0;
      knowTime = true;
    }
    
    const birthDate = new Date(year, month, day, hour, minute);

    console.log(`开始姻缘分析: ${personData.name}`);
    console.log(`知道出生时间: ${knowTime}, 地点: ${personData.birthPlace || '未填写'}`);

    // 计算八字
    const personBazi = calculatePersonBazi(
      personData.name, 
      personData.gender, 
      birthDate,
      knowTime,
      personData.isEarlyZiHour
    );

    console.log(`${personData.name} 八字: ${formatSiZhu(personBazi.siZhu)}${!knowTime ? ' (时柱未知)' : ''}`);

    // 准备 AI 分析数据
    const analysisData: DestinyAnalysisData = {
      name: personData.name,
      gender: personData.gender,
      siZhu: personBazi.siZhu,
      riYuan: personBazi.riYuan,
      riYuanWuXing: personBazi.riYuanWuXing,
      wuXingCount: personBazi.wuXingCount,
      knowBirthTime: knowTime,
    };

    // 生成 AI 分析报告
    const aiAnalysis = await generateDestinyAnalysis(analysisData);

    // 保存分析记录
    const analysis = await prisma.destinyAnalysis.create({
      data: {
        userId: session.user.id,
        name: personData.name,
        gender: personData.gender,
        birthDate: birthDate,
        bazi: JSON.stringify(personBazi),
        result: JSON.stringify({
          ...analysisData,
          aiAnalysis,
        }),
      },
    });

    console.log(`姻缘分析完成，ID: ${analysis.id}`);

    return NextResponse.json({
      success: true,
      data: {
        id: analysis.id,
      },
    });
  } catch (error) {
    console.error('姻缘分析失败:', error);
    return NextResponse.json(
      { success: false, error: '分析失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bazi/destiny
 * 获取用户的姻缘分析历史
 */
export async function GET() {
  try {
    // 验证用户登录
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      );
    }

    // 获取分析历史
    const analyses = await prisma.destinyAnalysis.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        gender: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: analyses,
    });
  } catch (error) {
    console.error('获取历史记录失败:', error);
    return NextResponse.json(
      { success: false, error: '获取失败，请稍后重试' },
      { status: 500 }
    );
  }
}
