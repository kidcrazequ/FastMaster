/**
 * DeepSeek AI API 封装
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 封装 DeepSeek AI API 调用，用于生成合婚分析报告
 */

import OpenAI from 'openai';
import type { MarriageAnalysisResult } from '@/types/bazi';
import { formatSiZhu } from '@/lib/bazi/calculator';

/** DeepSeek 客户端实例 */
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
});

/** 合婚分析系统提示词 */
const MARRIAGE_ANALYSIS_SYSTEM_PROMPT = `你是一位精通中国传统命理学的八字分析专家，擅长合婚分析。
你需要根据提供的双方八字信息和初步分析结果，给出专业、详细、有建设性的合婚解读。

分析要求：
1. 语言要专业但通俗易懂，避免过于晦涩的术语
2. 分析要客观中立，不要过于绝对化
3. 既要指出问题，也要给出建设性建议
4. 强调婚姻需要双方共同经营，命理只是参考
5. 回复使用 Markdown 格式，结构清晰

请按以下结构进行分析：
1. 总体评价：对双方契合度的整体评价
2. 八字解读：分别解读双方的八字特点
3. 契合分析：详细分析各维度的契合情况
4. 相处建议：给出具体可行的相处建议
5. 发展展望：对未来发展的积极展望`;

/**
 * 生成合婚分析报告
 * @param result - 合婚分析结果
 * @returns AI 生成的分析报告
 */
export async function generateMarriageAnalysis(result: MarriageAnalysisResult): Promise<string> {
  // 检查 API Key
  if (!process.env.DEEPSEEK_API_KEY) {
    console.warn('DeepSeek API Key 未配置，返回模拟分析');
    return generateMockAnalysis(result);
  }

  const userPrompt = buildMarriagePrompt(result);

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: MARRIAGE_ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || '分析生成失败，请重试';
  } catch (error) {
    console.error('DeepSeek API 调用失败:', error);
    return generateMockAnalysis(result);
  }
}

/**
 * 流式生成合婚分析报告
 * @param result - 合婚分析结果
 * @returns 流式响应
 */
export async function generateMarriageAnalysisStream(result: MarriageAnalysisResult) {
  // 检查 API Key
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API Key 未配置');
  }

  const userPrompt = buildMarriagePrompt(result);

  const stream = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: MARRIAGE_ANALYSIS_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
    stream: true,
  });

  return stream;
}

/**
 * AI 追问对话
 * @param analysisContext - 分析上下文
 * @param question - 用户问题
 * @param history - 历史对话
 * @returns AI 回复
 */
export async function askFollowUp(
  analysisContext: string,
  question: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  if (!process.env.DEEPSEEK_API_KEY) {
    return '抱歉，AI 服务暂不可用，请稍后重试。';
  }

  const systemPrompt = `你是一位精通中国传统命理学的八字分析专家。
以下是之前的合婚分析结果，请基于此回答用户的追问。

分析结果：
${analysisContext}

回答要求：
1. 紧扣分析结果回答
2. 专业但通俗易懂
3. 给出建设性建议
4. 使用 Markdown 格式`;

  try {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user', content: question },
    ];

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || '回复生成失败，请重试';
  } catch (error) {
    console.error('DeepSeek API 调用失败:', error);
    return '抱歉，AI 服务暂时出错，请稍后重试。';
  }
}

/**
 * 构建合婚分析提示词
 * @param result - 合婚分析结果
 * @returns 提示词
 */
function buildMarriagePrompt(result: MarriageAnalysisResult): string {
  const { person1, person2, overallScore, dimensions } = result;

  return `请分析以下两人的八字合婚情况：

## 男方信息
- 姓名：${person1.name}
- 性别：${person1.gender === 'male' ? '男' : '女'}
- 八字：${formatSiZhu(person1.siZhu)}
- 日元：${person1.riYuan}（${person1.riYuanWuXing}）
- 五行分布：金${person1.wuXingCount.金} 木${person1.wuXingCount.木} 水${person1.wuXingCount.水} 火${person1.wuXingCount.火} 土${person1.wuXingCount.土}

## 女方信息
- 姓名：${person2.name}
- 性别：${person2.gender === 'male' ? '男' : '女'}
- 八字：${formatSiZhu(person2.siZhu)}
- 日元：${person2.riYuan}（${person2.riYuanWuXing}）
- 五行分布：金${person2.wuXingCount.金} 木${person2.wuXingCount.木} 水${person2.wuXingCount.水} 火${person2.wuXingCount.火} 土${person2.wuXingCount.土}

## 初步分析结果
- 总体契合度：${overallScore}分
- 基础契合度：${dimensions.basicCompatibility.score}分 - ${dimensions.basicCompatibility.description}
- 性格相容性：${dimensions.personalityMatch.score}分 - ${dimensions.personalityMatch.description}
- 婚姻宫位：${dimensions.marriagePalace.score}分 - ${dimensions.marriagePalace.description}
- 家庭和谐：${dimensions.familyHarmony.score}分 - ${dimensions.familyHarmony.description}

    请基于以上信息，给出详细的合婚分析报告。要求：
    1. 使用标准的 Markdown 格式输出。
    2. 每一个分析维度（如“总体评价”、“八字解读”、“契合分析”、“相处建议”）必须作为二级标题（使用 ##）。
    3. 段落之间必须保留一个完整的空行，确保排版整洁。
    4. 重点结论和核心评价请使用 **加粗**。
    5. 语言风格要古典、专业且有温度。
    6. 严禁输出没有任何 Markdown 格式的纯文本。`;
}

/**
 * 生成模拟分析（API 不可用时使用）
 * @param result - 合婚分析结果
 * @returns 模拟分析报告
 */
function generateMockAnalysis(result: MarriageAnalysisResult): string {
  const { person1, person2, overallScore, dimensions } = result;
  const scoreLevel =
    overallScore >= 80 ? '极佳' : overallScore >= 70 ? '良好' : overallScore >= 60 ? '中等' : '需要努力';

  return `## 合婚分析报告

### 总体评价

${person1.name}与${person2.name}的八字契合度为 **${overallScore}分**，属于${scoreLevel}水平。

### 八字解读

**${person1.name}**
- 八字：${formatSiZhu(person1.siZhu)}
- 日元${person1.riYuan}属${person1.riYuanWuXing}，${getPersonalityDescription(person1.riYuanWuXing)}

**${person2.name}**
- 八字：${formatSiZhu(person2.siZhu)}
- 日元${person2.riYuan}属${person2.riYuanWuXing}，${getPersonalityDescription(person2.riYuanWuXing)}

### 契合分析

| 维度 | 评分 | 说明 |
|------|------|------|
| 基础契合度 | ${dimensions.basicCompatibility.score}分 | ${dimensions.basicCompatibility.description} |
| 性格相容性 | ${dimensions.personalityMatch.score}分 | ${dimensions.personalityMatch.description} |
| 婚姻宫位 | ${dimensions.marriagePalace.score}分 | ${dimensions.marriagePalace.description} |
| 家庭和谐 | ${dimensions.familyHarmony.score}分 | ${dimensions.familyHarmony.description} |

### 相处建议

1. 多沟通交流，理解对方的想法和需求
2. 尊重彼此的个性差异，取长补短
3. 共同培养兴趣爱好，增进感情
4. 遇到矛盾时冷静处理，避免冲动

### 发展展望

婚姻幸福需要双方共同经营。命理分析仅供参考，最重要的是两人是否真心相爱、愿意共同成长。祝愿两位有情人终成眷属！`;
}

/**
 * 获取性格描述
 * @param wuXing - 五行
 * @returns 性格描述
 */
function getPersonalityDescription(wuXing: string): string {
  const descriptions: Record<string, string> = {
    '木': '性格仁慈宽厚，富有创造力和进取心',
    '火': '性格热情开朗，积极向上，有领导力',
    '土': '性格稳重踏实，包容性强，值得信赖',
    '金': '性格果断刚毅，原则性强，做事有条理',
    '水': '性格聪慧灵活，适应力强，善于思考',
  };
  return descriptions[wuXing] || '';
}

/** 姻缘分析系统提示词 */
const DESTINY_ANALYSIS_SYSTEM_PROMPT = `你是一位精通中国传统命理学的八字分析专家，擅长个人婚姻运势和姻缘分析。
你需要根据提供的个人八字信息，给出专业、详细、有建设性的姻缘解读。

分析要求：
1. 语言要专业但通俗易懂，避免过于晦涩的术语
2. 分析要客观中立，不要过于绝对化
3. 既要指出特点，也要给出建设性建议
4. 强调命理只是参考，个人努力和选择更重要
5. 回复使用 Markdown 格式，结构清晰

请按以下结构进行分析：
1. 姻缘概述：对个人姻缘运势的整体评价
2. 八字解读：解读八字中与婚姻相关的信息
3. 桃花运势：分析桃花运特点和时机
4. 理想对象：描述适合的另一半特质
5. 婚姻建议：给出具体可行的感情建议
6. 流年参考：近几年的姻缘运势展望`;

/** 姻缘分析结果类型 */
export interface DestinyAnalysisData {
  name: string;
  gender: string;
  siZhu: {
    year: { gan: string; zhi: string };
    month: { gan: string; zhi: string };
    day: { gan: string; zhi: string };
    hour?: { gan: string; zhi: string };
  };
  riYuan: string;
  riYuanWuXing: string;
  wuXingCount: Record<string, number>;
  knowBirthTime: boolean;
}

/**
 * 生成姻缘分析报告
 * @param data - 个人八字数据
 * @returns AI 生成的姻缘分析报告
 */
export async function generateDestinyAnalysis(data: DestinyAnalysisData): Promise<string> {
  // 检查 API Key
  if (!process.env.DEEPSEEK_API_KEY) {
    console.warn('DeepSeek API Key 未配置，返回模拟分析');
    return generateMockDestinyAnalysis(data);
  }

  const userPrompt = buildDestinyPrompt(data);

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: DESTINY_ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || '分析生成失败，请重试';
  } catch (error) {
    console.error('DeepSeek API 调用失败:', error);
    return generateMockDestinyAnalysis(data);
  }
}

/**
 * 姻缘分析追问对话
 * @param analysisContext - 分析上下文
 * @param question - 用户问题
 * @param history - 历史对话
 * @returns AI 回复
 */
export async function askDestinyFollowUp(
  analysisContext: string,
  question: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  if (!process.env.DEEPSEEK_API_KEY) {
    return '抱歉，AI 服务暂不可用，请稍后重试。';
  }

  const systemPrompt = `你是一位精通中国传统命理学的八字分析专家。
以下是之前的姻缘分析结果，请基于此回答用户的追问。

分析结果：
${analysisContext}

回答要求：
1. 紧扣分析结果回答
2. 专业但通俗易懂
3. 给出建设性建议
4. 使用 Markdown 格式`;

  try {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user', content: question },
    ];

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || '回复生成失败，请重试';
  } catch (error) {
    console.error('DeepSeek API 调用失败:', error);
    return '抱歉，AI 服务暂时出错，请稍后重试。';
  }
}

/**
 * 构建姻缘分析提示词
 * @param data - 个人八字数据
 * @returns 提示词
 */
function buildDestinyPrompt(data: DestinyAnalysisData): string {
  const siZhuStr = data.siZhu.hour
    ? `${data.siZhu.year.gan}${data.siZhu.year.zhi} ${data.siZhu.month.gan}${data.siZhu.month.zhi} ${data.siZhu.day.gan}${data.siZhu.day.zhi} ${data.siZhu.hour.gan}${data.siZhu.hour.zhi}`
    : `${data.siZhu.year.gan}${data.siZhu.year.zhi} ${data.siZhu.month.gan}${data.siZhu.month.zhi} ${data.siZhu.day.gan}${data.siZhu.day.zhi} (时柱未知)`;

  return `请分析以下个人的婚姻姻缘运势：

## 个人信息
- 姓名：${data.name}
- 性别：${data.gender === 'male' ? '男' : '女'}
- 八字：${siZhuStr}
- 日元：${data.riYuan}（${data.riYuanWuXing}）
- 五行分布：金${data.wuXingCount.金} 木${data.wuXingCount.木} 水${data.wuXingCount.水} 火${data.wuXingCount.火} 土${data.wuXingCount.土}
${!data.knowBirthTime ? '- 注意：时柱未知，分析基于年月日三柱' : ''}

请基于以上信息，给出详细的个人姻缘分析报告。要求：
1. 使用标准的 Markdown 格式输出。
2. 每一个分析维度必须作为二级标题（使用 ##）。
3. 段落之间必须保留一个完整的空行，确保排版整洁。
4. 重点结论和核心评价请使用 **加粗**。
5. 语言风格要古典、专业且有温度。
6. 分析婚姻宫（日支）、配偶星（男命看财星，女命看官星）等关键信息。`;
}

/**
 * 生成模拟姻缘分析（API 不可用时使用）
 * @param data - 个人八字数据
 * @returns 模拟分析报告
 */
function generateMockDestinyAnalysis(data: DestinyAnalysisData): string {
  const siZhuStr = data.siZhu.hour
    ? `${data.siZhu.year.gan}${data.siZhu.year.zhi} ${data.siZhu.month.gan}${data.siZhu.month.zhi} ${data.siZhu.day.gan}${data.siZhu.day.zhi} ${data.siZhu.hour.gan}${data.siZhu.hour.zhi}`
    : `${data.siZhu.year.gan}${data.siZhu.year.zhi} ${data.siZhu.month.gan}${data.siZhu.month.zhi} ${data.siZhu.day.gan}${data.siZhu.day.zhi}`;

  return `## 姻缘分析报告

### 姻缘概述

${data.name}${data.gender === 'male' ? '先生' : '女士'}，您的八字为 **${siZhuStr}**，日元${data.riYuan}属${data.riYuanWuXing}。

从命理角度看，您的婚姻运势整体${getPersonalityDescription(data.riYuanWuXing)}，在感情方面有自己独特的魅力和处事方式。

### 八字解读

**日主特点**
- 日元${data.riYuan}属${data.riYuanWuXing}，${getPersonalityDescription(data.riYuanWuXing)}
- 五行分布：金${data.wuXingCount.金} 木${data.wuXingCount.木} 水${data.wuXingCount.水} 火${data.wuXingCount.火} 土${data.wuXingCount.土}

**婚姻宫分析**
- 日支为婚姻宫，代表配偶和婚姻状态
- 需结合具体配偶星位置综合分析

### 桃花运势

根据您的八字特点，桃花运主要体现在：
1. 人缘较好，容易结识异性朋友
2. 感情态度认真，不轻易表达心意
3. 适合在社交场合认识有缘人

### 理想对象

适合您的另一半特质：
- 性格稳重、有责任心
- 能够理解和包容您的个性
- 有共同的价值观和生活目标

### 婚姻建议

1. 保持开放的心态，主动参与社交活动
2. 真诚待人，展现真实的自己
3. 不要过于追求完美，接纳对方的不足
4. 注重感情的培养和经营

### 流年参考

近几年姻缘运势：
- 注意把握适合的时机
- 可适当扩大社交圈
- 遇到合适的人要勇于表达

*注：命理分析仅供参考，幸福的感情需要双方共同经营。*`;
}
