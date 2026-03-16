/**
 * 命理大师 Agent
 * Author: zhi.qu
 * Date: 2026-03-16
 * Description: 基于知识库和增强计算引擎的命理分析 Agent，替代原有的简单 DeepSeek 调用
 */

import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import type { MarriageAnalysisResult, Gender, WuXingCount } from '@/types/bazi';
import type { DestinyAnalysisData } from './deepseek';

export type { DestinyAnalysisData } from './deepseek';
import { formatSiZhu } from '@/lib/bazi/calculator';
import { calculateShiShenChart, type ShiShenChart } from '@/lib/bazi/shi-shen';
import { calculateShenSha, type ShenShaResult } from '@/lib/bazi/shen-sha';
import { calculateStrength, type StrengthResult } from '@/lib/bazi/strength';
import { calculateDaYun, analyzeMarriageDaYun, type DaYunResult } from '@/lib/bazi/da-yun';
import { getNaYin, analyzeNaYinMarriage, type NaYinInfo, type NaYinMarriageResult } from '@/lib/bazi/na-yin';
import {
  buildMarriageSystemPrompt,
  buildDestinySystemPrompt,
  buildFollowUpSystemPrompt,
  buildReviewSystemPrompt,
} from './prompts';

import { logger } from './agent-logger';

/** AI 客户端实例（支持 OpenAI 兼容 API） */
function createClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY || '',
    baseURL: process.env.AI_BASE_URL || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    timeout: 90_000,
  });
}

/** 获取模型名称 */
function getModelName(): string {
  return process.env.AI_MODEL || 'deepseek-chat';
}

/**
 * 流式调用 AI，避免长时间无数据导致 TCP read ETIMEDOUT
 * 数据持续流入，TCP 连接不会因为 idle 超时断开
 */
async function streamChat(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const client = createClient();
  const stream = await client.chat.completions.create({
    model: getModelName(),
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 4000,
    stream: true,
  });

  let content = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) content += delta;
  }
  return content;
}

/**
 * 经典书籍按分析类型分组加载，控制 prompt 大小避免 API 超时
 * 每类只加载 2 本最核心的书（约 500-600 行），配合知识文件使用
 */
const BOOK_FILES_BY_TYPE = {
  /** 合婚分析：合婚实战 + 干支合冲婚姻 */
  marriage: [
    'books/ba-zi-he-hun-shi-zhan.md',
    'books/gan-zhi-he-hun.md',
  ],
  /** 姻缘分析：预测配偶 + 婚姻实战密码 */
  destiny: [
    'books/xian-dai-yu-ce-pei-ou.md',
    'books/ba-zi-hun-yin-mi-ma.md',
  ],
  /** 追问对话：预测配偶（精简核心） */
  followUp: [
    'books/xian-dai-yu-ce-pei-ou.md',
  ],
} as const;

/** 知识文件路径映射 */
const KNOWLEDGE_FILES = {
  marriage: [
    'shi-shen-hun-yin.md',
    'he-hun-fa-ze.md',
    'wu-xing-hun-pei.md',
    'hun-yin-gong-wei.md',
    'shen-sha-yin-yuan.md',
    'na-yin-he-hun.md',
    'da-yun-liu-nian.md',
  ],
  destiny: [
    'shi-shen-hun-yin.md',
    'wu-xing-hun-pei.md',
    'hun-yin-gong-wei.md',
    'shen-sha-yin-yuan.md',
    'tao-hua-yun.md',
    'da-yun-liu-nian.md',
  ],
  followUp: [
    'shi-shen-hun-yin.md',
    'wu-xing-hun-pei.md',
    'hun-yin-gong-wei.md',
  ],
} as const;

/** 知识缓存 */
const knowledgeCache = new Map<string, string>();

/** 书籍缓存（按分析类型分别缓存） */
const booksCache = new Map<string, string>();

/**
 * 加载经典书籍知识（按分析类型加载相关书籍）
 * @param analysisType - 分析类型
 * @returns 合并后的书籍知识内容
 */
async function loadBooks(analysisType: 'marriage' | 'destiny' | 'followUp'): Promise<string> {
  if (booksCache.has(analysisType)) {
    return booksCache.get(analysisType)!;
  }

  const bookFiles = BOOK_FILES_BY_TYPE[analysisType];
  const knowledgeDir = path.join(process.cwd(), 'src', 'lib', 'ai', 'knowledge');
  const contents: string[] = [];

  for (const fileName of bookFiles) {
    try {
      const filePath = path.join(knowledgeDir, fileName);
      const content = await fs.readFile(filePath, 'utf-8');
      contents.push(content);
      logger.info(`书籍加载成功: ${fileName}`);
    } catch (error) {
      logger.warn(`书籍文件加载失败: ${fileName}`, error);
    }
  }

  const merged = contents.join('\n\n---\n\n');
  booksCache.set(analysisType, merged);
  logger.info(`${analysisType}分析共加载 ${contents.length} 本相关书籍`);
  return merged;
}

/**
 * 加载知识文件
 * @param fileNames - 知识文件名列表
 * @returns 合并后的知识内容
 */
async function loadKnowledge(fileNames: readonly string[]): Promise<string> {
  const cacheKey = fileNames.join(',');
  if (knowledgeCache.has(cacheKey)) {
    return knowledgeCache.get(cacheKey)!;
  }

  const knowledgeDir = path.join(process.cwd(), 'src', 'lib', 'ai', 'knowledge');
  const contents: string[] = [];

  for (const fileName of fileNames) {
    try {
      const filePath = path.join(knowledgeDir, fileName);
      const content = await fs.readFile(filePath, 'utf-8');
      contents.push(content);
    } catch (error) {
      logger.warn(`知识文件加载失败: ${fileName}`, error);
    }
  }

  const merged = contents.join('\n\n---\n\n');
  knowledgeCache.set(cacheKey, merged);
  return merged;
}

/**
 * DeepSeek 审校润色：对命理大师的分析结果进行语病检查和内容润色
 * 不会自行扩展分析，只做语言层面的优化
 * @param rawAnalysis - 命理大师的原始分析报告
 * @param analysisType - 分析类型
 * @returns 润色后的报告
 */
async function reviewAndPolish(rawAnalysis: string, analysisType: '合婚' | '姻缘'): Promise<string> {
  try {
    const systemPrompt = buildReviewSystemPrompt(analysisType);

    logger.info(`调用 DeepSeek 审校润色${analysisType}分析报告`);

    const polished = await streamChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: rawAnalysis },
      ],
      { temperature: 0.3, maxTokens: 4000 }
    );
    if (!polished) {
      logger.warn('DeepSeek 审校返回为空，使用原始分析');
      return rawAnalysis;
    }

    logger.info(`${analysisType}分析报告审校润色完成`);
    return polished;
  } catch (error) {
    logger.warn('DeepSeek 审校润色失败，使用原始分析:', error);
    return rawAnalysis;
  }
}

/** 个人完整命理数据 */
interface PersonFullData {
  name: string;
  gender: Gender;
  siZhuStr: string;
  riYuan: string;
  riYuanWuXing: string;
  wuXingCount: WuXingCount;
  shiShenChart: ShiShenChart;
  shenSha: ShenShaResult;
  strength: StrengthResult;
  daYun: DaYunResult;
  naYin: NaYinInfo | null;
}

/**
 * 从 PersonBazi 计算完整命理数据
 */
function calculateFullData(
  person: MarriageAnalysisResult['person1']
): PersonFullData {
  const { name, gender, siZhu, riYuan, riYuanWuXing, wuXingCount, birthDate } = person;

  const shiShenChart = calculateShiShenChart(siZhu, gender);
  const shenSha = calculateShenSha(siZhu);
  const strength = calculateStrength(siZhu);
  const daYun = calculateDaYun(siZhu, gender, birthDate);
  const naYin = getNaYin(siZhu.year.tianGan, siZhu.year.diZhi);

  return {
    name,
    gender,
    siZhuStr: formatSiZhu(siZhu),
    riYuan,
    riYuanWuXing,
    wuXingCount,
    shiShenChart,
    shenSha,
    strength,
    daYun,
    naYin,
  };
}

/**
 * 格式化个人命理数据为文本
 */
function formatPersonData(data: PersonFullData): string {
  const { shiShenChart, shenSha, strength, daYun, naYin } = data;

  const lines: string[] = [];
  lines.push(`### ${data.name}（${data.gender === 'male' ? '男' : '女'}）`);
  lines.push(`- 八字：${data.siZhuStr}`);
  lines.push(`- 日元：${data.riYuan}（${data.riYuanWuXing}）`);
  lines.push(`- 五行分布：金${data.wuXingCount.金} 木${data.wuXingCount.木} 水${data.wuXingCount.水} 火${data.wuXingCount.火} 土${data.wuXingCount.土}`);

  // 身强弱
  lines.push(`- 身强弱：${strength.strength}（${strength.description}）`);

  // 年柱纳音
  if (naYin) {
    lines.push(`- 年命纳音：${naYin.name}（${naYin.wuXing}）- ${naYin.description}`);
  }

  // 十神排盘
  lines.push('');
  lines.push('**十神排盘：**');
  lines.push(`- 年干：${shiShenChart.yearGan.tianGan}（${shiShenChart.yearGan.shiShen}）`);
  lines.push(`- 月干：${shiShenChart.monthGan.tianGan}（${shiShenChart.monthGan.shiShen}）`);
  lines.push(`- 日干：${shiShenChart.dayGan.tianGan}（日元）`);
  lines.push(`- 时干：${shiShenChart.hourGan.tianGan}（${shiShenChart.hourGan.shiShen}）`);

  // 日支藏干（婚姻宫）
  const dayZhiCG = shiShenChart.dayZhiCangGan;
  const dayZhiDesc = dayZhiCG.cangGan.map((cg) => `${cg.gan}(${cg.shiShen})`).join('、');
  lines.push(`- 日支（婚姻宫）藏干：${dayZhiDesc}`);

  // 配偶星
  const sp = shiShenChart.spouseStar;
  lines.push('');
  lines.push('**配偶星信息：**');
  lines.push(`- 主配偶星：${sp.mainStar}（命局中有 ${sp.mainStarCount} 个）`);
  lines.push(`- 副配偶星：${sp.secondaryStar}（命局中有 ${sp.secondaryStarCount} 个）`);
  lines.push(`- 配偶星是否在婚姻宫：${sp.inMarriagePalace ? '是' : '否'}`);

  // 十神统计
  const countStr = Object.entries(shiShenChart.count)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k}:${v}`)
    .join(' ');
  lines.push(`- 十神统计：${countStr}`);

  // 神煞
  lines.push('');
  lines.push('**神煞信息：**');
  if (shenSha.taoHua.length > 0) {
    lines.push(`- 桃花：${shenSha.taoHua.map((t) => `${t.position}(${t.description})`).join('；')}`);
  } else {
    lines.push('- 桃花：命局中无桃花');
  }
  if (shenSha.hongLuan) {
    lines.push(`- 红鸾：${shenSha.hongLuan.description}`);
  }
  if (shenSha.tianXi) {
    lines.push(`- 天喜：${shenSha.tianXi.description}`);
  }
  if (shenSha.guChen) {
    lines.push(`- 孤辰：${shenSha.guChen.description}`);
  }
  if (shenSha.guaSu) {
    lines.push(`- 寡宿：${shenSha.guaSu.description}`);
  }
  if (shenSha.huaGai.length > 0) {
    lines.push(`- 华盖：${shenSha.huaGai.map((h) => h.description).join('；')}`);
  }
  if (shenSha.tianYiGuiRen.length > 0) {
    lines.push(`- 天乙贵人：${shenSha.tianYiGuiRen.map((t) => t.description).join('；')}`);
  }
  lines.push(`- 姻缘神煞综合：${shenSha.summary.marriageFavorability}`);

  // 大运
  lines.push('');
  lines.push('**大运信息：**');
  lines.push(`- ${daYun.description}`);
  if (daYun.currentStep) {
    lines.push(`- 当前大运：${daYun.currentStep.ganZhiStr}（${daYun.currentStep.startAge}-${daYun.currentStep.endAge}岁）`);
  }
  const marriageDaYun = analyzeMarriageDaYun(daYun, data.riYuanWuXing, data.gender);
  for (const desc of marriageDaYun) {
    lines.push(`- ${desc}`);
  }

  return lines.join('\n');
}

/**
 * 生成合婚分析报告（命理大师 Agent 版本）
 * @param result - 合婚分析结果（含基础计算数据）
 * @returns AI 生成的专业分析报告
 */
export async function generateMarriageAnalysis(result: MarriageAnalysisResult): Promise<string> {
  const apiKey = process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    logger.warn('AI API Key 未配置，返回模拟分析');
    return generateMockMarriageAnalysis(result);
  }

  try {
    // 1. 计算完整命理数据
    const person1Data = calculateFullData(result.person1);
    const person2Data = calculateFullData(result.person2);

    // 2. 纳音合婚
    let naYinResult: NaYinMarriageResult | null = null;
    if (person1Data.naYin && person2Data.naYin) {
      naYinResult = analyzeNaYinMarriage(person1Data.naYin, person2Data.naYin);
    }

    // 3. 加载知识库和合婚相关书籍
    const [knowledge, books] = await Promise.all([
      loadKnowledge(KNOWLEDGE_FILES.marriage),
      loadBooks('marriage'),
    ]);

    // 4. 构建提示词
    const systemPrompt = buildMarriageSystemPrompt(knowledge, books);
    const userPrompt = buildMarriageUserPrompt(result, person1Data, person2Data, naYinResult);

    // 5. 流式调用 AI（避免 TCP ETIMEDOUT）
    logger.info(`调用 AI 模型 ${getModelName()} 生成合婚分析（流式）`);

    const rawContent = await streamChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    if (!rawContent) {
      logger.error('AI 返回内容为空');
      return generateMockMarriageAnalysis(result);
    }

    logger.info('命理大师合婚分析完成，进入 DeepSeek 审校润色环节');
    const polishedContent = await reviewAndPolish(rawContent, '合婚');

    logger.info('合婚分析报告生成成功（已审校润色）');
    return polishedContent;
  } catch (error) {
    logger.error('命理大师 Agent 合婚分析失败:', error);
    return generateMockMarriageAnalysis(result);
  }
}

/**
 * 构建合婚分析的用户提示词
 */
function buildMarriageUserPrompt(
  result: MarriageAnalysisResult,
  person1Data: PersonFullData,
  person2Data: PersonFullData,
  naYinResult: NaYinMarriageResult | null
): string {
  const { overallScore, dimensions } = result;

  let prompt = `请为以下两人进行专业的八字合婚分析：

## 男方命理数据
${formatPersonData(person1Data)}

## 女方命理数据
${formatPersonData(person2Data)}

## 初步算法评分
- 总体契合度：${overallScore}分
- 基础契合度：${dimensions.basicCompatibility.score}分 - ${dimensions.basicCompatibility.description}
- 性格相容性：${dimensions.personalityMatch.score}分 - ${dimensions.personalityMatch.description}
- 婚姻宫位：${dimensions.marriagePalace.score}分 - ${dimensions.marriagePalace.description}
- 家庭和谐：${dimensions.familyHarmony.score}分 - ${dimensions.familyHarmony.description}`;

  if (naYinResult) {
    prompt += `

## 纳音合婚
- 男方年命纳音：${naYinResult.person1NaYin.name}（${naYinResult.person1NaYin.wuXing}）
- 女方年命纳音：${naYinResult.person2NaYin.name}（${naYinResult.person2NaYin.wuXing}）
- 纳音关系：${naYinResult.relationship}（${naYinResult.direction}）
- 纳音评分：${naYinResult.score}分
- 评价：${naYinResult.description}`;
  }

  prompt += `

请基于以上完整的命理数据和你的知识库，给出专业、深入、有建设性的合婚分析报告。
注意：初步算法评分仅供参考，你需要基于十神、神煞、身强弱、大运等完整数据进行独立分析。`;

  return prompt;
}

/**
 * 生成姻缘分析报告（命理大师 Agent 版本）
 * @param data - 个人八字数据
 * @returns AI 生成的专业姻缘分析报告
 */
export async function generateDestinyAnalysis(data: DestinyAnalysisData): Promise<string> {
  const apiKey = process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    logger.warn('AI API Key 未配置，返回模拟分析');
    return generateMockDestinyAnalysis(data);
  }

  try {
    const siZhu = {
      year: { tianGan: data.siZhu.year.tianGan as any, diZhi: data.siZhu.year.diZhi as any },
      month: { tianGan: data.siZhu.month.tianGan as any, diZhi: data.siZhu.month.diZhi as any },
      day: { tianGan: data.siZhu.day.tianGan as any, diZhi: data.siZhu.day.diZhi as any },
      hour: { tianGan: data.siZhu.hour.tianGan as any, diZhi: data.siZhu.hour.diZhi as any },
    };

    const gender = data.gender as Gender;
    const shiShenChart = calculateShiShenChart(siZhu, gender);
    const shenSha = calculateShenSha(siZhu);
    const strength = calculateStrength(siZhu);

    const birthYear = new Date().getFullYear() - 30;
    const estimatedBirthDate = new Date(birthYear, 0, 1);
    const daYun = calculateDaYun(siZhu, gender, estimatedBirthDate);
    const naYin = getNaYin(siZhu.year.tianGan, siZhu.year.diZhi);

    // 加载知识库和姻缘相关书籍
    const [knowledge, books] = await Promise.all([
      loadKnowledge(KNOWLEDGE_FILES.destiny),
      loadBooks('destiny'),
    ]);

    // 构建提示词
    const systemPrompt = buildDestinySystemPrompt(knowledge, books);
    const userPrompt = buildDestinyUserPrompt(data, shiShenChart, shenSha, strength, daYun, naYin);

    logger.info(`调用 AI 模型 ${getModelName()} 生成姻缘分析（流式）`);

    const rawContent = await streamChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    if (!rawContent) {
      logger.error('AI 返回内容为空');
      return generateMockDestinyAnalysis(data);
    }

    logger.info('命理大师姻缘分析完成，进入 DeepSeek 审校润色环节');
    const polishedContent = await reviewAndPolish(rawContent, '姻缘');

    logger.info('姻缘分析报告生成成功（已审校润色）');
    return polishedContent;
  } catch (error) {
    logger.error('命理大师 Agent 姻缘分析失败:', error);
    return generateMockDestinyAnalysis(data);
  }
}

/**
 * 构建姻缘分析的用户提示词
 */
function buildDestinyUserPrompt(
  data: DestinyAnalysisData,
  shiShenChart: ShiShenChart,
  shenSha: ShenShaResult,
  strength: StrengthResult,
  daYun: DaYunResult,
  naYin: NaYinInfo | null
): string {
  const siZhuStr = data.knowBirthTime
    ? `${data.siZhu.year.tianGan}${data.siZhu.year.diZhi} ${data.siZhu.month.tianGan}${data.siZhu.month.diZhi} ${data.siZhu.day.tianGan}${data.siZhu.day.diZhi} ${data.siZhu.hour.tianGan}${data.siZhu.hour.diZhi}`
    : `${data.siZhu.year.tianGan}${data.siZhu.year.diZhi} ${data.siZhu.month.tianGan}${data.siZhu.month.diZhi} ${data.siZhu.day.tianGan}${data.siZhu.day.diZhi} (时柱未知)`;

  const lines: string[] = [];
  lines.push(`请为以下个人进行专业的姻缘分析：`);
  lines.push('');
  lines.push(`## 个人基本信息`);
  lines.push(`- 姓名：${data.name}`);
  lines.push(`- 性别：${data.gender === 'male' ? '男' : '女'}`);
  lines.push(`- 八字：${siZhuStr}`);
  lines.push(`- 日元：${data.riYuan}（${data.riYuanWuXing}）`);
  lines.push(`- 五行分布：金${data.wuXingCount.金} 木${data.wuXingCount.木} 水${data.wuXingCount.水} 火${data.wuXingCount.火} 土${data.wuXingCount.土}`);
  if (!data.knowBirthTime) {
    lines.push('- 注意：时柱未知，分析基于年月日三柱');
  }

  // 身强弱
  lines.push('');
  lines.push(`## 身强弱判断`);
  lines.push(`- ${strength.description}`);

  // 纳音
  if (naYin) {
    lines.push('');
    lines.push(`## 年命纳音`);
    lines.push(`- ${naYin.name}（${naYin.wuXing}）- ${naYin.description}`);
  }

  // 十神
  lines.push('');
  lines.push('## 十神排盘');
  lines.push(`- 年干：${shiShenChart.yearGan.tianGan}（${shiShenChart.yearGan.shiShen}）`);
  lines.push(`- 月干：${shiShenChart.monthGan.tianGan}（${shiShenChart.monthGan.shiShen}）`);
  lines.push(`- 日干：${shiShenChart.dayGan.tianGan}（日元）`);
  lines.push(`- 时干：${shiShenChart.hourGan.tianGan}（${shiShenChart.hourGan.shiShen}）`);

  const dayZhiCG = shiShenChart.dayZhiCangGan;
  const dayZhiDesc = dayZhiCG.cangGan.map((cg) => `${cg.gan}(${cg.shiShen})`).join('、');
  lines.push(`- 日支（婚姻宫）藏干：${dayZhiDesc}`);

  const sp = shiShenChart.spouseStar;
  lines.push('');
  lines.push('## 配偶星');
  lines.push(`- 主配偶星：${sp.mainStar}（命局中有 ${sp.mainStarCount} 个）`);
  lines.push(`- 副配偶星：${sp.secondaryStar}（命局中有 ${sp.secondaryStarCount} 个）`);
  lines.push(`- 配偶星是否在婚姻宫：${sp.inMarriagePalace ? '是' : '否'}`);

  // 神煞
  lines.push('');
  lines.push('## 姻缘神煞');
  if (shenSha.taoHua.length > 0) {
    lines.push(`- 桃花：${shenSha.taoHua.map((t) => t.description).join('；')}`);
  } else {
    lines.push('- 桃花：命局中无桃花');
  }
  if (shenSha.hongLuan) lines.push(`- 红鸾：${shenSha.hongLuan.description}`);
  if (shenSha.tianXi) lines.push(`- 天喜：${shenSha.tianXi.description}`);
  if (shenSha.guChen) lines.push(`- 孤辰：${shenSha.guChen.description}`);
  if (shenSha.guaSu) lines.push(`- 寡宿：${shenSha.guaSu.description}`);
  if (shenSha.huaGai.length > 0) lines.push(`- 华盖：${shenSha.huaGai.map((h) => h.description).join('；')}`);
  if (shenSha.tianYiGuiRen.length > 0) lines.push(`- 天乙贵人：${shenSha.tianYiGuiRen.map((t) => t.description).join('；')}`);
  lines.push(`- 综合评价：${shenSha.summary.marriageFavorability}`);

  // 大运
  lines.push('');
  lines.push('## 大运');
  lines.push(`- ${daYun.description}`);
  if (daYun.currentStep) {
    lines.push(`- 当前大运：${daYun.currentStep.ganZhiStr}（${daYun.currentStep.startAge}-${daYun.currentStep.endAge}岁）`);
  }
  const gender = data.gender as Gender;
  const marriageDaYun = analyzeMarriageDaYun(daYun, data.riYuanWuXing, gender);
  for (const desc of marriageDaYun) {
    lines.push(`- ${desc}`);
  }

  lines.push('');
  lines.push('请基于以上完整的命理数据和你的知识库，给出专业、深入的姻缘分析报告。');
  lines.push('注意：分析婚姻宫（日支）、配偶星（男命看财星，女命看官星）等关键信息。');

  return lines.join('\n');
}

/**
 * 合婚追问对话（命理大师 Agent 版本）
 * @param analysisContext - 之前的分析结果
 * @param question - 用户问题
 * @param history - 历史对话
 * @returns AI 回复
 */
export async function askFollowUp(
  analysisContext: string,
  question: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const apiKey = process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return '抱歉，AI 服务暂不可用，请稍后重试。';
  }

  try {
    const [knowledge, books] = await Promise.all([
      loadKnowledge(KNOWLEDGE_FILES.followUp),
      loadBooks('followUp'),
    ]);
    const systemPrompt = buildFollowUpSystemPrompt(analysisContext, knowledge, books);

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user', content: question },
    ];

    const rawContent = await streamChat(messages, { maxTokens: 2000 });
    if (!rawContent) {
      return '回复生成失败，请重试';
    }

    logger.info('命理大师追问回复完成，进入 DeepSeek 审校润色环节');
    return reviewAndPolish(rawContent, '姻缘');
  } catch (error) {
    logger.error('命理大师 Agent 追问失败:', error);
    return '抱歉，AI 服务暂时出错，请稍后重试。';
  }
}

/**
 * 姻缘追问对话
 */
export async function askDestinyFollowUp(
  analysisContext: string,
  question: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  return askFollowUp(analysisContext, question, history);
}

/**
 * 模拟合婚分析（API 不可用时）
 */
function generateMockMarriageAnalysis(result: MarriageAnalysisResult): string {
  const { person1, person2, overallScore, dimensions } = result;
  const scoreLevel =
    overallScore >= 80 ? '极佳' : overallScore >= 70 ? '良好' : overallScore >= 60 ? '中等' : '需要努力';

  return `## 合婚分析报告

### 总体评价

${person1.name}与${person2.name}的八字契合度为 **${overallScore}分**，属于${scoreLevel}水平。

### 八字格局解读

**${person1.name}**
- 八字：${formatSiZhu(person1.siZhu)}
- 日元${person1.riYuan}属${person1.riYuanWuXing}

**${person2.name}**
- 八字：${formatSiZhu(person2.siZhu)}
- 日元${person2.riYuan}属${person2.riYuanWuXing}

### 契合分析

| 维度 | 评分 | 说明 |
|------|------|------|
| 基础契合度 | ${dimensions.basicCompatibility.score}分 | ${dimensions.basicCompatibility.description} |
| 性格相容性 | ${dimensions.personalityMatch.score}分 | ${dimensions.personalityMatch.description} |
| 婚姻宫位 | ${dimensions.marriagePalace.score}分 | ${dimensions.marriagePalace.description} |
| 家庭和谐 | ${dimensions.familyHarmony.score}分 | ${dimensions.familyHarmony.description} |

### 综合建议

婚姻幸福需要双方共同经营。命理分析仅供参考，最重要的是两人真心相爱、愿意共同成长。

*注：当前为简略分析模式，配置 AI API Key 后可获得完整的命理大师分析报告。*`;
}

/**
 * 模拟姻缘分析（API 不可用时）
 */
function generateMockDestinyAnalysis(data: DestinyAnalysisData): string {
  const siZhuStr = data.knowBirthTime
    ? `${data.siZhu.year.tianGan}${data.siZhu.year.diZhi} ${data.siZhu.month.tianGan}${data.siZhu.month.diZhi} ${data.siZhu.day.tianGan}${data.siZhu.day.diZhi} ${data.siZhu.hour.tianGan}${data.siZhu.hour.diZhi}`
    : `${data.siZhu.year.tianGan}${data.siZhu.year.diZhi} ${data.siZhu.month.tianGan}${data.siZhu.month.diZhi} ${data.siZhu.day.tianGan}${data.siZhu.day.diZhi}`;

  return `## 姻缘分析报告

### 姻缘总论

${data.name}${data.gender === 'male' ? '先生' : '女士'}，您的八字为 **${siZhuStr}**，日元${data.riYuan}属${data.riYuanWuXing}。

### 婚姻建议

1. 保持开放的心态，主动参与社交活动
2. 真诚待人，展现真实的自己
3. 不要过于追求完美，接纳对方的不足
4. 注重感情的培养和经营

*注：当前为简略分析模式，配置 AI API Key 后可获得完整的命理大师分析报告。*`;
}
