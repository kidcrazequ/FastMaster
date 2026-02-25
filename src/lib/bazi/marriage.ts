/**
 * 合婚分析算法
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 基于八字分析双方的婚姻契合度
 */

import type { PersonBazi, MarriageAnalysisResult, MarriageDimension, WuXing } from '@/types/bazi';
import {
  TIAN_GAN_WU_XING,
  DI_ZHI_WU_XING,
  WU_XING_SHENG,
  WU_XING_KE,
  TIAN_GAN_HE,
  DI_ZHI_LIU_HE,
  DI_ZHI_CHONG,
  DI_ZHI_HAI,
} from './constants';

/**
 * 检查天干是否相合
 * @param gan1 - 天干1
 * @param gan2 - 天干2
 * @returns 是否相合
 */
function isTianGanHe(gan1: string, gan2: string): boolean {
  return TIAN_GAN_HE.some(([a, b]) => (a === gan1 && b === gan2) || (a === gan2 && b === gan1));
}

/**
 * 检查地支是否六合
 * @param zhi1 - 地支1
 * @param zhi2 - 地支2
 * @returns 是否六合
 */
function isDiZhiLiuHe(zhi1: string, zhi2: string): boolean {
  return DI_ZHI_LIU_HE.some(([a, b]) => (a === zhi1 && b === zhi2) || (a === zhi2 && b === zhi1));
}

/**
 * 检查地支是否相冲
 * @param zhi1 - 地支1
 * @param zhi2 - 地支2
 * @returns 是否相冲
 */
function isDiZhiChong(zhi1: string, zhi2: string): boolean {
  return DI_ZHI_CHONG.some(([a, b]) => (a === zhi1 && b === zhi2) || (a === zhi2 && b === zhi1));
}

/**
 * 检查地支是否相害
 * @param zhi1 - 地支1
 * @param zhi2 - 地支2
 * @returns 是否相害
 */
function isDiZhiHai(zhi1: string, zhi2: string): boolean {
  return DI_ZHI_HAI.some(([a, b]) => (a === zhi1 && b === zhi2) || (a === zhi2 && b === zhi1));
}

/**
 * 检查五行是否相生
 * @param wx1 - 五行1
 * @param wx2 - 五行2
 * @returns 是否相生
 */
function isWuXingSheng(wx1: WuXing, wx2: WuXing): boolean {
  return WU_XING_SHENG[wx1] === wx2 || WU_XING_SHENG[wx2] === wx1;
}

/**
 * 检查五行是否相克
 * @param wx1 - 五行1
 * @param wx2 - 五行2
 * @returns 是否相克
 */
function isWuXingKe(wx1: WuXing, wx2: WuXing): boolean {
  return WU_XING_KE[wx1] === wx2 || WU_XING_KE[wx2] === wx1;
}

/**
 * 计算基础契合度
 * @param person1 - 男方八字
 * @param person2 - 女方八字
 * @returns 基础契合度维度
 */
function calculateBasicCompatibility(person1: PersonBazi, person2: PersonBazi): MarriageDimension {
  let score = 72; // 基础分（调高基础分，大多数人应该有基本的匹配度）
  const factors: string[] = [];
  const highlights: string[] = []; // 重点特征

  // 年柱分析
  if (isTianGanHe(person1.siZhu.year.tianGan, person2.siZhu.year.tianGan)) {
    score += 10;
    factors.push('年干相合（' + person1.siZhu.year.tianGan + '与' + person2.siZhu.year.tianGan + '），天作之合，双方在人生观和价值取向上容易产生共鸣');
    highlights.push('天干合');
  }
  if (isDiZhiLiuHe(person1.siZhu.year.diZhi, person2.siZhu.year.diZhi)) {
    score += 10;
    factors.push('年支六合（' + person1.siZhu.year.diZhi + '与' + person2.siZhu.year.diZhi + '），代表双方家庭背景融洽，长辈会支持这段姻缘');
    highlights.push('年支合');
  }
  if (isDiZhiChong(person1.siZhu.year.diZhi, person2.siZhu.year.diZhi)) {
    score -= 6;
    factors.push('年支相冲（' + person1.siZhu.year.diZhi + '冲' + person2.siZhu.year.diZhi + '），双方家庭观念可能有差异，需要互相理解适应');
  }

  // 日元（日主）五行关系
  const riYuan1 = person1.riYuanWuXing;
  const riYuan2 = person2.riYuanWuXing;

  if (riYuan1 === riYuan2) {
    score += 8;
    factors.push('日元同属' + riYuan1 + '，两人性格相似，思维方式接近，容易产生默契和共鸣');
    highlights.push('比和');
  } else if (isWuXingSheng(riYuan1, riYuan2)) {
    score += 12;
    const shengDesc = riYuan1 === TIAN_GAN_WU_XING[person1.riYuan] ? 
      `${riYuan1}生${riYuan2}` : `${riYuan2}生${riYuan1}`;
    factors.push('日元' + shengDesc + '，五行相生代表感情能够自然流动，一方付出另一方能够接收，形成良性循环');
    highlights.push('相生');
  } else if (isWuXingKe(riYuan1, riYuan2)) {
    score += 2;
    factors.push('日元' + riYuan1 + '与' + riYuan2 + '相克，但相克也是一种制约平衡，有利于互相督促进步');
  } else {
    score += 5;
    factors.push('日元' + riYuan1 + '与' + riYuan2 + '关系平和，感情发展稳定');
  }

  // 日柱相合（日柱是婚姻宫，权重最高）
  if (isTianGanHe(person1.siZhu.day.tianGan, person2.siZhu.day.tianGan)) {
    score += 12;
    factors.push('日干相合（' + person1.siZhu.day.tianGan + '合' + person2.siZhu.day.tianGan + '），代表心灵相通，彼此能够深刻理解对方的内心世界');
    highlights.push('日干合');
  }
  if (isDiZhiLiuHe(person1.siZhu.day.diZhi, person2.siZhu.day.diZhi)) {
    score += 12;
    factors.push('日支六合（' + person1.siZhu.day.diZhi + '合' + person2.siZhu.day.diZhi + '），婚姻宫相合是最佳配对，预示婚后生活甜蜜和谐');
    highlights.push('婚姻宫合');
  }
  if (isDiZhiChong(person1.siZhu.day.diZhi, person2.siZhu.day.diZhi)) {
    score -= 5;
    factors.push('日支相冲（' + person1.siZhu.day.diZhi + '冲' + person2.siZhu.day.diZhi + '），婚姻宫相冲代表感情中会有波折，但冲也带来激情，需要学会化解矛盾');
  }

  // 月柱分析（代表家庭背景和成长环境）
  if (isTianGanHe(person1.siZhu.month.tianGan, person2.siZhu.month.tianGan)) {
    score += 6;
    factors.push('月干相合，说明双方成长环境相近，价值观容易达成一致');
  }
  if (isDiZhiLiuHe(person1.siZhu.month.diZhi, person2.siZhu.month.diZhi)) {
    score += 6;
    factors.push('月支六合，代表双方内心世界相通，能够互相给予情感支持');
  }

  score = Math.max(50, Math.min(100, score));

  // 生成更丰富的建议
  let advice = '';
  if (score >= 85) {
    advice = '基础匹配优秀，非常般配！双方八字显示有深厚的缘分基础';
  } else if (score >= 75) {
    advice = '基础匹配良好，值得珍惜。双方在很多方面能够互相理解';
  } else if (score >= 65) {
    advice = '基础匹配尚可，需要用心经营。多沟通、多包容是关键';
  } else {
    advice = '需要更多时间相互磨合，建议多了解对方的想法和需求';
  }

  return {
    name: '基础契合度',
    score,
    description: factors.length > 0 ? factors.join('；') : '双方八字整体匹配度良好，感情发展较为顺利',
    advice,
  };
}

/**
 * 计算性格相容性
 * @param person1 - 男方八字
 * @param person2 - 女方八字
 * @returns 性格相容性维度
 */
function calculatePersonalityMatch(person1: PersonBazi, person2: PersonBazi): MarriageDimension {
  let score = 75; // 提高基础分
  const factors: string[] = [];

  // 基于日元分析性格（更详细的描述）
  const wx1 = person1.riYuanWuXing;
  const wx2 = person2.riYuanWuXing;

  const personalityMap: Record<WuXing, { brief: string; detailed: string }> = {
    '木': { 
      brief: '仁慈宽厚，富有创造力',
      detailed: '性格正直善良，有领导才能，善于规划未来，追求成长与发展'
    },
    '火': { 
      brief: '热情开朗，积极进取',
      detailed: '性情直率热烈，善于表达情感，有感染力，追求精彩生活'
    },
    '土': { 
      brief: '稳重踏实，包容性强',
      detailed: '性格沉稳可靠，重信守诺，有责任感，是值得依赖的伴侣'
    },
    '金': { 
      brief: '果断刚毅，原则性强',
      detailed: '做事干脆利落，有魄力和决断力，目标明确，执行力强'
    },
    '水': { 
      brief: '聪慧灵活，适应力强',
      detailed: '思维敏捷多变，善于沟通协调，直觉敏锐，富有智慧'
    },
  };

  factors.push(`${person1.name}性格特点：${personalityMap[wx1].brief}，${personalityMap[wx1].detailed}`);
  factors.push(`${person2.name}性格特点：${personalityMap[wx2].brief}，${personalityMap[wx2].detailed}`);

  // 性格互补分析（更详细）
  if (isWuXingSheng(wx1, wx2)) {
    score += 12;
    const shengDesc = `${wx1}生${wx2}`;
    factors.push(`性格${shengDesc}，一方的特质能够滋养另一方，形成良性互动。${wx1}的特性给予${wx2}支持与滋养，感情自然流动`);
  } else if (wx1 === wx2) {
    score += 8;
    factors.push(`双方都属${wx1}性格，志趣相投，思维模式相似，能够快速建立默契。但也需注意避免过于相似而缺乏互补`);
  } else if (isWuXingKe(wx1, wx2)) {
    score += 3;
    factors.push(`性格差异较大（${wx1}与${wx2}），恰好可以形成互补。一方的锐利可以被另一方的包容所化解，相互制约中寻找平衡`);
  } else {
    score += 5;
    factors.push(`性格各有特色（${wx1}与${wx2}），关系较为平和，不会有太大冲突，也能各展所长`);
  }

  // 月柱分析（代表成长环境和内心）
  if (isDiZhiLiuHe(person1.siZhu.month.diZhi, person2.siZhu.month.diZhi)) {
    score += 10;
    factors.push(`月支六合（${person1.siZhu.month.diZhi}合${person2.siZhu.month.diZhi}），代表两人内心世界相通，价值观和情感需求能够互相理解`);
  }
  if (isTianGanHe(person1.siZhu.month.tianGan, person2.siZhu.month.tianGan)) {
    score += 8;
    factors.push(`月干相合（${person1.siZhu.month.tianGan}合${person2.siZhu.month.tianGan}），说明双方在情感表达上能够产生共鸣，心意相通`);
  }

  // 时柱分析（代表内心想法和子女观念）
  if (isDiZhiLiuHe(person1.siZhu.hour.diZhi, person2.siZhu.hour.diZhi)) {
    score += 6;
    factors.push(`时支六合（${person1.siZhu.hour.diZhi}合${person2.siZhu.hour.diZhi}），代表双方对未来的规划一致，在子女教育观念上容易达成共识`);
  }
  if (isDiZhiChong(person1.siZhu.hour.diZhi, person2.siZhu.hour.diZhi)) {
    score -= 3;
    factors.push(`时支相冲（${person1.siZhu.hour.diZhi}冲${person2.siZhu.hour.diZhi}），在子女教育和晚年规划上可能有分歧，需要多沟通协调`);
  }

  score = Math.max(55, Math.min(100, score));

  // 更丰富的建议
  let advice = '';
  if (score >= 85) {
    advice = '性格高度匹配，堪称绝配！双方能够深刻理解对方，相处起来非常舒适';
  } else if (score >= 75) {
    advice = '性格互补，适合共同生活。双方性格特点能够互相弥补，有利于长期相处';
  } else if (score >= 65) {
    advice = '性格有一定差异，但差异也是互补的开始，多沟通增进理解是关键';
  } else {
    advice = '需要多沟通，增进理解。学会欣赏对方的不同，才能让感情更加稳固';
  }

  return {
    name: '性格相容性',
    score,
    description: factors.join('；'),
    advice,
  };
}

/**
 * 计算婚姻宫位分析
 * @param person1 - 男方八字
 * @param person2 - 女方八字
 * @returns 婚姻宫位维度
 */
function calculateMarriagePalace(person1: PersonBazi, person2: PersonBazi): MarriageDimension {
  let score = 75; // 提高基础分
  const factors: string[] = [];

  // 日支为婚姻宫
  const mp1 = person1.siZhu.day.diZhi;
  const mp2 = person2.siZhu.day.diZhi;
  const mpWx1 = DI_ZHI_WU_XING[mp1 as keyof typeof DI_ZHI_WU_XING];
  const mpWx2 = DI_ZHI_WU_XING[mp2 as keyof typeof DI_ZHI_WU_XING];
  
  // 日干（代表婚姻中的情感表达）
  const dg1 = person1.siZhu.day.tianGan;
  const dg2 = person2.siZhu.day.tianGan;

  // 婚姻宫相合
  if (isDiZhiLiuHe(mp1, mp2)) {
    score += 18;
    factors.push(`婚姻宫六合（${mp1}合${mp2}），这是合婚中最吉利的组合之一，代表两人天生有缘，婚后生活甜蜜恩爱，感情稳固`);
  } else if (isDiZhiChong(mp1, mp2)) {
    score -= 8;
    factors.push(`婚姻宫相冲（${mp1}冲${mp2}），代表双方个性都比较强势，婚后容易有争执。但冲也代表激情，需要学会在矛盾中成长`);
  } else if (isDiZhiHai(mp1, mp2)) {
    score -= 5;
    factors.push(`婚姻宫相害（${mp1}害${mp2}），暗示婚后可能有小摩擦，需要注意说话方式，多给对方理解和空间`);
  } else {
    // 无冲无合，根据五行关系判断
    if (isWuXingSheng(mpWx1, mpWx2)) {
      score += 8;
      factors.push(`婚姻宫五行相生（${mpWx1}生${mpWx2}），感情能够持续滋养，婚后相处融洽，一方付出另一方能够感受到温暖`);
    } else if (mpWx1 === mpWx2) {
      score += 5;
      factors.push(`婚姻宫五行相同（同属${mpWx1}），双方在婚姻观念上一致，对家庭生活的期望相近，容易达成共识`);
    } else {
      factors.push(`婚姻宫位（${mp1}与${mp2}）关系平和，婚姻生活稳定，虽无特别助力但也无阻碍`);
    }
  }

  // 日干相合（夫妻宫天干）
  if (isTianGanHe(dg1, dg2)) {
    score += 10;
    factors.push(`日干相合（${dg1}合${dg2}），代表夫妻心灵相通，能够理解对方的想法，在重大决策上容易达成一致。这是夫妻缘分深厚的象征`);
  }

  // 时柱分析（代表子女宫和晚年）
  if (isDiZhiLiuHe(person1.siZhu.hour.diZhi, person2.siZhu.hour.diZhi)) {
    score += 8;
    factors.push(`时支六合（${person1.siZhu.hour.diZhi}合${person2.siZhu.hour.diZhi}），代表子女运势佳，在子女教育观念上容易统一，晚年生活幸福美满`);
  }
  if (isTianGanHe(person1.siZhu.hour.tianGan, person2.siZhu.hour.tianGan)) {
    score += 6;
    factors.push(`时干相合（${person1.siZhu.hour.tianGan}合${person2.siZhu.hour.tianGan}），预示晚年生活和谐，能够相互扶持，共度人生晚景`);
  }

  score = Math.max(55, Math.min(100, score));

  // 更丰富的建议
  let advice = '';
  if (score >= 90) {
    advice = '婚姻宫位大吉！两人有深厚的夫妻缘分，携手一生，白头偕老';
  } else if (score >= 80) {
    advice = '婚姻宫位相合，婚姻基础稳固，婚后生活幸福美满';
  } else if (score >= 70) {
    advice = '婚姻宫位尚可，需要双方共同经营，多一些包容和理解';
  } else {
    advice = '可通过五行调和来改善，选择适合的结婚日期和方位也很重要';
  }

  return {
    name: '婚姻宫位',
    score,
    description: factors.length > 0 ? factors.join('；') : '婚姻宫位平和，婚姻生活稳定',
    advice,
  };
}

/**
 * 计算家庭和谐度
 * @param person1 - 男方八字
 * @param person2 - 女方八字
 * @returns 家庭和谐维度
 */
function calculateFamilyHarmony(person1: PersonBazi, person2: PersonBazi): MarriageDimension {
  let score = 75; // 提高基础分
  const factors: string[] = [];

  // 五行互补分析
  const count1 = person1.wuXingCount;
  const count2 = person2.wuXingCount;

  // 检查五行缺失是否互补，并记录具体的互补情况
  const wuXingKeys: WuXing[] = ['金', '木', '水', '火', '土'];
  const complementDetails: string[] = [];

  for (const wx of wuXingKeys) {
    if (count1[wx] < 0.5 && count2[wx] >= 2) {
      complementDetails.push(`${person1.name}缺${wx}，${person2.name}${wx}旺可补`);
    } else if (count2[wx] < 0.5 && count1[wx] >= 2) {
      complementDetails.push(`${person2.name}缺${wx}，${person1.name}${wx}旺可补`);
    }
  }

  if (complementDetails.length >= 2) {
    score += 12;
    factors.push(`五行互补明显（${complementDetails.join('；')}），双方的能量场可以相互补充，形成更完整的家庭气场`);
  } else if (complementDetails.length >= 1) {
    score += 8;
    factors.push(`五行有所互补（${complementDetails[0]}），这种互补有利于家庭能量的平衡，取长补短`);
  } else {
    // 检查五行平衡度
    let balance1 = 0, balance2 = 0;
    for (const wx of wuXingKeys) {
      if (count1[wx] >= 1) balance1++;
      if (count2[wx] >= 1) balance2++;
    }
    if (balance1 >= 4 && balance2 >= 4) {
      score += 6;
      factors.push('双方五行较为均衡，各自的命局都比较稳定，组建家庭后能够保持和谐');
    } else if (balance1 + balance2 >= 7) {
      score += 4;
      factors.push('五行分布合理，家庭能量场稳定');
    } else {
      factors.push('五行各有偏重，需要通过家居风水等方式来调和');
    }
  }

  // 年柱代表祖辈和家庭根基
  if (isDiZhiLiuHe(person1.siZhu.year.diZhi, person2.siZhu.year.diZhi)) {
    score += 10;
    factors.push(`年支相合（${person1.siZhu.year.diZhi}合${person2.siZhu.year.diZhi}），代表双方家族背景相容，两家长辈容易相处，婚事能够得到祝福`);
  }
  if (isTianGanHe(person1.siZhu.year.tianGan, person2.siZhu.year.tianGan)) {
    score += 8;
    factors.push(`年干相合（${person1.siZhu.year.tianGan}合${person2.siZhu.year.tianGan}），祖辈缘分深厚，家族运势相互扶持，有利于家业兴旺`);
  }
  if (isDiZhiChong(person1.siZhu.year.diZhi, person2.siZhu.year.diZhi)) {
    score -= 4;
    factors.push(`年支相冲（${person1.siZhu.year.diZhi}冲${person2.siZhu.year.diZhi}），双方家庭背景或观念可能有差异，需要互相理解和磨合`);
  }

  // 时柱代表子女和晚年
  if (isDiZhiLiuHe(person1.siZhu.hour.diZhi, person2.siZhu.hour.diZhi)) {
    score += 8;
    factors.push(`时支六合（${person1.siZhu.hour.diZhi}合${person2.siZhu.hour.diZhi}），代表子女运势佳，两人在子女教育问题上能够达成共识，晚年生活幸福`);
  }
  if (isDiZhiChong(person1.siZhu.hour.diZhi, person2.siZhu.hour.diZhi)) {
    score -= 5;
    factors.push(`时支相冲（${person1.siZhu.hour.diZhi}冲${person2.siZhu.hour.diZhi}），在子女教育观念上可能有分歧，需要多沟通协调，共同制定教育方针`);
  }
  if (isTianGanHe(person1.siZhu.hour.tianGan, person2.siZhu.hour.tianGan)) {
    score += 6;
    factors.push(`时干相合（${person1.siZhu.hour.tianGan}合${person2.siZhu.hour.tianGan}），预示晚年生活和谐美满，能够相互陪伴，共享天伦之乐`);
  }

  // 如果没有特别的因素，给一个正面评价
  if (factors.length === 0) {
    factors.push('家庭运势平稳，双方在家庭生活中能够和睦相处，共同经营美好未来');
  }

  score = Math.max(55, Math.min(100, score));

  // 更丰富的建议
  let advice = '';
  if (score >= 90) {
    advice = '家庭和谐美满，福泽绵长！两人的结合必将带来幸福美满的家庭生活';
  } else if (score >= 80) {
    advice = '家庭和谐美满，共创幸福。双方的八字显示家庭运势良好';
  } else if (score >= 70) {
    advice = '家庭运势稳定，需要双方共同努力经营，相互包容理解';
  } else {
    advice = '需要共同经营家庭关系，多沟通、多理解，用爱化解分歧';
  }

  return {
    name: '家庭和谐',
    score,
    description: factors.join('；'),
    advice,
  };
}

/**
 * 执行完整的合婚分析
 * @param person1 - 男方八字
 * @param person2 - 女方八字
 * @returns 合婚分析结果
 */
export function analyzeMarriage(person1: PersonBazi, person2: PersonBazi): MarriageAnalysisResult {
  const basicCompatibility = calculateBasicCompatibility(person1, person2);
  const personalityMatch = calculatePersonalityMatch(person1, person2);
  const marriagePalace = calculateMarriagePalace(person1, person2);
  const familyHarmony = calculateFamilyHarmony(person1, person2);

  // 计算总体评分（加权平均）
  const overallScore = Math.round(
    basicCompatibility.score * 0.3 +
    personalityMatch.score * 0.25 +
    marriagePalace.score * 0.25 +
    familyHarmony.score * 0.2
  );

  return {
    person1,
    person2,
    overallScore,
    dimensions: {
      basicCompatibility,
      personalityMatch,
      marriagePalace,
      familyHarmony,
    },
    createdAt: new Date(),
  };
}
