/**
 * 八字计算器
 * Author: zhi.qu
 * Date: 2026-01-05
 * Description: 根据出生日期时间计算八字四柱（年柱、月柱、日柱、时柱）
 */

import { Solar, Lunar } from 'lunar-typescript';
import type { TianGan, DiZhi, GanZhi, SiZhu, WuXingCount, PersonBazi, Gender } from '@/types/bazi';
import { TIAN_GAN, DI_ZHI, TIAN_GAN_WU_XING, DI_ZHI_WU_XING, DI_ZHI_CANG_GAN } from './constants';

/**
 * 根据索引获取天干
 * @param index - 天干索引（0-9）
 * @returns 天干
 */
export function getTianGan(index: number): TianGan {
  return TIAN_GAN[((index % 10) + 10) % 10];
}

/**
 * 根据索引获取地支
 * @param index - 地支索引（0-11）
 * @returns 地支
 */
export function getDiZhi(index: number): DiZhi {
  return DI_ZHI[((index % 12) + 12) % 12];
}

/**
 * 根据小时获取时辰地支
 * @param hour - 小时（0-23）
 * @returns 时辰地支
 */
export function getHourDiZhi(hour: number): DiZhi {
  // 子时从 23:00 开始
  const adjustedHour = (hour + 1) % 24;
  const zhiIndex = Math.floor(adjustedHour / 2);
  return getDiZhi(zhiIndex);
}

/**
 * 根据日干和时辰地支索引计算时干
 * @param dayGanIndex - 日干索引
 * @param hourZhiIndex - 时辰地支索引
 * @returns 时干
 */
export function getHourTianGan(dayGanIndex: number, hourZhiIndex: number): TianGan {
  // 时干计算：(日干索引 % 5) * 2 + 时辰地支索引
  const baseIndex = (dayGanIndex % 5) * 2;
  return getTianGan(baseIndex + hourZhiIndex);
}

/**
 * 计算八字四柱
 * @param birthDate - 出生日期时间
 * @returns 八字四柱
 */
export function calculateSiZhu(birthDate: Date): SiZhu {
  const solar = Solar.fromDate(birthDate);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();

  // 年柱
  const yearGan = eightChar.getYearGan() as TianGan;
  const yearZhi = eightChar.getYearZhi() as DiZhi;

  // 月柱
  const monthGan = eightChar.getMonthGan() as TianGan;
  const monthZhi = eightChar.getMonthZhi() as DiZhi;

  // 日柱
  const dayGan = eightChar.getDayGan() as TianGan;
  const dayZhi = eightChar.getDayZhi() as DiZhi;

  // 时柱
  const timeGan = eightChar.getTimeGan() as TianGan;
  const timeZhi = eightChar.getTimeZhi() as DiZhi;

  return {
    year: { tianGan: yearGan, diZhi: yearZhi },
    month: { tianGan: monthGan, diZhi: monthZhi },
    day: { tianGan: dayGan, diZhi: dayZhi },
    hour: { tianGan: timeGan, diZhi: timeZhi },
  };
}

/**
 * 统计八字五行分布
 * @param siZhu - 八字四柱
 * @returns 五行统计
 */
export function calculateWuXingCount(siZhu: SiZhu): WuXingCount {
  const count: WuXingCount = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };

  // 统计天干五行
  const tianGans = [siZhu.year.tianGan, siZhu.month.tianGan, siZhu.day.tianGan, siZhu.hour.tianGan];
  for (const gan of tianGans) {
    count[TIAN_GAN_WU_XING[gan]]++;
  }

  // 统计地支五行（主气）
  const diZhis = [siZhu.year.diZhi, siZhu.month.diZhi, siZhu.day.diZhi, siZhu.hour.diZhi];
  for (const zhi of diZhis) {
    count[DI_ZHI_WU_XING[zhi]]++;
  }

  // 统计地支藏干（加权计算）
  for (const zhi of diZhis) {
    const cangGan = DI_ZHI_CANG_GAN[zhi];
    for (let i = 0; i < cangGan.length; i++) {
      // 本气权重最高，余气次之
      const weight = i === 0 ? 0.6 : i === 1 ? 0.3 : 0.1;
      count[TIAN_GAN_WU_XING[cangGan[i]]] += weight;
    }
  }

  // 四舍五入到一位小数
  for (const key of Object.keys(count) as Array<keyof WuXingCount>) {
    count[key] = Math.round(count[key] * 10) / 10;
  }

  return count;
}

/**
 * 格式化干支为字符串
 * @param ganZhi - 干支对象
 * @returns 干支字符串
 */
export function formatGanZhi(ganZhi: GanZhi): string {
  return `${ganZhi.tianGan}${ganZhi.diZhi}`;
}

/**
 * 格式化四柱为字符串
 * @param siZhu - 四柱对象
 * @returns 四柱字符串
 */
export function formatSiZhu(siZhu: SiZhu): string {
  return `${formatGanZhi(siZhu.year)} ${formatGanZhi(siZhu.month)} ${formatGanZhi(siZhu.day)} ${formatGanZhi(siZhu.hour)}`;
}

/**
 * 计算八字四柱（支持不知道出生时间的情况）
 * @param birthDate - 出生日期时间
 * @param knowBirthTime - 是否知道出生时间
 * @param isEarlyZiHour - 是否早子时
 * @returns 八字四柱
 */
export function calculateSiZhuWithOptions(
  birthDate: Date, 
  knowBirthTime: boolean = true,
  isEarlyZiHour?: boolean
): SiZhu {
  const solar = Solar.fromDate(birthDate);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();

  // 年柱
  const yearGan = eightChar.getYearGan() as TianGan;
  const yearZhi = eightChar.getYearZhi() as DiZhi;

  // 月柱
  const monthGan = eightChar.getMonthGan() as TianGan;
  const monthZhi = eightChar.getMonthZhi() as DiZhi;

  // 日柱
  let dayGan = eightChar.getDayGan() as TianGan;
  let dayZhi = eightChar.getDayZhi() as DiZhi;

  // 时柱处理
  let timeGan: TianGan;
  let timeZhi: DiZhi;

  if (!knowBirthTime) {
    // 不知道出生时间时，时柱使用占位符（默认使用午时）
    // 午时（11:00-13:00）是一天的中间时辰
    timeGan = '甲' as TianGan; // 占位符
    timeZhi = '午' as DiZhi;   // 使用午时作为默认
  } else {
    timeGan = eightChar.getTimeGan() as TianGan;
    timeZhi = eightChar.getTimeZhi() as DiZhi;
    
    // 早晚子时处理
    // 子时（23:00-01:00）跨越两天
    // 早子时（23:00-24:00）：属于当日，日柱不变
    // 晚子时（00:00-01:00）：属于次日，日柱已在原始计算中正确处理
    const hour = birthDate.getHours();
    if (hour === 23 && isEarlyZiHour === false) {
      // 如果是23点但用户选择晚子时（属于次日），需要调整日柱到次日
      // 这种情况较少见，一般23点默认为早子时
      const nextDay = new Date(birthDate);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);
      const nextSolar = Solar.fromDate(nextDay);
      const nextLunar = nextSolar.getLunar();
      const nextEightChar = nextLunar.getEightChar();
      dayGan = nextEightChar.getDayGan() as TianGan;
      dayZhi = nextEightChar.getDayZhi() as DiZhi;
    }
  }

  return {
    year: { tianGan: yearGan, diZhi: yearZhi },
    month: { tianGan: monthGan, diZhi: monthZhi },
    day: { tianGan: dayGan, diZhi: dayZhi },
    hour: { tianGan: timeGan, diZhi: timeZhi },
  };
}

/** 地支对应生肖（十二生肖） */
const DI_ZHI_ZODIAC: Record<DiZhi, string> = {
  '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔',
  '辰': '龙', '巳': '蛇', '午': '马', '未': '羊',
  '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪',
};

/**
 * 计算完整的个人八字信息
 * @param name - 姓名
 * @param gender - 性别
 * @param birthDate - 出生日期时间
 * @param knowBirthTime - 是否知道出生时间，默认为 true
 * @param isEarlyZiHour - 是否早子时（仅在子时有效）
 * @returns 个人八字信息
 */
export function calculatePersonBazi(
  name: string, 
  gender: Gender, 
  birthDate: Date,
  knowBirthTime: boolean = true,
  isEarlyZiHour?: boolean
): PersonBazi {
  const siZhu = knowBirthTime 
    ? calculateSiZhuWithOptions(birthDate, true, isEarlyZiHour)
    : calculateSiZhuWithOptions(birthDate, false);
  
  const wuXingCount = calculateWuXingCount(siZhu);
  const riYuan = siZhu.day.tianGan;
  const riYuanWuXing = TIAN_GAN_WU_XING[riYuan];

  // 计算农历年份的生肖（按农历春节划分，符合民俗习惯）
  const solar = Solar.fromDate(birthDate);
  const lunar = solar.getLunar();
  // 获取农历年份的地支（lunar-typescript 按春节划分）
  const lunarYearZhi = lunar.getYearZhi() as DiZhi;
  const zodiac = DI_ZHI_ZODIAC[lunarYearZhi] as PersonBazi['zodiac'];
  
  // 命主
  const mingZhu = `${riYuan}${riYuanWuXing}`;

  return {
    name,
    gender,
    birthDate,
    siZhu,
    wuXingCount,
    riYuan,
    riYuanWuXing,
    zodiac,
    mingZhu,
    knowBirthTime,
    isEarlyZiHour,
  };
}
