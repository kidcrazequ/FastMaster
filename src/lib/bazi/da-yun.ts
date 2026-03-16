/**
 * 大运排算模块
 * Author: zhi.qu
 * Date: 2026-03-16
 * Description: 根据性别和年干阴阳确定大运顺逆，计算起运岁数，排出大运干支序列
 */

import type { TianGan, DiZhi, GanZhi, SiZhu, Gender } from '@/types/bazi';
import { TIAN_GAN, DI_ZHI, TIAN_GAN_YIN_YANG, TIAN_GAN_WU_XING } from './constants';

/** 单步大运信息 */
export interface DaYunStep {
  /** 大运干支 */
  ganZhi: GanZhi;
  /** 大运干支字符串 */
  ganZhiStr: string;
  /** 起始年龄 */
  startAge: number;
  /** 结束年龄 */
  endAge: number;
  /** 大运五行 */
  wuXing: string;
}

/** 大运排算结果 */
export interface DaYunResult {
  /** 顺排还是逆排 */
  direction: '顺排' | '逆排';
  /** 起运岁数（简化计算） */
  startAge: number;
  /** 大运序列（8步，80年） */
  steps: DaYunStep[];
  /** 当前所在大运（根据当前年龄） */
  currentStep: DaYunStep | null;
  /** 说明 */
  description: string;
}

/**
 * 获取天干在十天干中的索引
 */
function getGanIndex(gan: TianGan): number {
  return TIAN_GAN.indexOf(gan);
}

/**
 * 获取地支在十二地支中的索引
 */
function getZhiIndex(zhi: DiZhi): number {
  return DI_ZHI.indexOf(zhi);
}

/**
 * 按索引获取天干（循环）
 */
function ganByIndex(index: number): TianGan {
  return TIAN_GAN[((index % 10) + 10) % 10];
}

/**
 * 按索引获取地支（循环）
 */
function zhiByIndex(index: number): DiZhi {
  return DI_ZHI[((index % 12) + 12) % 12];
}

/**
 * 计算大运
 * @param siZhu - 八字四柱
 * @param gender - 性别
 * @param birthDate - 出生日期（用于计算当前大运）
 * @returns 大运排算结果
 */
export function calculateDaYun(siZhu: SiZhu, gender: Gender, birthDate: Date): DaYunResult {
  const yearGanYinYang = TIAN_GAN_YIN_YANG[siZhu.year.tianGan];

  // 确定顺逆：阳年男命顺排，阴年男命逆排；阳年女命逆排，阴年女命顺排
  const isShun =
    (yearGanYinYang === '阳' && gender === 'male') ||
    (yearGanYinYang === '阴' && gender === 'female');

  const direction: '顺排' | '逆排' = isShun ? '顺排' : '逆排';

  // 简化起运岁数计算：取出生月份折算
  // 精确计算需要用节气，这里用简化公式
  const birthMonth = birthDate.getMonth() + 1;
  const birthDay = birthDate.getDate();
  let startAge: number;

  if (isShun) {
    // 顺排：从出生日到下一个节气的天数 / 3
    const daysToNext = Math.max(1, 30 - birthDay);
    startAge = Math.round(daysToNext / 3);
  } else {
    // 逆排：从出生日到上一个节气的天数 / 3
    const daysToPrev = Math.max(1, birthDay);
    startAge = Math.round(daysToPrev / 3);
  }

  // 限制起运岁数在合理范围内
  startAge = Math.max(1, Math.min(10, startAge));

  // 从月柱出发排大运
  const monthGanIndex = getGanIndex(siZhu.month.tianGan);
  const monthZhiIndex = getZhiIndex(siZhu.month.diZhi);
  const step = isShun ? 1 : -1;

  const steps: DaYunStep[] = [];
  for (let i = 1; i <= 8; i++) {
    const ganIndex = monthGanIndex + step * i;
    const zhiIndex = monthZhiIndex + step * i;
    const gan = ganByIndex(ganIndex);
    const zhi = zhiByIndex(zhiIndex);
    const ganWuXing = TIAN_GAN_WU_XING[gan];

    steps.push({
      ganZhi: { tianGan: gan, diZhi: zhi },
      ganZhiStr: `${gan}${zhi}`,
      startAge: startAge + (i - 1) * 10,
      endAge: startAge + i * 10 - 1,
      wuXing: ganWuXing,
    });
  }

  // 判断当前所在大运
  const now = new Date();
  const currentAge = now.getFullYear() - birthDate.getFullYear();
  const currentStep = steps.find((s) => currentAge >= s.startAge && currentAge <= s.endAge) || null;

  const desc = `${direction}，${startAge}岁起运。大运序列：${steps.map((s) => s.ganZhiStr).join(' → ')}`;

  return {
    direction,
    startAge,
    steps,
    currentStep,
    description: desc,
  };
}

/**
 * 获取与婚姻相关的大运分析
 * @param daYun - 大运结果
 * @param riYuanWuXing - 日元五行
 * @param gender - 性别
 * @returns 婚姻相关大运的描述数组
 */
export function analyzeMarriageDaYun(
  daYun: DaYunResult,
  riYuanWuXing: string,
  gender: Gender
): string[] {
  const analysis: string[] = [];

  // 男命看财运（我克者），女命看官运（克我者）
  const keMap: Record<string, string> = {
    '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
  };
  const targetWuXing = gender === 'male'
    ? keMap[riYuanWuXing]   // 男命看财星（我克者）
    : Object.entries(keMap).find(([, v]) => v === riYuanWuXing)?.[0]; // 女命看官星（克我者）

  for (const step of daYun.steps) {
    if (step.wuXing === targetWuXing) {
      const starName = gender === 'male' ? '财星' : '官星';
      analysis.push(
        `${step.startAge}-${step.endAge}岁行${step.ganZhiStr}运（${starName}运），此段时期${gender === 'male' ? '容易遇到配偶或感情变好' : '容易遇到配偶或婚姻顺利'}`
      );
    }
  }

  if (analysis.length === 0) {
    analysis.push('大运中配偶星运不太明显，需要结合流年具体分析婚期');
  }

  return analysis;
}
