/**
 * 八字相关类型定义
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 定义八字计算和合婚分析相关的 TypeScript 类型
 */

/** 天干 */
export type TianGan = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';

/** 地支 */
export type DiZhi = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';

/** 五行 */
export type WuXing = '金' | '木' | '水' | '火' | '土';

/** 阴阳 */
export type YinYang = '阴' | '阳';

/** 性别 */
export type Gender = 'male' | 'female';

/** 生肖 */
export type Zodiac = '鼠' | '牛' | '虎' | '兔' | '龙' | '蛇' | '马' | '羊' | '猴' | '鸡' | '狗' | '猪';

/** 干支组合 */
export interface GanZhi {
  tianGan: TianGan;
  diZhi: DiZhi;
}

/** 八字四柱 */
export interface SiZhu {
  year: GanZhi;   // 年柱
  month: GanZhi;  // 月柱
  day: GanZhi;    // 日柱
  hour: GanZhi;   // 时柱
}

/** 五行统计 */
export interface WuXingCount {
  金: number;
  木: number;
  水: number;
  火: number;
  土: number;
}

/** 十神类型 */
export type ShiShen = '比肩' | '劫财' | '食神' | '伤官' | '偏财' | '正财' | '七杀' | '正官' | '偏印' | '正印';

/** 十神统计 */
export interface ShiShenCount {
  比肩: number;
  劫财: number;
  食神: number;
  伤官: number;
  偏财: number;
  正财: number;
  七杀: number;
  正官: number;
  偏印: number;
  正印: number;
}

/** 农历日期 */
export interface LunarDate {
  year: number;
  month: number;
  day: number;
  monthChinese: string;  // 如"正月"
  dayChinese: string;    // 如"初一"
  yearGanZhi: string;    // 如"甲子年"
  isLeapMonth: boolean;
}

/** 个人八字信息 */
export interface PersonBazi {
  name: string;
  gender: Gender;
  birthDate: Date;
  siZhu: SiZhu;
  wuXingCount: WuXingCount;
  shiShenCount?: ShiShenCount;  // 十神统计
  riYuan: TianGan;  // 日元（日主）
  riYuanWuXing: WuXing;  // 日元五行
  zodiac?: Zodiac;  // 生肖
  mingZhu?: string;  // 命主（如"甲木"）
  lunarDate?: LunarDate;  // 农历日期
  knowBirthTime?: boolean;  // 是否知道出生时间
  isEarlyZiHour?: boolean;  // 是否早子时（23:00-00:00）
  useTrueSolarTime?: boolean;  // 是否使用真太阳时
  birthPlace?: string;  // 出生地点
}

/** 合婚分析维度 */
export interface MarriageDimension {
  name: string;
  score: number;        // 0-100 评分
  description: string;  // 描述
  advice?: string;      // 建议
}

/** 五行平衡分析 */
export interface WuXingBalanceAnalysis {
  person1Balance: {
    strongest: WuXing;
    weakest: WuXing;
    balance: 'balanced' | 'slightly_imbalanced' | 'imbalanced';
    description: string;
  };
  person2Balance: {
    strongest: WuXing;
    weakest: WuXing;
    balance: 'balanced' | 'slightly_imbalanced' | 'imbalanced';
    description: string;
  };
  compatibility: {
    score: number;
    description: string;
    advice: string;
  };
}

/** 性格特点分析 */
export interface PersonalityAnalysis {
  person1Traits: string[];
  person2Traits: string[];
  compatibility: {
    score: number;
    strengths: string[];
    challenges: string[];
    advice: string;
  };
}

/** 婚姻宫分析 */
export interface MarriagePalaceAnalysis {
  person1Palace: {
    position: string;
    characteristics: string[];
    timing: string;
  };
  person2Palace: {
    position: string;
    characteristics: string[];
    timing: string;
  };
  compatibility: {
    score: number;
    description: string;
    advice: string;
  };
}

/** 子嗣分析 */
export interface ChildrenAnalysis {
  person1Potential: {
    timing: string;
    count: string;
    characteristics: string[];
  };
  person2Potential: {
    timing: string;
    count: string;
    characteristics: string[];
  };
  combined: {
    score: number;
    description: string;
    advice: string;
  };
}

/** 十神分析 */
export interface ShiShenAnalysis {
  person1: {
    dominant: ShiShen[];
    characteristics: string[];
    careerSuggestion: string;
  };
  person2: {
    dominant: ShiShen[];
    characteristics: string[];
    careerSuggestion: string;
  };
  compatibility: {
    score: number;
    description: string;
    advice: string;
  };
}

/** 合婚分析结果 */
export interface MarriageAnalysisResult {
  person1: PersonBazi;
  person2: PersonBazi;
  overallScore: number;  // 总体契合度 0-100
  dimensions: {
    basicCompatibility: MarriageDimension;      // 基础契合度
    personalityMatch: MarriageDimension;        // 性格相容性
    marriagePalace: MarriageDimension;          // 婚姻宫位
    familyHarmony: MarriageDimension;           // 家庭和谐
  };
  // 详细分析模块
  wuXingBalance?: WuXingBalanceAnalysis;        // 五行平衡分析
  personalityAnalysis?: PersonalityAnalysis;     // 性格特点分析
  marriagePalaceAnalysis?: MarriagePalaceAnalysis; // 婚姻宫分析
  childrenAnalysis?: ChildrenAnalysis;           // 子嗣分析
  shiShenAnalysis?: ShiShenAnalysis;             // 十神分析
  aiAnalysis?: string;   // AI 深度分析
  createdAt: Date;
}

/** 表单输入 - 个人信息 */
export interface PersonFormInput {
  name: string;
  gender: Gender;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  knowBirthTime: boolean;
  birthHour?: number;
  birthMinute?: number;
  birthPlace?: string;
  isEarlyZiHour?: boolean;
}

/** 合婚分析表单输入 */
export interface MarriageFormInput {
  person1: PersonFormInput;
  person2: PersonFormInput;
}

/** API 响应基础类型 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
