/**
 * 神煞计算模块
 * Author: zhi.qu
 * Date: 2026-03-16
 * Description: 计算与婚姻姻缘相关的神煞（桃花、红鸾、天喜、孤辰寡宿、华盖、天乙贵人、驿马）
 */

import type { TianGan, DiZhi, SiZhu } from '@/types/bazi';

/** 单个神煞信息 */
export interface ShenShaItem {
  name: string;
  position: string;
  description: string;
}

/** 完整的神煞分析结果 */
export interface ShenShaResult {
  taoHua: ShenShaItem[];
  hongLuan: ShenShaItem | null;
  tianXi: ShenShaItem | null;
  guChen: ShenShaItem | null;
  guaSu: ShenShaItem | null;
  huaGai: ShenShaItem[];
  tianYiGuiRen: ShenShaItem[];
  yiMa: ShenShaItem[];
  summary: {
    hasPositiveTaoHua: boolean;
    hasHongLuanTianXi: boolean;
    hasGuChenGuaSu: boolean;
    hasHuaGai: boolean;
    marriageFavorability: '极好' | '较好' | '一般' | '偏差';
  };
}

/** 桃花查询表：以年支或日支所属三合局查桃花 */
const TAO_HUA_MAP: Record<DiZhi, DiZhi> = {
  '寅': '卯', '午': '卯', '戌': '卯',
  '巳': '午', '酉': '午', '丑': '午',
  '申': '酉', '子': '酉', '辰': '酉',
  '亥': '子', '卯': '子', '未': '子',
};

/** 红鸾查询表：以年支查红鸾 */
const HONG_LUAN_MAP: Record<DiZhi, DiZhi> = {
  '子': '卯', '丑': '寅', '寅': '丑', '卯': '子',
  '辰': '亥', '巳': '戌', '午': '酉', '未': '申',
  '申': '未', '酉': '午', '戌': '巳', '亥': '辰',
};

/** 天喜查询表：与红鸾相冲 */
const TIAN_XI_MAP: Record<DiZhi, DiZhi> = {
  '子': '酉', '丑': '申', '寅': '未', '卯': '午',
  '辰': '巳', '巳': '辰', '午': '卯', '未': '寅',
  '申': '丑', '酉': '子', '戌': '亥', '亥': '戌',
};

/** 孤辰查询表：以年支查 */
const GU_CHEN_MAP: Record<DiZhi, DiZhi> = {
  '亥': '寅', '子': '寅', '丑': '寅',
  '寅': '巳', '卯': '巳', '辰': '巳',
  '巳': '申', '午': '申', '未': '申',
  '申': '亥', '酉': '亥', '戌': '亥',
};

/** 寡宿查询表：以年支查 */
const GUA_SU_MAP: Record<DiZhi, DiZhi> = {
  '亥': '戌', '子': '戌', '丑': '戌',
  '寅': '丑', '卯': '丑', '辰': '丑',
  '巳': '辰', '午': '辰', '未': '辰',
  '申': '未', '酉': '未', '戌': '未',
};

/** 华盖查询表：以年支或日支所属三合局查华盖 */
const HUA_GAI_MAP: Record<DiZhi, DiZhi> = {
  '寅': '戌', '午': '戌', '戌': '戌',
  '巳': '丑', '酉': '丑', '丑': '丑',
  '申': '辰', '子': '辰', '辰': '辰',
  '亥': '未', '卯': '未', '未': '未',
};

/**
 * 天乙贵人查询表：以日干查贵人所在地支
 * 返回两个地支
 */
const TIAN_YI_GUI_REN_MAP: Record<TianGan, [DiZhi, DiZhi]> = {
  '甲': ['丑', '未'],
  '戊': ['丑', '未'],
  '庚': ['丑', '未'],
  '乙': ['子', '申'],
  '己': ['子', '申'],
  '丙': ['亥', '酉'],
  '丁': ['亥', '酉'],
  '壬': ['卯', '巳'],
  '癸': ['卯', '巳'],
  '辛': ['午', '寅'],
};

/** 驿马查询表：以年支或日支所属三合局查驿马 */
const YI_MA_MAP: Record<DiZhi, DiZhi> = {
  '寅': '申', '午': '申', '戌': '申',
  '巳': '亥', '酉': '亥', '丑': '亥',
  '申': '寅', '子': '寅', '辰': '寅',
  '亥': '巳', '卯': '巳', '未': '巳',
};

const PILLAR_NAMES = ['年柱', '月柱', '日柱', '时柱'];

/**
 * 计算完整的神煞分析
 * @param siZhu - 八字四柱
 * @returns 神煞分析结果
 */
export function calculateShenSha(siZhu: SiZhu): ShenShaResult {
  const allZhi: DiZhi[] = [siZhu.year.diZhi, siZhu.month.diZhi, siZhu.day.diZhi, siZhu.hour.diZhi];
  const yearZhi = siZhu.year.diZhi;
  const dayZhi = siZhu.day.diZhi;
  const dayGan = siZhu.day.tianGan;

  // 桃花：以年支和日支分别查，看其他柱中是否出现
  const taoHua: ShenShaItem[] = [];
  const taoHuaByYear = TAO_HUA_MAP[yearZhi];
  const taoHuaByDay = TAO_HUA_MAP[dayZhi];

  for (let i = 0; i < allZhi.length; i++) {
    if (allZhi[i] === taoHuaByYear && i !== 0) {
      taoHua.push({
        name: '桃花（年支查）',
        position: PILLAR_NAMES[i],
        description: `${PILLAR_NAMES[i]}${allZhi[i]}为年支所查桃花，异性缘${i === 2 ? '在配偶方面' : ''}旺盛`,
      });
    }
    if (allZhi[i] === taoHuaByDay && i !== 2) {
      taoHua.push({
        name: '桃花（日支查）',
        position: PILLAR_NAMES[i],
        description: `${PILLAR_NAMES[i]}${allZhi[i]}为日支所查桃花，内心感情丰富`,
      });
    }
  }

  // 红鸾：以年支查，看命局其他柱
  let hongLuan: ShenShaItem | null = null;
  const hongLuanZhi = HONG_LUAN_MAP[yearZhi];
  for (let i = 0; i < allZhi.length; i++) {
    if (allZhi[i] === hongLuanZhi && i !== 0) {
      hongLuan = {
        name: '红鸾',
        position: PILLAR_NAMES[i],
        description: `红鸾在${PILLAR_NAMES[i]}，主姻缘顺利，${i === 2 ? '配偶相貌好，婚姻幸福' : '容易遇正缘'}`,
      };
      break;
    }
  }

  // 天喜：以年支查
  let tianXi: ShenShaItem | null = null;
  const tianXiZhi = TIAN_XI_MAP[yearZhi];
  for (let i = 0; i < allZhi.length; i++) {
    if (allZhi[i] === tianXiZhi && i !== 0) {
      tianXi = {
        name: '天喜',
        position: PILLAR_NAMES[i],
        description: `天喜在${PILLAR_NAMES[i]}，性格开朗，容易有喜庆之事`,
      };
      break;
    }
  }

  // 孤辰：以年支查
  let guChen: ShenShaItem | null = null;
  const guChenZhi = GU_CHEN_MAP[yearZhi];
  for (let i = 0; i < allZhi.length; i++) {
    if (allZhi[i] === guChenZhi) {
      guChen = {
        name: '孤辰',
        position: PILLAR_NAMES[i],
        description: `孤辰在${PILLAR_NAMES[i]}，${i === 2 ? '对婚姻影响较大，' : ''}性格偏孤僻，不善交际`,
      };
      break;
    }
  }

  // 寡宿：以年支查
  let guaSu: ShenShaItem | null = null;
  const guaSuZhi = GUA_SU_MAP[yearZhi];
  for (let i = 0; i < allZhi.length; i++) {
    if (allZhi[i] === guaSuZhi) {
      guaSu = {
        name: '寡宿',
        position: PILLAR_NAMES[i],
        description: `寡宿在${PILLAR_NAMES[i]}，${i === 2 ? '对婚姻影响较大，' : ''}感情中独处时间较多`,
      };
      break;
    }
  }

  // 华盖：以年支和日支查
  const huaGai: ShenShaItem[] = [];
  const huaGaiByYear = HUA_GAI_MAP[yearZhi];
  const huaGaiByDay = HUA_GAI_MAP[dayZhi];
  for (let i = 0; i < allZhi.length; i++) {
    if (allZhi[i] === huaGaiByYear || allZhi[i] === huaGaiByDay) {
      const isInDayPillar = i === 2;
      huaGai.push({
        name: '华盖',
        position: PILLAR_NAMES[i],
        description: `华盖在${PILLAR_NAMES[i]}，聪明好学${isInDayPillar ? '，对配偶要求高，可能晚婚' : ''}`,
      });
    }
  }

  // 天乙贵人：以日干查
  const tianYiGuiRen: ShenShaItem[] = [];
  const guiRenZhi = TIAN_YI_GUI_REN_MAP[dayGan];
  for (let i = 0; i < allZhi.length; i++) {
    if (guiRenZhi.includes(allZhi[i])) {
      tianYiGuiRen.push({
        name: '天乙贵人',
        position: PILLAR_NAMES[i],
        description: `天乙贵人在${PILLAR_NAMES[i]}，${i === 2 ? '配偶有贵气，能得配偶助力' : '有贵人相助'}`,
      });
    }
  }

  // 驿马：以年支和日支查
  const yiMa: ShenShaItem[] = [];
  const yiMaByYear = YI_MA_MAP[yearZhi];
  const yiMaByDay = YI_MA_MAP[dayZhi];
  for (let i = 0; i < allZhi.length; i++) {
    if (allZhi[i] === yiMaByYear || allZhi[i] === yiMaByDay) {
      yiMa.push({
        name: '驿马',
        position: PILLAR_NAMES[i],
        description: `驿马在${PILLAR_NAMES[i]}，${i === 2 ? '配偶奔波在外或远方之人' : '主奔波变动'}`,
      });
    }
  }

  // 综合判断
  const hasPositiveTaoHua = taoHua.length > 0;
  const hasHongLuanTianXi = hongLuan !== null || tianXi !== null;
  const hasGuChenGuaSu = guChen !== null || guaSu !== null;
  const hasHuaGai = huaGai.some((h) => h.position === '日柱');

  let marriageFavorability: ShenShaResult['summary']['marriageFavorability'] = '一般';
  if (hasHongLuanTianXi && hasPositiveTaoHua && !hasGuChenGuaSu) {
    marriageFavorability = '极好';
  } else if ((hasHongLuanTianXi || hasPositiveTaoHua) && !hasGuChenGuaSu) {
    marriageFavorability = '较好';
  } else if (hasGuChenGuaSu && hasHuaGai) {
    marriageFavorability = '偏差';
  }

  return {
    taoHua,
    hongLuan,
    tianXi,
    guChen,
    guaSu,
    huaGai,
    tianYiGuiRen,
    yiMa,
    summary: {
      hasPositiveTaoHua,
      hasHongLuanTianXi,
      hasGuChenGuaSu,
      hasHuaGai,
      marriageFavorability,
    },
  };
}
