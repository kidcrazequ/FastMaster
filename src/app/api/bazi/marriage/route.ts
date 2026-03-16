/**
 * 合婚分析 API
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 处理合婚分析请求，计算八字并生成分析结果
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculatePersonBazi, formatSiZhu } from '@/lib/bazi/calculator';
import { analyzeMarriage } from '@/lib/bazi/marriage';
import { generateMarriageAnalysis, reviewAndPolish } from '@/lib/ai/agent';
import { logger } from '@/lib/ai/agent-logger';

/** AI 分析涉及两次串行调用（Agent 分析 + 润色），需要足够的超时时间 */
export const maxDuration = 120;

/** 个人信息 Schema */
const personRequestSchema = z.object({
  name: z.string().min(1),
  gender: z.enum(['male', 'female']),
  birthYear: z.string(),
  birthMonth: z.string(),
  birthDay: z.string(),
  knowBirthTime: z.boolean().default(false),
  birthHour: z.string().optional(),
  birthMinute: z.string().optional(),
  birthPlace: z.string().optional(),
  isEarlyZiHour: z.boolean().optional(),
});

/** 请求验证 Schema */
const marriageRequestSchema = z.object({
  person1: personRequestSchema,
  person2: personRequestSchema,
});

/**
 * POST /api/bazi/marriage
 * 执行合婚分析
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
    const result = marriageRequestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: '请求数据格式错误' },
        { status: 400 }
      );
    }

    const { person1: p1Data, person2: p2Data } = result.data;

    /**
     * 构建出生日期时间
     * @param personData - 个人信息数据
     * @returns 出生日期对象和是否知道时间
     */
    const buildBirthDate = (personData: z.infer<typeof personRequestSchema>) => {
      const year = parseInt(personData.birthYear);
      const month = parseInt(personData.birthMonth) - 1;
      const day = parseInt(personData.birthDay);
      
      let hour = 12; // 默认中午12点（如果不知道出生时间）
      let minute = 0;
      let knowTime = false;
      
      if (personData.knowBirthTime && personData.birthHour) {
        hour = parseInt(personData.birthHour);
        minute = personData.birthMinute ? parseInt(personData.birthMinute) : 0;
        knowTime = true;
        
        // 早晚子时处理：如果是23点且选择了晚子时（isEarlyZiHour = false），日期不变
        // 如果是0点且选择了早子时（isEarlyZiHour = true），日期减一天
        // 这里简化处理，实际计算在 calculator 中处理
      }
      
      return {
        birthDate: new Date(year, month, day, hour, minute),
        knowBirthTime: knowTime,
        isEarlyZiHour: personData.isEarlyZiHour,
        birthPlace: personData.birthPlace,
      };
    };

    const birth1Info = buildBirthDate(p1Data);
    const birth2Info = buildBirthDate(p2Data);
    
    const birth1 = birth1Info.birthDate;
    const birth2 = birth2Info.birthDate;

    console.log(`开始合婚分析: ${p1Data.name} & ${p2Data.name}`);
    console.log(`${p1Data.name} 知道出生时间: ${birth1Info.knowBirthTime}, 地点: ${birth1Info.birthPlace || '未填写'}`);
    console.log(`${p2Data.name} 知道出生时间: ${birth2Info.knowBirthTime}, 地点: ${birth2Info.birthPlace || '未填写'}`);

    // 计算八字（传递是否知道时间的信息）
    const person1Bazi = calculatePersonBazi(
      p1Data.name, 
      p1Data.gender, 
      birth1,
      birth1Info.knowBirthTime,
      birth1Info.isEarlyZiHour
    );
    const person2Bazi = calculatePersonBazi(
      p2Data.name, 
      p2Data.gender, 
      birth2,
      birth2Info.knowBirthTime,
      birth2Info.isEarlyZiHour
    );

    console.log(`${p1Data.name} 八字: ${formatSiZhu(person1Bazi.siZhu)}${!birth1Info.knowBirthTime ? ' (时柱未知)' : ''}`);
    console.log(`${p2Data.name} 八字: ${formatSiZhu(person2Bazi.siZhu)}${!birth2Info.knowBirthTime ? ' (时柱未知)' : ''}`);

    // 执行合婚分析
    const analysisResult = analyzeMarriage(person1Bazi, person2Bazi);

    // 生成 AI 分析报告
    const aiAnalysis = await generateMarriageAnalysis(analysisResult);
    analysisResult.aiAnalysis = aiAnalysis;

    // 保存原始分析结果并立即返回
    const analysis = await prisma.marriageAnalysis.create({
      data: {
        userId: session.user.id,
        person1Name: p1Data.name,
        person1Birth: birth1,
        person1Gender: p1Data.gender,
        person1Bazi: JSON.stringify(person1Bazi),
        person2Name: p2Data.name,
        person2Birth: birth2,
        person2Gender: p2Data.gender,
        person2Bazi: JSON.stringify(person2Bazi),
        result: JSON.stringify(analysisResult),
        overallScore: analysisResult.overallScore,
      },
    });

    logger.info(`合婚分析完成，ID: ${analysis.id}，总分: ${analysisResult.overallScore}，先返回结果`);

    // 后台异步润色，不阻塞响应
    if (process.env.SKIP_REVIEW !== 'true') {
      reviewAndPolish(aiAnalysis, '合婚')
        .then(async (polished) => {
          analysisResult.aiAnalysis = polished;
          await prisma.marriageAnalysis.update({
            where: { id: analysis.id },
            data: {
              result: JSON.stringify(analysisResult),
            },
          });
          logger.info(`合婚分析 ${analysis.id} 后台润色完成，已更新数据库`);
        })
        .catch((err) => {
          logger.warn(`合婚分析 ${analysis.id} 后台润色失败:`, err);
        });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: analysis.id,
        overallScore: analysisResult.overallScore,
      },
    });
  } catch (error) {
    console.error('合婚分析失败:', error);
    return NextResponse.json(
      { success: false, error: '分析失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bazi/marriage
 * 获取用户的合婚分析历史
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
    const analyses = await prisma.marriageAnalysis.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        person1Name: true,
        person2Name: true,
        overallScore: true,
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
