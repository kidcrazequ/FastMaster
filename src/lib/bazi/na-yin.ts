/**
 * 纳音五行模块
 * Author: zhi.qu
 * Date: 2026-03-16
 * Description: 六十甲子纳音查询与纳音合婚判断
 */

import type { TianGan, DiZhi, WuXing } from '@/types/bazi';

/** 纳音名称 */
export type NaYinName =
  | '海中金' | '炉中火' | '大林木' | '路旁土' | '剑锋金'
  | '山头火' | '涧下水' | '城头土' | '白蜡金' | '杨柳木'
  | '泉中水' | '屋上土' | '霹雳火' | '松柏木' | '长流水'
  | '沙中金' | '山下火' | '平地木' | '壁上土' | '金箔金'
  | '覆灯火' | '天河水' | '大驿土' | '钗钏金' | '桑柘木'
  | '大溪水' | '沙中土' | '天上火' | '石榴木' | '大海水';

/** 纳音信息 */
export interface NaYinInfo {
  name: NaYinName;
  wuXing: WuXing;
  description: string;
}

/**
 * 六十甲子纳音映射表
 * key 为"天干地支"组合字符串
 */
const NA_YIN_MAP: Record<string, NaYinInfo> = {
  '甲子': { name: '海中金', wuXing: '金', description: '金在海中，深藏不露，外柔内刚' },
  '乙丑': { name: '海中金', wuXing: '金', description: '金在海中，深藏不露，外柔内刚' },
  '丙寅': { name: '炉中火', wuXing: '火', description: '炉火熊熊，热情旺盛，有冲劲' },
  '丁卯': { name: '炉中火', wuXing: '火', description: '炉火熊熊，热情旺盛，有冲劲' },
  '戊辰': { name: '大林木', wuXing: '木', description: '大树成林，气势磅礴，有领导力' },
  '己巳': { name: '大林木', wuXing: '木', description: '大树成林，气势磅礴，有领导力' },
  '庚午': { name: '路旁土', wuXing: '土', description: '路边之土，包容性强，务实' },
  '辛未': { name: '路旁土', wuXing: '土', description: '路边之土，包容性强，务实' },
  '壬申': { name: '剑锋金', wuXing: '金', description: '金至锋利，刚强有力，有魄力' },
  '癸酉': { name: '剑锋金', wuXing: '金', description: '金至锋利，刚强有力，有魄力' },
  '甲戌': { name: '山头火', wuXing: '火', description: '山顶之火，照耀四方，有影响力' },
  '乙亥': { name: '山头火', wuXing: '火', description: '山顶之火，照耀四方，有影响力' },
  '丙子': { name: '涧下水', wuXing: '水', description: '清泉小溪，纯净灵秀，性格清高' },
  '丁丑': { name: '涧下水', wuXing: '水', description: '清泉小溪，纯净灵秀，性格清高' },
  '戊寅': { name: '城头土', wuXing: '土', description: '城墙之土，坚固可靠，有防护性' },
  '己卯': { name: '城头土', wuXing: '土', description: '城墙之土，坚固可靠，有防护性' },
  '庚辰': { name: '白蜡金', wuXing: '金', description: '金质温润，性格柔和，有修养' },
  '辛巳': { name: '白蜡金', wuXing: '金', description: '金质温润，性格柔和，有修养' },
  '壬午': { name: '杨柳木', wuXing: '木', description: '柳树柔韧，善于适应，随和' },
  '癸未': { name: '杨柳木', wuXing: '木', description: '柳树柔韧，善于适应，随和' },
  '甲申': { name: '泉中水', wuXing: '水', description: '泉水涌动，有活力，善于创新' },
  '乙酉': { name: '泉中水', wuXing: '水', description: '泉水涌动，有活力，善于创新' },
  '丙戌': { name: '屋上土', wuXing: '土', description: '房屋之土，安稳居家，重家庭' },
  '丁亥': { name: '屋上土', wuXing: '土', description: '房屋之土，安稳居家，重家庭' },
  '戊子': { name: '霹雳火', wuXing: '火', description: '雷电之火，瞬间爆发，有冲击力' },
  '己丑': { name: '霹雳火', wuXing: '火', description: '雷电之火，瞬间爆发，有冲击力' },
  '庚寅': { name: '松柏木', wuXing: '木', description: '松柏长青，坚定不移，有毅力' },
  '辛卯': { name: '松柏木', wuXing: '木', description: '松柏长青，坚定不移，有毅力' },
  '壬辰': { name: '长流水', wuXing: '水', description: '江河奔流，胸怀宽广，有远见' },
  '癸巳': { name: '长流水', wuXing: '水', description: '江河奔流，胸怀宽广，有远见' },
  '甲午': { name: '沙中金', wuXing: '金', description: '金藏沙中，需要提炼，大器晚成' },
  '乙未': { name: '沙中金', wuXing: '金', description: '金藏沙中，需要提炼，大器晚成' },
  '丙申': { name: '山下火', wuXing: '火', description: '落日之火，温暖柔和，不张扬' },
  '丁酉': { name: '山下火', wuXing: '火', description: '落日之火，温暖柔和，不张扬' },
  '戊戌': { name: '平地木', wuXing: '木', description: '平原之木，开阔大方，性格温和' },
  '己亥': { name: '平地木', wuXing: '木', description: '平原之木，开阔大方，性格温和' },
  '庚子': { name: '壁上土', wuXing: '土', description: '墙壁之土，有界限，性格分明' },
  '辛丑': { name: '壁上土', wuXing: '土', description: '墙壁之土，有界限，性格分明' },
  '壬寅': { name: '金箔金', wuXing: '金', description: '金箔轻薄，外表光鲜，需积累实力' },
  '癸卯': { name: '金箔金', wuXing: '金', description: '金箔轻薄，外表光鲜，需积累实力' },
  '甲辰': { name: '覆灯火', wuXing: '火', description: '灯火如豆，内敛含蓄，有内涵' },
  '乙巳': { name: '覆灯火', wuXing: '火', description: '灯火如豆，内敛含蓄，有内涵' },
  '丙午': { name: '天河水', wuXing: '水', description: '银河之水，高雅超脱，有理想' },
  '丁未': { name: '天河水', wuXing: '水', description: '银河之水，高雅超脱，有理想' },
  '戊申': { name: '大驿土', wuXing: '土', description: '大道之土，宽广豁达，善交际' },
  '己酉': { name: '大驿土', wuXing: '土', description: '大道之土，宽广豁达，善交际' },
  '庚戌': { name: '钗钏金', wuXing: '金', description: '金为装饰，精致优雅，有审美' },
  '辛亥': { name: '钗钏金', wuXing: '金', description: '金为装饰，精致优雅，有审美' },
  '壬子': { name: '桑柘木', wuXing: '木', description: '实用之木，务实勤劳' },
  '癸丑': { name: '桑柘木', wuXing: '木', description: '实用之木，务实勤劳' },
  '甲寅': { name: '大溪水', wuXing: '水', description: '溪水潺潺，温和柔美，善于沟通' },
  '乙卯': { name: '大溪水', wuXing: '水', description: '溪水潺潺，温和柔美，善于沟通' },
  '丙辰': { name: '沙中土', wuXing: '土', description: '沙中之土，外粗内细，内含水分' },
  '丁巳': { name: '沙中土', wuXing: '土', description: '沙中之土，外粗内细，内含水分' },
  '戊午': { name: '天上火', wuXing: '火', description: '太阳之火，光芒万丈，有领袖气质' },
  '己未': { name: '天上火', wuXing: '火', description: '太阳之火，光芒万丈，有领袖气质' },
  '庚申': { name: '石榴木', wuXing: '木', description: '开花结果，有成就，晚年得意' },
  '辛酉': { name: '石榴木', wuXing: '木', description: '开花结果，有成就，晚年得意' },
  '壬戌': { name: '大海水', wuXing: '水', description: '大海包容，气度非凡，包容万物' },
  '癸亥': { name: '大海水', wuXing: '水', description: '大海包容，气度非凡，包容万物' },
};

/**
 * 查询干支组合的纳音
 * @param gan - 天干
 * @param zhi - 地支
 * @returns 纳音信息，未找到时返回 null
 */
export function getNaYin(gan: TianGan, zhi: DiZhi): NaYinInfo | null {
  const key = `${gan}${zhi}`;
  return NA_YIN_MAP[key] || null;
}

/**
 * 查询年柱纳音（最常用于合婚）
 * @param yearGan - 年干
 * @param yearZhi - 年支
 * @returns 纳音信息
 */
export function getYearNaYin(yearGan: TianGan, yearZhi: DiZhi): NaYinInfo | null {
  return getNaYin(yearGan, yearZhi);
}

/** 纳音五行大小等级（用于判断克制关系中的强弱） */
const NA_YIN_SCALE: Record<NaYinName, number> = {
  '海中金': 8, '剑锋金': 9, '白蜡金': 5, '沙中金': 4, '金箔金': 2, '钗钏金': 6,
  '大林木': 8, '杨柳木': 4, '松柏木': 9, '平地木': 5, '桑柘木': 3, '石榴木': 6,
  '涧下水': 3, '泉中水': 5, '长流水': 7, '天河水': 9, '大溪水': 6, '大海水': 10,
  '炉中火': 7, '山头火': 8, '霹雳火': 9, '山下火': 4, '覆灯火': 2, '天上火': 10,
  '路旁土': 5, '城头土': 7, '屋上土': 6, '壁上土': 4, '大驿土': 8, '沙中土': 3,
};

/** 纳音合婚结果 */
export interface NaYinMarriageResult {
  person1NaYin: NaYinInfo;
  person2NaYin: NaYinInfo;
  relationship: '相生' | '相克' | '比和';
  direction: string;
  score: number;
  description: string;
}

/**
 * 纳音合婚分析
 * @param nayin1 - 男方年柱纳音
 * @param nayin2 - 女方年柱纳音
 * @returns 纳音合婚结果
 */
export function analyzeNaYinMarriage(nayin1: NaYinInfo, nayin2: NaYinInfo): NaYinMarriageResult {
  const wx1 = nayin1.wuXing;
  const wx2 = nayin2.wuXing;

  const shengMap: Record<WuXing, WuXing> = {
    '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
  };

  const scale1 = NA_YIN_SCALE[nayin1.name];
  const scale2 = NA_YIN_SCALE[nayin2.name];

  if (wx1 === wx2) {
    const sameNameBonus = nayin1.name === nayin2.name ? 5 : 0;
    return {
      person1NaYin: nayin1,
      person2NaYin: nayin2,
      relationship: '比和',
      direction: `同为${wx1}命`,
      score: 75 + sameNameBonus,
      description: `双方年命同属${wx1}（${nayin1.name}与${nayin2.name}），志趣相投，容易理解对方`,
    };
  }

  if (shengMap[wx1] === wx2) {
    return {
      person1NaYin: nayin1,
      person2NaYin: nayin2,
      relationship: '相生',
      direction: `${wx1}生${wx2}`,
      score: 82,
      description: `男方${nayin1.name}（${wx1}）生女方${nayin2.name}（${wx2}），男方付出滋养女方，感情流动顺畅`,
    };
  }

  if (shengMap[wx2] === wx1) {
    return {
      person1NaYin: nayin1,
      person2NaYin: nayin2,
      relationship: '相生',
      direction: `${wx2}生${wx1}`,
      score: 85,
      description: `女方${nayin2.name}（${wx2}）生男方${nayin1.name}（${wx1}），女方滋养男方，旺夫之配`,
    };
  }

  const keMap: Record<WuXing, WuXing> = {
    '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
  };

  if (keMap[wx1] === wx2) {
    const bigSmall = scale1 >= scale2 ? '以大制小，尚可' : '以小制大，力不从心';
    const score = scale1 >= scale2 ? 65 : 55;
    return {
      person1NaYin: nayin1,
      person2NaYin: nayin2,
      relationship: '相克',
      direction: `${wx1}克${wx2}`,
      score,
      description: `男方${nayin1.name}（${wx1}）克女方${nayin2.name}（${wx2}），${bigSmall}`,
    };
  }

  const bigSmall = scale2 >= scale1 ? '以大制小，尚可' : '以小制大，力不从心';
  const score = scale2 >= scale1 ? 60 : 50;
  return {
    person1NaYin: nayin1,
    person2NaYin: nayin2,
    relationship: '相克',
    direction: `${wx2}克${wx1}`,
    score,
    description: `女方${nayin2.name}（${wx2}）克男方${nayin1.name}（${wx1}），${bigSmall}`,
  };
}
