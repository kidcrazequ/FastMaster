/**
 * 十神推算模块
 * Author: zhi.qu
 * Date: 2026-03-16
 * Description: 根据日元与其他天干的五行生克关系及阴阳属性计算十神
 */

import type { TianGan, DiZhi, SiZhu, ShiShen, ShiShenCount } from '@/types/bazi';
import { TIAN_GAN_WU_XING, TIAN_GAN_YIN_YANG, DI_ZHI_CANG_GAN } from './constants';

/**
 * 判断一个天干相对于日元的十神
 * @param riYuan - 日元（日干）
 * @param target - 目标天干
 * @returns 十神名称
 */
export function getShiShen(riYuan: TianGan, target: TianGan): ShiShen {
  const riWuXing = TIAN_GAN_WU_XING[riYuan];
  const targetWuXing = TIAN_GAN_WU_XING[target];
  const riYinYang = TIAN_GAN_YIN_YANG[riYuan];
  const targetYinYang = TIAN_GAN_YIN_YANG[target];
  const isSamePolarity = riYinYang === targetYinYang;

  const shengMap: Record<string, string> = {
    '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
  };
  const keMap: Record<string, string> = {
    '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
  };

  if (riWuXing === targetWuXing) {
    return isSamePolarity ? '比肩' : '劫财';
  }
  if (shengMap[riWuXing] === targetWuXing) {
    return isSamePolarity ? '食神' : '伤官';
  }
  if (keMap[riWuXing] === targetWuXing) {
    return isSamePolarity ? '偏财' : '正财';
  }
  if (keMap[targetWuXing] === riWuXing) {
    return isSamePolarity ? '七杀' : '正官';
  }
  // shengMap[targetWuXing] === riWuXing
  return isSamePolarity ? '偏印' : '正印';
}

/** 单个位置的十神信息 */
export interface ShiShenPosition {
  tianGan: TianGan;
  shiShen: ShiShen;
}

/** 地支藏干的十神信息 */
export interface CangGanShiShen {
  diZhi: DiZhi;
  cangGan: Array<{ gan: TianGan; shiShen: ShiShen; weight: number }>;
}

/** 完整的十神排盘结果 */
export interface ShiShenChart {
  /** 年干十神 */
  yearGan: ShiShenPosition;
  /** 月干十神 */
  monthGan: ShiShenPosition;
  /** 日干（日元本身） */
  dayGan: { tianGan: TianGan; shiShen: '日元' };
  /** 时干十神 */
  hourGan: ShiShenPosition;
  /** 年支藏干十神 */
  yearZhiCangGan: CangGanShiShen;
  /** 月支藏干十神 */
  monthZhiCangGan: CangGanShiShen;
  /** 日支藏干十神（婚姻宫） */
  dayZhiCangGan: CangGanShiShen;
  /** 时支藏干十神 */
  hourZhiCangGan: CangGanShiShen;
  /** 十神统计 */
  count: ShiShenCount;
  /** 配偶星信息 */
  spouseStar: {
    /** 男命看正财，女命看正官 */
    mainStar: ShiShen;
    /** 男命看偏财，女命看七杀 */
    secondaryStar: ShiShen;
    /** 命局中配偶星数量 */
    mainStarCount: number;
    secondaryStarCount: number;
    /** 配偶星是否在婚姻宫（日支） */
    inMarriagePalace: boolean;
  };
}

/**
 * 计算地支藏干的十神
 */
function getCangGanShiShen(riYuan: TianGan, zhi: DiZhi): CangGanShiShen {
  const cangGan = DI_ZHI_CANG_GAN[zhi];
  const weights = [0.6, 0.3, 0.1];
  if (!cangGan) {
    return { diZhi: zhi, cangGan: [] };
  }
  return {
    diZhi: zhi,
    cangGan: cangGan.map((gan, i) => ({
      gan,
      shiShen: getShiShen(riYuan, gan),
      weight: weights[i] || 0.1,
    })),
  };
}

/**
 * 计算完整的十神排盘
 * @param siZhu - 八字四柱
 * @param gender - 性别 ('male' | 'female')
 * @returns 十神排盘结果
 */
export function calculateShiShenChart(siZhu: SiZhu, gender: 'male' | 'female'): ShiShenChart {
  const riYuan = siZhu.day.tianGan;

  const yearGan: ShiShenPosition = {
    tianGan: siZhu.year.tianGan,
    shiShen: getShiShen(riYuan, siZhu.year.tianGan),
  };
  const monthGan: ShiShenPosition = {
    tianGan: siZhu.month.tianGan,
    shiShen: getShiShen(riYuan, siZhu.month.tianGan),
  };
  const hourGan: ShiShenPosition = {
    tianGan: siZhu.hour.tianGan,
    shiShen: getShiShen(riYuan, siZhu.hour.tianGan),
  };

  const yearZhiCangGan = getCangGanShiShen(riYuan, siZhu.year.diZhi);
  const monthZhiCangGan = getCangGanShiShen(riYuan, siZhu.month.diZhi);
  const dayZhiCangGan = getCangGanShiShen(riYuan, siZhu.day.diZhi);
  const hourZhiCangGan = getCangGanShiShen(riYuan, siZhu.hour.diZhi);

  const count: ShiShenCount = {
    比肩: 0, 劫财: 0, 食神: 0, 伤官: 0, 偏财: 0,
    正财: 0, 七杀: 0, 正官: 0, 偏印: 0, 正印: 0,
  };

  // 统计天干十神（日元不计入）
  count[yearGan.shiShen]++;
  count[monthGan.shiShen]++;
  count[hourGan.shiShen]++;

  // 统计地支藏干十神（按权重）
  const allCangGan = [yearZhiCangGan, monthZhiCangGan, dayZhiCangGan, hourZhiCangGan];
  for (const cg of allCangGan) {
    for (const item of cg.cangGan) {
      count[item.shiShen] += item.weight;
    }
  }

  // 四舍五入
  for (const key of Object.keys(count) as Array<keyof ShiShenCount>) {
    count[key] = Math.round(count[key] * 10) / 10;
  }

  // 配偶星分析
  const mainStar: ShiShen = gender === 'male' ? '正财' : '正官';
  const secondaryStar: ShiShen = gender === 'male' ? '偏财' : '七杀';

  const inMarriagePalace = dayZhiCangGan.cangGan.some(
    (cg) => cg.shiShen === mainStar || cg.shiShen === secondaryStar
  );

  return {
    yearGan,
    monthGan,
    dayGan: { tianGan: riYuan, shiShen: '日元' },
    hourGan,
    yearZhiCangGan,
    monthZhiCangGan,
    dayZhiCangGan,
    hourZhiCangGan,
    count,
    spouseStar: {
      mainStar,
      secondaryStar,
      mainStarCount: count[mainStar],
      secondaryStarCount: count[secondaryStar],
      inMarriagePalace,
    },
  };
}
