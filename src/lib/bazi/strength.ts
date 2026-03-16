/**
 * 身强弱判断模块
 * Author: zhi.qu
 * Date: 2026-03-16
 * Description: 根据月令、得时得地得势判断日元旺衰，确定用神和喜神
 */

import type { TianGan, DiZhi, WuXing, SiZhu } from '@/types/bazi';
import {
  TIAN_GAN_WU_XING,
  TIAN_GAN_YIN_YANG,
  DI_ZHI_WU_XING,
  DI_ZHI_CANG_GAN,
  WU_XING_SHENG,
  WU_XING_KE,
} from './constants';

/** 月令旺衰表：日元五行在各月令（地支）中的旺衰状态 */
const MONTH_STRENGTH: Record<WuXing, Record<DiZhi, number>> = {
  '木': {
    '寅': 3, '卯': 3,                     // 当令（春季），旺
    '亥': 2, '子': 2,                     // 相（水生木），次旺
    '辰': 1, '丑': 0, '未': 0, '戌': -1, // 土月，衰
    '巳': -1, '午': -2,                   // 泄（木生火），弱
    '申': -2, '酉': -3,                   // 克（金克木），最弱
  },
  '火': {
    '巳': 3, '午': 3,
    '寅': 2, '卯': 2,
    '未': 1, '辰': 0, '戌': 0, '丑': -1,
    '申': -1, '酉': -1,
    '亥': -2, '子': -3,
  },
  '土': {
    '辰': 3, '丑': 3, '未': 3, '戌': 3,
    '巳': 2, '午': 2,
    '寅': -1, '卯': -2,
    '申': -1, '酉': -1,
    '亥': -1, '子': -1,
  },
  '金': {
    '申': 3, '酉': 3,
    '辰': 2, '丑': 2, '未': 1, '戌': 1,
    '亥': -1, '子': -1,
    '寅': -2, '卯': -2,
    '巳': -2, '午': -3,
  },
  '水': {
    '亥': 3, '子': 3,
    '申': 2, '酉': 2,
    '丑': 1, '辰': 0, '未': -1, '戌': -1,
    '寅': -1, '卯': -1,
    '巳': -2, '午': -2,
  },
};

/** 身强弱判断结果 */
export interface StrengthResult {
  /** 日元旺衰：旺/偏旺/中和/偏弱/弱 */
  strength: '极旺' | '偏旺' | '中和' | '偏弱' | '极弱';
  /** 旺衰得分（正数为旺，负数为弱） */
  score: number;
  /** 得时（月令是否生助日元） */
  deShi: boolean;
  /** 得地（地支藏干是否有日元同类） */
  deDi: boolean;
  /** 得势（天干是否有日元同类或生助） */
  deShi2: boolean;
  /** 用神五行 */
  yongShen: WuXing;
  /** 喜神五行 */
  xiShen: WuXing;
  /** 忌神五行 */
  jiShen: WuXing;
  /** 说明 */
  description: string;
}

/**
 * 判断日元身强弱
 * @param siZhu - 八字四柱
 * @returns 身强弱判断结果
 */
export function calculateStrength(siZhu: SiZhu): StrengthResult {
  const riYuan = siZhu.day.tianGan;
  const riWuXing = TIAN_GAN_WU_XING[riYuan];
  const monthZhi = siZhu.month.diZhi;

  let totalScore = 0;

  // 1. 得时判断（月令旺衰，权重最高）
  const monthScore = MONTH_STRENGTH[riWuXing][monthZhi];
  totalScore += monthScore * 2;
  const deShi = monthScore >= 2;

  // 2. 得地判断（地支藏干中是否有同类或印星）
  let diZhiHelp = 0;
  const allZhi: DiZhi[] = [siZhu.year.diZhi, siZhu.month.diZhi, siZhu.day.diZhi, siZhu.hour.diZhi];
  for (const zhi of allZhi) {
    const cangGan = DI_ZHI_CANG_GAN[zhi];
    for (let i = 0; i < cangGan.length; i++) {
      const ganWuXing = TIAN_GAN_WU_XING[cangGan[i]];
      const weight = i === 0 ? 1.0 : i === 1 ? 0.5 : 0.3;
      if (ganWuXing === riWuXing) {
        diZhiHelp += weight;
      } else if (WU_XING_SHENG[ganWuXing] === riWuXing) {
        diZhiHelp += weight * 0.8;
      } else if (WU_XING_KE[ganWuXing] === riWuXing) {
        diZhiHelp -= weight * 0.8;
      } else if (WU_XING_SHENG[riWuXing] === ganWuXing) {
        diZhiHelp -= weight * 0.5;
      }
    }
  }
  totalScore += diZhiHelp;
  const deDi = diZhiHelp > 0;

  // 3. 得势判断（天干是否有同类或生助）
  let tianGanHelp = 0;
  const otherGans: TianGan[] = [siZhu.year.tianGan, siZhu.month.tianGan, siZhu.hour.tianGan];
  for (const gan of otherGans) {
    const ganWuXing = TIAN_GAN_WU_XING[gan];
    if (ganWuXing === riWuXing) {
      tianGanHelp += 1.5;
    } else if (WU_XING_SHENG[ganWuXing] === riWuXing) {
      tianGanHelp += 1.0;
    } else if (WU_XING_KE[ganWuXing] === riWuXing) {
      tianGanHelp -= 1.0;
    } else if (WU_XING_SHENG[riWuXing] === ganWuXing) {
      tianGanHelp -= 0.5;
    }
  }
  totalScore += tianGanHelp;
  const deShi2 = tianGanHelp > 0;

  // 综合判断
  let strength: StrengthResult['strength'];
  if (totalScore >= 6) {
    strength = '极旺';
  } else if (totalScore >= 2) {
    strength = '偏旺';
  } else if (totalScore >= -2) {
    strength = '中和';
  } else if (totalScore >= -6) {
    strength = '偏弱';
  } else {
    strength = '极弱';
  }

  // 确定用神和喜神
  const { yongShen, xiShen, jiShen } = determineYongShen(riWuXing, strength);

  const deSummary = [
    deShi ? '得时（月令生助）' : '失时（月令不助）',
    deDi ? '得地（地支有根）' : '失地（地支无根）',
    deShi2 ? '得势（天干帮扶）' : '失势（天干不帮）',
  ];

  return {
    strength,
    score: Math.round(totalScore * 10) / 10,
    deShi,
    deDi,
    deShi2,
    yongShen,
    xiShen,
    jiShen,
    description: `日元${riYuan}属${riWuXing}，${strength}。${deSummary.join('，')}。用神为${yongShen}，喜神为${xiShen}`,
  };
}

/**
 * 确定用神、喜神、忌神
 * @param riWuXing - 日元五行
 * @param strength - 旺衰状态
 * @returns 用神、喜神、忌神
 */
function determineYongShen(
  riWuXing: WuXing,
  strength: StrengthResult['strength']
): { yongShen: WuXing; xiShen: WuXing; jiShen: WuXing } {
  const keWoZhe = Object.entries(WU_XING_KE).find(([, v]) => v === riWuXing)?.[0] as WuXing;
  const woShengZhe = WU_XING_SHENG[riWuXing];
  const shengWoZhe = Object.entries(WU_XING_SHENG).find(([, v]) => v === riWuXing)?.[0] as WuXing;
  const woKeZhe = WU_XING_KE[riWuXing];

  if (strength === '极旺' || strength === '偏旺') {
    // 身旺用克泄耗：官杀（克我）、食伤（我生）、财星（我克）
    return {
      yongShen: keWoZhe,     // 官杀克制
      xiShen: woShengZhe,    // 食伤泄秀
      jiShen: shengWoZhe,    // 印星生助为忌
    };
  } else if (strength === '极弱' || strength === '偏弱') {
    // 身弱用生扶：印星（生我）、比劫（同我）
    return {
      yongShen: shengWoZhe,  // 印星生助
      xiShen: riWuXing,      // 比劫帮身
      jiShen: keWoZhe,       // 官杀克身为忌
    };
  } else {
    // 中和：取平衡，略偏弱处理
    return {
      yongShen: shengWoZhe,
      xiShen: riWuXing,
      jiShen: keWoZhe,
    };
  }
}
